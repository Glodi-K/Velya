// services/notificationService.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Vérifie que Firebase est bien initialisé
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'config', 'velya-firebase.json');
  let initialized = false;

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase admin initialisé avec le fichier de service account:', serviceAccountPath);
      initialized = true;
    } catch (e) {
      console.warn('⚠️ Impossible d\'initialiser Firebase avec le fichier service account:', e && e.message ? e.message : e);
    }
  }

  if (!initialized) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      console.log('ℹ️ Firebase admin initialisé avec applicationDefault()');
      initialized = true;
    } catch (e) {
      console.error('❌ Échec initialisation Firebase (applicationDefault):', e && e.message ? e.message : e);
    }
  }
}

const sendPushNotification = async (token, title, body) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification FCM envoyée :', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur envoi notification push :', error && error.message ? error.message : error, error && error.code ? `(code: ${error.code})` : '');
    return null;
  }
};

module.exports = { sendPushNotification };

