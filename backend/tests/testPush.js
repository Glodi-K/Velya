require("dotenv").config();
const { sendPushNotification } = require("../services/notificationService");

// 🔐 Token FCM réel récupéré depuis la console navigateur (⚠️ sans espace ou saut de ligne)
const tokenFCM = "dxL6QLq-BqjoFybLzo_55gA9A91bEzBdcYpicBEtYbGoHMIREBXdOFLj1LDpp8b1J9g4j1AhMe4k-LF528kPHcnbajo7w703Kdk4M4ENq3jGZHS7i8PEJ6 8uw8-ZUv7x8sbCeG4WvY".replace(/\s/g, "");

const run = async () => {
  const title = "🔔 Test de notification";
  const body = "Voici un test d’envoi de push avec FCM depuis Node.js 🔥";

  const response = await sendPushNotification(tokenFCM, title, body);

  if (response) {
    console.log("✅ Notification envoyée avec succès :", response);
  } else {
    console.log("❌ Échec de l’envoi de la notification.");
  }

  process.exit();
};

run();

