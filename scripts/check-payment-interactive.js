// Interactive script to verify payment and suggest Firestore update
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('\n🔍 === Verificador de Pagamento Mercado Pago ===\n');

  const paymentId = '163754725356';
  console.log(`Payment ID: ${paymentId}\n`);

  let token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!token) {
    console.log('⚠️  MERCADOPAGO_ACCESS_TOKEN não encontrado no ambiente.\n');
    token = await prompt('Cole seu token (ou pressione ENTER para sair): ');
    if (!token) {
      console.log('\n❌ Abortado.');
      rl.close();
      return;
    }
  }

  console.log('\n⏳ Consultando API do Mercado Pago...\n');

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, error);
      rl.close();
      return;
    }

    const payment = await response.json();

    console.log('✅ Pagamento encontrado!\n');
    console.log('═══════════════════════════════════');
    console.log(`ID:              ${payment.id}`);
    console.log(`Status:          ${payment.status}`);
    console.log(`Valor:           ${payment.transaction_amount} ${payment.currency_id}`);
    console.log(`Email pagador:   ${payment.payer?.email}`);
    console.log(`Data criação:    ${payment.date_created}`);
    console.log('═══════════════════════════════════\n');

    console.log('Metadata:');
    console.log(`  user_id:     ${payment.metadata?.user_id || payment.metadata?.userId || '(não encontrado)'}`);
    console.log(`  plan_type:   ${payment.metadata?.plan_type || payment.metadata?.planType || 'anual'}`);
    console.log('');

    if (payment.status === 'approved') {
      console.log('✓ Status: APROVADO\n');
      console.log('Para atualizar o Firestore, copie este comando:');
      console.log('');
      console.log(`curl -X POST https://liderajovem.vercel.app/api/mercado-pago/verify \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"paymentId":"${payment.id}"}'`);
      console.log('');
      console.log('Ou, se tiver o userId, use:');
      console.log(`curl -X POST https://liderajovem.vercel.app/api/mercado-pago/verify \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"paymentId":"${payment.id}","userId":"<USER_ID>"}'`);
      console.log('');
    } else {
      console.log(`⚠️  Status: ${payment.status}\n`);
      console.log('O pagamento não está aprovado. Verifique o status no Mercado Pago.\n');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }

  rl.close();
}

main();
