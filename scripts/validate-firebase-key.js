#!/usr/bin/env node
const admin = require('firebase-admin');

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!b64) {
  exitWith('FIREBASE_SERVICE_ACCOUNT_KEY não encontrado no ambiente. Exporte a variável e rode novamente.');
}

let jsonRaw;
try {
  jsonRaw = Buffer.from(b64, 'base64').toString('utf8');
} catch (e) {
  exitWith('Falha ao decodificar base64: ' + (e.message || e));
}

let obj;
try {
  obj = JSON.parse(jsonRaw);
} catch (e) {
  console.error('Conteúdo decodificado não é um JSON válido. Saída parcial:');
  console.error(jsonRaw.slice(0, 500));
  exitWith('Erro ao parsear JSON: ' + (e.message || e));
}

console.log('Chave decodificada com sucesso. Project ID:', obj.project_id || '(não encontrado)');

try {
  admin.initializeApp({
    credential: admin.credential.cert(obj),
  });
  const db = admin.firestore();
  console.log('Firebase Admin inicializado com sucesso. Tentando acessar Firestore...');
  console.log('Admin app projectId:', admin.app().options.projectId || '(não definido)');

  (async () => {
    try {
      const collections = await db.listCollections();
      console.log('Collections encontradas (até 10):', collections.slice(0, 10).map(c => c.id));
      console.log('Validação concluída com sucesso. Se você vir collections, as credenciais funcionam.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao acessar Firestore:', err.code || '(sem code)', err.message || err);
      if (err.code === 5) {
        console.error('Verifique se o Firestore está ativado no projeto e se o banco de dados padrão existe.');
      }
      process.exit(2);
    }
  })();
} catch (err) {
  console.error('Erro ao inicializar Firebase Admin:', err.message || err);
  process.exit(3);
}
