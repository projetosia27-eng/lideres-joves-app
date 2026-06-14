const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, planType, email, clientOrigin } = req.body;
    
    if (!userId || !planType) {
      return res.status(400).json({ error: 'userId and planType are required' });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não está configurado.');
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    // Configurar o plano
    let title = 'Assinatura LideraJovem';
    let price = 0;
    
    if (planType === 'anual') {
      title = 'LideraJovem - Plano Anual';
      price = 1.00;
    } else if (planType === 'vitalicio') {
      title = 'LideraJovem - Acesso Vitalício';
      price = 1.00;
    } else {
      return res.status(400).json({ error: 'planType inválido' });
    }

    let refererOrigin = 'http://localhost:3000/';
    if (req.headers.referer) {
       try {
         refererOrigin = new URL(req.headers.referer).origin;
       } catch (e) {
         refererOrigin = req.headers.referer;
       }
    }
    const appUrl = process.env.APP_URL || refererOrigin;
    
    const redirectBase = clientOrigin || appUrl;
    // Ensure we use the site root (no extra path) so Mercado Pago redirects don't produce unexpected paths
    const redirectBaseNoSlash = redirectBase.replace(/\/+$/, '');

    // Construct the absolute address of this Express backend for the MP notification Webhook
    // For Vercel, we can rely on standard host headers or env vars
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const backendBaseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${protocol}://${host}`;

    // Cria a preferência de checkout
    const prefResult = await preference.create({
      body: {
        items: [
          {
            id: planType,
            title: title,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: email || undefined
        },
        metadata: {
          user_id: userId,
          plan_type: planType
        },
        back_urls: {
          // Redirect to site root after checkout to avoid 404s and extra path segments
          success: `${redirectBaseNoSlash}/`,
          failure: `${redirectBaseNoSlash}/`,
          pending: `${redirectBaseNoSlash}/`
        },
        auto_return: 'approved',
        notification_url: `${backendBaseUrl}/api/mercado-pago/webhook` // Webhook hits Vercel Serverless
      }
    });

    return res.json({ init_point: prefResult.init_point, id: prefResult.id });
  } catch (err) {
    console.error('Erro ao gerar preferência Mercado Pago:', err);
    return res.status(500).json({ error: 'Falha ao processar pagamento.', details: err.message });
  }
}
