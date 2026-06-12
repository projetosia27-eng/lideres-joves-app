// Test Mercado Pago API directly to verify payment exists and is approved
const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!token) {
  console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
  process.exit(1);
}

const paymentId = '163754725356';

async function checkPaymentDirectly() {
  console.log(`🔍 Consultando API do Mercado Pago para payment_id: ${paymentId}`);
  console.log('');

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Erro API (${response.status}):`, error);
      return;
    }

    const payment = await response.json();

    console.log('✅ Pagamento encontrado:');
    console.log('');
    console.log('  ID:', payment.id);
    console.log('  Status:', payment.status);
    console.log('  Amount:', payment.transaction_amount, payment.currency_id);
    console.log('  Payer email:', payment.payer?.email);
    console.log('');
    console.log('  Metadata:');
    console.log('    user_id:', payment.metadata?.user_id || payment.metadata?.userId);
    console.log('    plan_type:', payment.metadata?.plan_type || payment.metadata?.planType);
    console.log('');

    if (payment.status === 'approved') {
      console.log('✓ Pagamento está APROVADO!');
      console.log('');
      console.log('Próximo passo: chamar /api/mercado-pago/verify no backend com:');
      console.log(`  paymentId: ${payment.id}`);
      if (payment.metadata?.user_id) {
        console.log(`  userId: ${payment.metadata.user_id}`);
      }
    } else {
      console.log(`⚠️ Pagamento está com status: ${payment.status}`);
    }
  } catch (err) {
    console.error('❌ Erro ao consultar API:', err.message);
  }
}

checkPaymentDirectly();
