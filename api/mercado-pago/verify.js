const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');

function getFirestoreDb() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp();
    }
    return admin.firestore();
  } catch (error) {
    console.warn('Firebase Admin não pôde ser inicializado em Serverless.', error);
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
      const payUserId = paymentInfo.external_reference || paymentInfo.metadata?.user_id || paymentInfo.metadata?.userId || paymentInfo.metadata?.['user-id'];
      const planType = paymentInfo.metadata?.plan_type || paymentInfo.metadata?.planType || paymentInfo.metadata?.['plan-type'] || 'anual';

      // Use the provided userId as a fallback if metadata didn't register it
      const targetUserId = userId || payUserId;

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
        paymentEmail: paymentInfo.payer?.email || null,
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
    return res.status(500).json({ error: 'Erro ao processar verificação de pagamento', details: error.message });
  }
};
