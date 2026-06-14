// Debug script to see full response from verify endpoint
const paymentId = '163754725356';
const backendUrl = process.env.BACKEND_URL || 'https://liderajovem.vercel.app';

async function debugVerify() {
  console.log(`🔍 Enviando requisição para: ${backendUrl}/api/mercado-pago/verify\n`);

  try {
    const response = await fetch(`${backendUrl}/api/mercado-pago/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });

    console.log(`Status HTTP: ${response.status} ${response.statusText}`);
    console.log('Headers:');
    response.headers.forEach((value, key) => console.log(`  ${key}: ${value}`));
    console.log('');

    const text = await response.text();
    console.log('Response body (primeiros 2000 chars):');
    console.log(text.slice(0, 2000));
    console.log('');

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('JSON parseado:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('⚠️ Resposta OK mas não é JSON válido');
      }
    } else {
      console.log(`❌ Erro ${response.status}. Verifique os logs do Vercel.`);
    }
  } catch (err) {
    console.error('❌ Erro ao fazer fetch:', err.message);
  }
}

debugVerify();
