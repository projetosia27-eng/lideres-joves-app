import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for Webhooks
let firestoreDb: admin.firestore.Firestore | null = null;
try {
  if (process.env['FIREBASE_SERVICE_ACCOUNT_KEY']) {
    const serviceAccountJson = Buffer.from(process.env['FIREBASE_SERVICE_ACCOUNT_KEY'], 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } else {
    // Attempt default initialization
    if (!admin.apps.length) {
       admin.initializeApp();
    }
  }
  firestoreDb = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin não pôde ser inicializado. Webhooks podem não conseguir atualizar o Firestore.', error);
}

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Add body parser for JSON (to accept base64 image data)
app.use(express.json({ limit: '10mb' }));

// Enable CORS for external access (e.g. from Vercel custom domains)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*']
});

/**
 * Image upload proxy to ImgBB
 */
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, error: 'No image provided' });
      return;
    }

    const apiKey = process.env['IMGBB_API_KEY'];
    
    // Se a chave não estiver configurada ou for a padrão, retornar a própria imagem em base64 como fallback
    if (!apiKey || apiKey === 'MY_IMGBB_API_KEY' || apiKey.trim() === '') {
      res.json({ success: true, data: { url: image } });
      return;
    }

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', image.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
        const text = await response.text();
        
        // Silent fallback for invalid API key, otherwise log the error
        if (!text.includes('Invalid API v1 key')) {
          console.warn('Imgbb error:', response.status, text);
        }
        
        // Em caso de falha (ex: chave inválida), fazer fallback suave para base64
        res.json({ success: true, data: { url: image } });
        return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: unknown) {
    console.error('Upload Error:', err);
    // Em caso de exceção de rede, fallback para base64
    if (req.body && req.body.image) {
      res.json({ success: true, data: { url: req.body.image } });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Handle Mercado Pago Create Preference
 */
app.post('/api/mercado-pago/create-preference', async (req, res) => {
  try {
    const { userId, planType, email, clientOrigin } = req.body;
    
    if (!userId || !planType) {
      res.status(400).json({ error: 'userId and planType are required' });
      return;
    }

    const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
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
      res.status(400).json({ error: 'planType inválido' });
      return;
    }

    const appUrl = process.env['APP_URL'] || req.headers.referer || 'http://localhost:3000/';
    
    // Choose the base redirection path (Vercel custom URL if available)
    const redirectBase = clientOrigin || appUrl;
    const redirectUrl = redirectBase.endsWith('/') ? redirectBase : `${redirectBase}/`;

    // Construct the absolute address of this Express backend for the MP notification Webhook
    const backendBaseUrl = `${req.protocol}://${req.get('host')}`;

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
          email: email || '',
        },
        metadata: {
          user_id: userId,
          plan_type: planType
        },
        back_urls: {
          success: `${redirectUrl}dashboard?pagamento=sucesso`,
          failure: `${redirectUrl}dashboard?pagamento=falha`,
          pending: `${redirectUrl}dashboard?pagamento=pendente`
        },
        auto_return: 'approved',
        notification_url: `${backendBaseUrl}/api/mercado-pago/webhook` // Webhook always hits Cloud Run direct
      }
    });

    res.json({ init_point: prefResult.init_point, id: prefResult.id });
  } catch (err: unknown) {
    console.error('Error creating MercadoPago preference:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

/**
 * Handle Mercado Pago Webhook
 */
app.post('/api/mercado-pago/webhook', async (req, res) => {
  try {
    const topic = req.query['topic'] || req.body.type;
    // O Webhook do MercadoPago pode enviar tanto topic quanto type 
    if (topic === 'payment' || req.body.action === 'payment.created' || req.body.type === 'payment') {
      const paymentId = req.query['id'] || req.body.data?.id;
      
      if (paymentId) {
        const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
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
                
                let expiresAt: Date | null = null;
                if (planType === 'anual') {
                  expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano
                }
                // (vitalício não expira)

                // Executar update
                const updateData: Record<string, unknown> = {
                  planType: planType,
                  paymentStatus: 'approved',
                  paymentEmail: paymentInfo.payer?.email || null,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                
                if (expiresAt) {
                  updateData['subscriptionExpiresAt'] = expiresAt.toISOString();
                } else {
                  updateData['subscriptionExpiresAt'] = null;
                }
                
                await userRef.update(updateData);
                console.log(`Pagamento Mercado Pago Aprovado: Usuário ${userId} liberado (${planType}).`);
              }
           }
        }
      }
    }
    
    // Sempre retornar 200 pro MP
    res.status(200).send('OK');
  } catch (err: unknown) {
    console.error('Error handling MercadoPago webhook:', err);
    res.status(200).send('OK, but error processed internally'); // Retorna 200 pra evitar retrys agressivos do MP
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
