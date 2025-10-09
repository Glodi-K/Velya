process.env.SMTP_USER = process.env.SMTP_USER || "testuser@gmail.com";
process.env.SMTP_PASS = process.env.SMTP_PASS || "testpassword";

const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mongoose = require("mongoose");
const { stopCron } = require("../routes/reservationRoutes");
const { closeDatabase } = require("../server"); // Assurez-vous d'importer `closeDatabase`

// ✅ Vérifie si Jest est bien en mode test avant d'exécuter afterAll
if (typeof afterAll === "function") {
    afterAll(async () => {
        console.log("🛑 Arrêt du cron après les tests...");
        if (typeof stopCron === "function") {
            stopCron(); // ✅ Vérifie que stopCron est bien une fonction avant de l'exécuter
        } else {
            console.warn("⚠️ stopCron n'est pas une fonction valide.");
        }

        console.log("📌 Fermeture de la connexion MongoDB...");
        await mongoose.connection.close();
        console.log("✅ MongoDB fermé après les tests");

        // 📌 Ajout de la fermeture propre de MongoDB après les tests
        await closeDatabase();
    });
} else {
    console.error("❌ afterAll n'est pas défini. Vérifie ta configuration Jest.");
}

