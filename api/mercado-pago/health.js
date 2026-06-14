module.exports = async function handler(req, res) {
  try {
    console.log('[Health Check] Recebida requisição:', req.method, req.url);
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasMercadopagoToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('[Health Check] Erro:', error);
    return res.status(500).json({ error: error.message });
  }
};
