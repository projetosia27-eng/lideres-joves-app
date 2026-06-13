const admin = require('firebase-admin');

function initializeFirestore() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não configurado');
    }

    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('[Debug Firestore] serviceAccount project_id:', serviceAccount.project_id || '(missing)');
    console.log('[Debug Firestore] serviceAccount client_email:', serviceAccount.client_email || '(missing)');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return admin.firestore();
  } catch (err) {
    console.error('[Debug Firestore] Falha ao inicializar Firestore:', err);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  try {
    const firestoreDb = initializeFirestore();
    const collections = await firestoreDb.listCollections();
    return res.status(200).json({
      status: 'ok',
      collections: collections.slice(0, 10).map((c) => c.id),
      hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      projectId: firestoreDb.app.options.credential.applicationDefault ? null : firestoreDb.app.options.credential.projectId
    });
  } catch (error) {
    console.error('[Debug Firestore] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
};
