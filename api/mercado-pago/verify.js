const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');

function getFirestoreDb() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('[Firebase Init] Detectada FIREBASE_SERVICE_ACCOUNT_KEY em base64. Decodificando...');
      const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      console.log('[Firebase Init] Credenciais parseadas. Project ID:', serviceAccount.project_id);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('[Firebase Init] Admin SDK inicializado com sucesso');
    } else {
      console.warn('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY não encontrada. Tentando inicialização default...');
      admin.initializeApp();
    }
    return admin.firestore();
  } catch (error) {
    console.error('[Firebase Init] Erro ao inicializar Firebase:', error.message);
    console.error('[Firebase Init] Stack:', error.stack);
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
  +    console.log('[Verify] === INICIANDO HANDLER ===');
    const { paymentId, userId } = req.body;
  +    console.log('[Verify] paymentId:', paymentId, 'userId:', userId);

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  +    console.log('[Verify] Token MP carregado:', !!token);
    const firestoreDb = getFirestoreDb();
  +    console.log('[Verify] Firestore inicializado:', !!firestoreDb);

    if (!token) {
      return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' });
    }

    if (!firestoreDb) {
      return res.status(500).json({ error: 'Firestore não inicializado.' });
    }

  +    console.log('[Verify] Criando cliente MercadoPago...');
    const client = new MercadoPagoConfig({ accessToken: token });
    const paymentClient = new Payment(client);
  +    console.log('[Verify] Cliente criado. Buscando pagamento...');

      console.log(`[Verify] Buscando dados seguros do pagamento ID ${paymentId} na API do Mercado Pago...`);
      const paymentInfo = await paymentClient.get({ id: String(paymentId) });

      if (paymentInfo.status === 'approved') {
        const payUserId = paymentInfo.metadata?.user_id || paymentInfo.metadata?.userId || paymentInfo.metadata?.['user-id'];
        const planType = paymentInfo.metadata?.plan_type || paymentInfo.metadata?.planType || paymentInfo.metadata?.['plan-type'] || 'anual';

        // Use the provided userId as a fallback if metadata didn't register it
        let targetUserId = userId || payUserId || null;
        const payerEmail = paymentInfo.payer?.email || null;

        if (!targetUserId && payerEmail) {
          try {
            const q = await firestoreDb.collection('users').where('email', '==', payerEmail).limit(1).get();
            if (!q.empty) {
              targetUserId = q.docs[0].id;
              console.log(`[Verify] Encontrado usuário por email ${payerEmail}: ${targetUserId}`);
            } else {
              console.warn(`[Verify] Nenhum usuário encontrado com email ${payerEmail}`);
            }
          } catch (err) {
            console.error('[Verify] Erro ao buscar usuário por email:', err);
          }
        }

        if (!targetUserId) {
          return res.status(400).json({ error: 'Não foi possível identificar o userId para este pagamento.' });
        }

        // Atualizar Firestore do usuário
        const userRef = firestoreDb.collection('users').doc(targetUserId);

        let expiresAt = null;
        if (planType === 'anual') {
          expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano
        }

        const updateData = {
          planType: planType,
          paymentStatus: 'approved',
          paymentEmail: payerEmail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (expiresAt) {
          updateData.subscriptionExpiresAt = expiresAt.toISOString();
        } else {
          updateData.subscriptionExpiresAt = null;
        }

        // Usar set com merge para garantir persistência mesmo em novos cadastros
        await userRef.set(updateData, { merge: true });
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
    const errorDetails = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: 'Erro ao processar verificação de pagamento', 
      details: errorDetails,
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      mercadopagoConfigured: !!process.env.MERCADOPAGO_ACCESS_TOKEN
    });
  }
};
