const express = require("express");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

router.post("/test-email", async (req, res) => {
    try {
        const { email, message } = req.body;
        await sendEmail(email, "Test Email", message);
        res.json({ message: "✅ Email envoyé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

module.exports = router;

