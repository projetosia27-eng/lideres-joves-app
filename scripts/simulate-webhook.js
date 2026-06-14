// Simulate a Mercado Pago webhook call directly to webhook.js
// This tests if webhook logic works without needing HTTP

const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// Initialize Firebase with service account from env
function initFirebase() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      console.log('✓ Firebase Admin inicializado com FIREBASE_SERVICE_ACCOUNT_KEY');
      return true;
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY não encontrado no ambiente');
      return false;
    }
  } catch (err) {
    console.error('❌ Erro ao inicializar Firebase:', err.message);
    return false;
  }
}

async function simulateWebhook() {
  console.log('\n🔄 Simulando webhook do Mercado Pago...\n');

  const paymentId = '163754725356';
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
    return;
  }

  if (!initFirebase()) {
    console.error('❌ Firebase não inicializado');
    return;
  }

  try {
    const db = admin.firestore();
    const client = new MercadoPagoConfig({ accessToken: token });
    const paymentClient = new Payment(client);

    console.log(`📥 Buscando pagamento ${paymentId} da API do Mercado Pago...`);
    const paymentInfo = await paymentClient.get({ id: String(paymentId) });

    console.log(`✓ Status do pagamento: ${paymentInfo.status}\n`);

    if (paymentInfo.status === 'approved') {
      const metadataUserId = paymentInfo.metadata?.user_id || paymentInfo.metadata?.userId;
      const planType = paymentInfo.metadata?.plan_type || 'anual';
      let targetUserId = metadataUserId || null;
      const payerEmail = paymentInfo.payer?.email || null;

      console.log(`📋 Dados do pagamento:`);
      console.log(`  - Metadata user_id: ${metadataUserId || '(não encontrado)'}`);
      console.log(`  - Plan type: ${planType}`);
      console.log(`  - Payer email: ${payerEmail}\n`);

      // Fallback por email se não tiver user_id em metadata
      if (!targetUserId && payerEmail) {
        console.log(`🔍 Procurando usuário por email ${payerEmail}...`);
        try {
          const q = await db.collection('users').where('email', '==', payerEmail).limit(1).get();
          if (!q.empty) {
            targetUserId = q.docs[0].id;
            console.log(`✓ Encontrado: ${targetUserId}\n`);
          } else {
            console.warn(`⚠️ Nenhum usuário encontrado com email ${payerEmail}\n`);
          }
        } catch (err) {
          console.error('❌ Erro ao buscar usuário por email:', err.message);
        }
      }

      if (targetUserId) {
        const userRef = db.collection('users').doc(targetUserId);

        let expiresAt = null;
        if (planType === 'anual') {
          expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
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

        console.log(`📝 Atualizando documento do usuário ${targetUserId}...\n`);
        console.log('Dados a serem gravados:');
        console.log(JSON.stringify(updateData, null, 2));
        console.log('');

        await userRef.set(updateData, { merge: true });

        console.log('✅ Documento atualizado com sucesso!\n');

        // Verify by reading back
        const updated = await userRef.get();
        console.log('✓ Dados confirmados no Firestore:');
        console.log(JSON.stringify(updated.data(), null, 2));
      } else {
        console.error('❌ Não foi possível identificar o userId');
      }
    } else {
      console.log(`⚠️ Pagamento com status: ${paymentInfo.status}`);
    }
  } catch (err) {
    console.error('❌ Erro na simulação:', err.message);
    console.error(err);
  }
}

simulateWebhook();
