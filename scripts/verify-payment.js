// Test verify endpoint with actual payment_id
const paymentId = '163754725356';

async function verifyPayment() {
  const backendUrl = process.env.BACKEND_URL || 'https://lideres-joves-app-production.up.railway.app';

  console.log(`📤 Verificando pagamento ${paymentId} no backend: ${backendUrl}`);
  console.log('');

  try {
    const response = await fetch(`${backendUrl}/api/mercado-pago/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });

    const data = await response.json();
    console.log(`✅ Status HTTP: ${response.status}`);
    console.log('');
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    console.log('');

    if (data.success) {
      console.log(`✓ Pagamento ativado!`);
      console.log(`  planType: ${data.planType}`);
      console.log(`  userId: ${data.userId}`);
    } else {
      console.log('⚠️ Pagamento não foi ativado. Verifique os logs do backend.');
    }
  } catch (err) {
    console.error('❌ Erro ao chamar verify:', err.message);
  }
}

verifyPayment();
