// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const AbuseReport = require("../models/AbuseReport");
const verifyToken = require("../middleware/verifyToken");

// ✅ POST — Créer un signalement
router.post("/", verifyToken, async (req, res) => {
  try {
    const { type, description, providerId } = req.body;

    if (!type?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "⛔ Type et description obligatoires." });
    }

    const newReport = new AbuseReport({
      type: type.trim(),
      description: description.trim(),
      user: req.user.id,
      provider: providerId || null,
    });

    await newReport.save();

    res.status(201).json({
      message: "✅ Signalement enregistré. Merci pour votre vigilance.",
      report: newReport,
    });
  } catch (err) {
    console.error("❌ Erreur création rapport :", err);
    res.status(500).json({ message: "❌ Erreur serveur." });
  }
});

// ✅ GET (admin only) — Voir tous les signalements
router.get("/", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "🚫 Accès interdit." });
  }

  try {
    const reports = await AbuseReport.find()
      .populate("user", "name email")
      .populate("provider", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "✅ Rapports récupérés", reports });
  } catch (err) {
    console.error("❌ Erreur récupération rapports :", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

module.exports = router;

