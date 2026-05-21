import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Add body parser for JSON (to accept base64 image data)
app.use(express.json({ limit: '10mb' }));

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
