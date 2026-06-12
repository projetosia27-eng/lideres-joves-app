// Try to verify payment locally, if not, generate Vercel setup instructions
const paymentId = '163754725356';
const userId = 'r9teHDRvhVRTHG2JGVOI2Fr9g1o2';

async function tryLocalBackend() {
  console.log('🔍 Tentando chamar backend local em http://localhost:4000...\n');

  try {
    const response = await fetch('http://localhost:4000/api/mercado-pago/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, userId })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Sucesso! Firestore atualizado:');
      console.log(JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`⚠️ Erro ${response.status}:`, data);
      return false;
    }
  } catch (err) {
    console.log('❌ Backend local não disponível (esperado)\n');
    return false;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Verificar & Ativar Pagamento no Firestore');
  console.log('═══════════════════════════════════════════════\n');

  console.log(`Pagamento: ${paymentId}`);
  console.log(`Usuário:   ${userId}`);
  console.log(`Status:    approved ✓\n`);

  const success = await tryLocalBackend();

  if (!success) {
    console.log('═══════════════════════════════════════════════\n');
    console.log('📋 SOLUÇÃO: Configurar Firebase em Vercel\n');
    console.log('1. Obtenha a chave de serviço do Firebase:');
    console.log('   - Firebase Console > Settings > Service Accounts');
    console.log('   - Clique "Generate Private Key"');
    console.log('   - Salve como JSON\n');
    console.log('2. Encode em base64:');
    console.log('   cat firebase-service-account.json | base64\n');
    console.log('3. Copie a saída e adicione em Vercel:');
    console.log('   - Project Settings > Environment Variables');
    console.log('   - Nome: FIREBASE_SERVICE_ACCOUNT_KEY');
    console.log('   - Valor: <SAIDA_BASE64>\n');
    console.log('4. Redeploy e teste novamente:');
    console.log(`   $env:BACKEND_URL='https://liderajovem.vercel.app'; node "scripts/verify-payment.js"\n`);
    
    console.log('ALTERNATIVA (teste local primeiro):');
    console.log('   npm run build');
    console.log('   npm run serve:ssr:app\n');
    console.log('   Depois rode este script novamente.\n');
  }

  console.log('═══════════════════════════════════════════════\n');
}

main();
