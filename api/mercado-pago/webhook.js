const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// Initialize Firebase Admin for Webhooks (Lazy load for serverless)
let firestoreProjectId = null;
function getFirestoreDb() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      console.log('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY detectada (webhook). Tentando parsear credenciais...');

      let serviceAccountJson = rawKey;
      if (!serviceAccountJson.trim().startsWith('{')) {
        console.log('[Firebase Init] webhook parece ser base64. Decodificando base64...');
        serviceAccountJson = Buffer.from(rawKey, 'base64').toString('utf-8');
      } else {
        console.log('[Firebase Init] webhook FIREBASE_SERVICE_ACCOUNT_KEY parece ser JSON raw. Usando como está.');
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      firestoreProjectId = serviceAccount.project_id || null;
      console.log('[Firebase Init] webhook serviceAccount project_id=', firestoreProjectId, 'client_email=', serviceAccount.client_email);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firestoreProjectId
      });
      console.log('[Firebase Init] webhook Admin SDK inicializado com sucesso');
    } else {
      console.warn('[Firebase Init] FIREBASE_SERVICE_ACCOUNT_KEY ausente no webhook. Tentando inicialização default...');
      admin.initializeApp();
    }
    return admin.firestore();
  } catch (error) {
    console.error('[Firebase Init] webhook erro ao inicializar Firebase:', error?.message || error);
    console.error('[Firebase Init] webhook Stack:', error?.stack || 'sem stack');
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
      const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id || req.body?.id;
      
      if (paymentId) {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const firestoreDb = getFirestoreDb();
        console.log('[Webhook] admin.apps.length=', admin.apps.length, 'projectId=', firestoreProjectId, 'hasServiceAccountKey=', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
        
        if (token && firestoreDb) {
           // Validar a assinatura de forma robusta e assegurada por canais cruzados
           if (webhookSecret) {
             const xSignature = req.headers['x-signature'];
             const requestId = req.headers['x-request-id'] || req.headers['x-request-id-header'] || '';
             
             if (!xSignature) {
               console.warn('Assinatura x-signature ausente. Continuando processamento consultando a API segura diretamente.');
             } else {
               let ts = '';
               let v1 = '';
               xSignature.split(',').forEach(part => {
                 const index = part.indexOf('=');
                 if (index !== -1) {
                   const k = part.substring(0, index).trim();
                   const v = part.substring(index + 1).trim();
                   if (k === 'ts') ts = v;
                   if (k === 'v1') v1 = v;
                 }
               });

               const crypto = require('crypto');
               const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
               const computedSignature = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

               if (computedSignature !== v1) {
                 console.warn(`Assinatura computada (${computedSignature}) não bate com v1 (${v1}). Validando com API Oficial por segurança.`);
               } else {
                 console.log('Assinatura do webhook Mercado Pago validada com sucesso.');
               }
             }
           }

           const client = new MercadoPagoConfig({ accessToken: token });
           const paymentClient = new Payment(client);
           
           // Buscar informações detalhadas do pagamento
           console.log(`Buscando dados seguros do pagamento ID ${paymentId} na API do Mercado Pago...`);
           const paymentInfo = await paymentClient.get({ id: String(paymentId) });
           
           if (paymentInfo.status === 'approved') {
              const userId = paymentInfo.metadata?.user_id || paymentInfo.metadata?.userId || paymentInfo.metadata?.['user-id'];
              const planType = paymentInfo.metadata?.plan_type || paymentInfo.metadata?.planType || paymentInfo.metadata?.['plan-type'] || 'anual';
              
              if (userId) {
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
                
                // Usamos set com merto para garantir criação/atualização sem falhas
                await userRef.set(updateData, { merge: true });
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
};
