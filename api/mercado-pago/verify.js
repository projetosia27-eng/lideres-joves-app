const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const fs = require('fs');
const path = require('path');

let firestoreProjectId = null;
function getFirestoreDatabaseId() {
  if (process.env.FIRESTORE_DATABASE_ID) {
    return process.env.FIRESTORE_DATABASE_ID;
  }

  try {
    const configPath = path.resolve(__dirname, '..', '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId) {
        return config.firestoreDatabaseId;
      }
    }
  } catch (error) {
    console.warn('[Firebase Init] Não foi possível ler firebase-applet-config.json:', error?.message || error);
  }

  return null;
}

function getFirestoreDb() {
  try {
    const databaseId = getFirestoreDatabaseId();
    
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        console.log('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY detectada. Tentando parsear credenciais...');

        let serviceAccountJson = rawKey;
        if (!serviceAccountJson.trim().startsWith('{')) {
          console.log('[Firebase Init] Parece ser base64. Decodificando base64...');
          serviceAccountJson = Buffer.from(rawKey, 'base64').toString('utf-8');
        } else {
          console.log('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY parece ser JSON raw. Usando como está.');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        firestoreProjectId = serviceAccount.project_id || null;
        console.log('[Firebase Init] serviceAccount project_id=', firestoreProjectId, 'client_email=', serviceAccount.client_email);
        const initOptions = {
          credential: admin.credential.cert(serviceAccount),
          projectId: firestoreProjectId
        };
        admin.initializeApp(initOptions);
        console.log('[Firebase Init] Admin SDK inicializado com sucesso');
      } else {
        console.warn('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY ausente. Tentando inicialização default...');
        admin.initializeApp();
      }
    }

    const db = admin.firestore();
    if (databaseId) {
      console.log('[Firebase Init] Usando Firestore databaseId=', databaseId, 'projectId=', firestoreProjectId);
      db.settings({ projectId: firestoreProjectId || undefined, databaseId });
    } else {
      console.log('[Firebase Init] Usando banco Firestore padrão (default)');
    }
    return db;
  } catch (error) {
    console.error('[Firebase Init] Erro ao inicializar Firebase:', error?.message || error);
    console.error('[Firebase Init] Stack:', error?.stack || 'sem stack');
    return null;
  }
}

module.exports = async function handler(req, res) {
  // CORS Setup
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { paymentId, userId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const firestoreDb = getFirestoreDb();
    console.log('[Verify] admin.apps.length=', admin.apps.length, 'projectId=', firestoreProjectId, 'hasServiceAccountKey=', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (!token) {
      return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' });
    }

    if (!firestoreDb) {
      return res.status(500).json({ error: 'Firestore não inicializado.' });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const paymentClient = new Payment(client);

    console.log(`[Verify] Buscando dados seguros do pagamento ID ${paymentId} na API do Mercado Pago...`);
    const paymentInfo = await paymentClient.get({ id: String(paymentId) });

    if (paymentInfo.status === 'approved') {
      const payUserId = paymentInfo.metadata?.user_id || paymentInfo.metadata?.userId || paymentInfo.metadata?.['user-id'];
      const planType = paymentInfo.metadata?.plan_type || paymentInfo.metadata?.planType || paymentInfo.metadata?.['plan-type'] || 'anual';

      // Use the provided userId as a fallback if metadata didn't register it
      const targetUserId = userId || payUserId;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Não foi possível identificar o userId para este pagamento.' });
      }

      // Atualizar Firestore do usuário
      const userRef = firestoreDb.collection('users').doc(targetUserId);
      console.log('[Verify] Firestore userRef path:', userRef.path);

      let expiresAt = null;
      if (planType === 'anual') {
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano
      }

      const updateData = {
        planType: planType,
        paymentStatus: 'approved',
        paymentEmail: paymentInfo.payer?.email || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (expiresAt) {
        updateData.subscriptionExpiresAt = expiresAt.toISOString();
      } else {
        updateData.subscriptionExpiresAt = null;
      }

      try {
        await userRef.set(updateData, { merge: true });
      } catch (firestoreError) {
        console.error('[Verify] Firestore write failed:', firestoreError.code || '(no code)', firestoreError.message || firestoreError);
        console.error('[Verify] Firestore write error details:', firestoreError.details || 'n/a');
        throw firestoreError;
      }
      console.log(`[Verify] Pagamento Aprovado: Usuário ${targetUserId} liberado e salvo (${planType}).`);

      return res.status(200).json({
        success: true,
        message: 'Pagamento ativado com sucesso!',
        planType,
        userId: targetUserId
      });
    } else {
      return res.status(200).json({
        success: false,
        status: paymentInfo.status,
        message: `O status do pagamento é: ${paymentInfo.status}`
      });
    }
  } catch (error) {
    console.error('Erro na verificação de pagamento:', error);
    return res.status(500).json({ error: 'Erro ao processar verificação de pagamento', details: error.message });
  }
};
