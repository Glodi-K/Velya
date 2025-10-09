// services/notificationService.js
const admin = require('firebase-admin');

// Vérifie que Firebase est bien initialisé
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // ou .cert({...}) si tu as un JSON
  });
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
    console.log("✅ Notification FCM envoyée :", response);
    return response;
  } catch (error) {
    console.error("❌ Erreur envoi notification push :", error.message);
    return null;
  }
};

module.exports = { sendPushNotification };

