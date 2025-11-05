const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // SIN assert

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
