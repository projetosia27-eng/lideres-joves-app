// Query Firestore directly to check if payment was updated
const admin = require('firebase-admin');

async function checkFirestore() {
  const userId = 'r9teHDRvhVRTHG2JGVOI2Fr9g1o2';
  
  console.log('\n🔍 Consultando Firestore...\n');

  try {
    // Try with default credentials
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (snapshot.exists) {
      const data = snapshot.data();
      console.log('✅ Documento encontrado!\n');
      console.log('═════════════════════════════════════════');
      console.log('Usuário:', userId);
      console.log('═════════════════════════════════════════\n');

      console.log('planType:', data.planType || '(não setado)');
      console.log('paymentStatus:', data.paymentStatus || '(não setado)', data.paymentStatus === 'approved' ? '✓' : '');
      console.log('paymentEmail:', data.paymentEmail || '(não setado)');
      console.log('subscriptionExpiresAt:', data.subscriptionExpiresAt || '(não setado)');
      console.log('updatedAt:', data.updatedAt || '(não setado)');
      console.log('');

      if (data.paymentStatus === 'approved' && data.planType === 'anual') {
        console.log('✅ PAGAMENTO ATIVADO COM SUCESSO!\n');
        console.log('Plano anual ativado.');
        if (data.subscriptionExpiresAt) {
          const expiresDate = new Date(data.subscriptionExpiresAt);
          console.log(`Expira em: ${expiresDate.toLocaleDateString('pt-BR')}`);
        }
      } else {
        console.log('⚠️ Documento existe mas dados não foram atualizados corretamente.\n');
        console.log('Dados completos:');
        console.log(JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ Documento não encontrado para usuário:', userId);
    }

    console.log('');
  } catch (err) {
    console.error('❌ Erro ao conectar Firestore:', err.message);
    console.log('');
    console.log('💡 Dicas:');
    console.log('1. Se estiver localmente, use: GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
    console.log('2. Se estiver testando remoto, o servidor em Vercel retorna erro 500');
    console.log('3. Verifique os logs em Vercel > Deployments > Function logs');
  }
}

checkFirestore();
