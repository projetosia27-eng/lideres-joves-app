// Check if document was updated in Firestore (via REST API)
// This doesn't require service account credentials

const userId = 'r9teHDRvhVRTHG2JGVOI2Fr9g1o2';

async function checkViaRest() {
  console.log('\n📋 Consultando Firestore via REST API...\n');

  // Get Firebase config from firebase-applet-config.json or similar
  // For REST API, we need projectId - try to read from local config
  
  let projectId = 'gen-lang-client-0647760479';
  let databaseId = 'ai-studio-9b77432b-ddce-4306-8700-63a5100592b9';
  
  // Try reading from firebase config if available
  try {
    const fs = require('fs');
    if (fs.existsSync('firebase-applet-config.json')) {
      const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
      projectId = config.projectId || projectId;
      databaseId = config.firestoreDatabaseId || databaseId;
    }
  } catch (e) {
    // Use fallback
  }

  console.log(`Project: ${projectId}`);
  console.log(`Database: ${databaseId}`);
  console.log(`Document: users/${userId}\n`);

  try {
    // Firestore REST API endpoint (public read if security rules allow)
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}`;
    
    console.log(`GET ${url}\n`);

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      console.log(`HTTP ${response.status}: ${error}\n`);
      
      if (response.status === 401 || response.status === 403) {
        console.log('⚠️ Acesso negado - documento requer autenticação\n');
        console.log('Se o webhook foi acionado, os dados devem estar lá.');
        console.log('Verifique os logs do Vercel > Deployments > Function Logs');
      }
      return;
    }

    const data = await response.json();
    
    if (!data.fields) {
      console.log('❌ Documento não encontrado\n');
      return;
    }

    console.log('✅ Documento encontrado!\n');
    
    const fields = data.fields;
    const getFieldValue = (field) => {
      if (field.stringValue) return field.stringValue;
      if (field.timestampValue) return field.timestampValue;
      return JSON.stringify(field);
    };

    console.log('═════════════════════════════════════════');
    console.log('planType:', getFieldValue(fields.planType || {}) || '(não setado)');
    console.log('paymentStatus:', getFieldValue(fields.paymentStatus || {}) || '(não setado)');
    console.log('paymentEmail:', getFieldValue(fields.paymentEmail || {}) || '(não setado)');
    console.log('subscriptionExpiresAt:', getFieldValue(fields.subscriptionExpiresAt || {}) || '(não setado)');
    console.log('updatedAt:', getFieldValue(fields.updatedAt || {}) || '(não setado)');
    console.log('═════════════════════════════════════════\n');

    if (getFieldValue(fields.paymentStatus || {}) === 'approved') {
      console.log('✓ PAGAMENTO ATIVADO!\n');
    } else {
      console.log('⚠️ Pagamento ainda não foi ativado.\n');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkViaRest();
