const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// Initialize Firebase Admin for Webhooks (Lazy load for serverless)
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const topic = req.query.topic || req.body.type;
    // O Webhook do MercadoPago pode enviar tanto topic quanto type 
    if (topic === 'payment' || req.body.action === 'payment.created' || req.body.type === 'payment') {
      const paymentId = req.query.id || req.body?.data?.id;
      
      if (paymentId) {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const firestoreDb = getFirestoreDb();
        
        if (token && firestoreDb) {
           const client = new MercadoPagoConfig({ accessToken: token });
           const paymentClient = new Payment(client);
           
           // Buscar informações detalhadas do pagamento
           const paymentInfo = await paymentClient.get({ id: String(paymentId) });
           
           if (paymentInfo.status === 'approved') {
              const userId = paymentInfo.metadata?.user_id;
              const planType = paymentInfo.metadata?.plan_type;
              
              if (userId && planType) {
                // Atualizar Firestore para aprovar o usuário (Liberar aplicativo)
                const userRef = firestoreDb.collection('users').doc(userId);
                
                let expiresAt = null;
                if (planType === 'anual') {
                  expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano
                }
                // (vitalício não expira)

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
                
                await userRef.update(updateData);
                console.log(`Pagamento Mercado Pago Aprovado: Usuário ${userId} liberado (${planType}).`);
              }
           }
        }
      }
    }
    
    // Always return 200 OK so MercadoPago stops retrying
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook de Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}
