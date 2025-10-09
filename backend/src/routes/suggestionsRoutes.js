const express = require("express");
const router = express.Router();
const getSuggestions = require("../utils/getSuggestions");
const verifyToken = require("../middleware/verifyToken");
const Reservation = require("../models/Reservation"); // 🔥 À ajouter

// ✅ GET /api/suggestions/:userId (protégé)
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "⛔ userId manquant" });
    }

    // 📦 Charger l'historique des prestations
    const prestationHistory = await Reservation.find({ client: userId }).select("categorie");

    // 🧠 Appeler le moteur de suggestions avec l'historique
    const suggestions = await getSuggestions(userId, prestationHistory);

    res.json({ suggestions });
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des suggestions :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

