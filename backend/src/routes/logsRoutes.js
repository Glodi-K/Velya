// routes/logsRoutes.js
const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const verifyToken = require("../middleware/verifyToken");

// ✅ GET /api/logs — réservé admin
router.get("/", verifyToken, async (req, res) => {
  try {
    // 🔒 Vérification du rôle admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "⛔ Accès restreint" });
    }

    // 📥 Récupération des logs récents
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 }) // du plus récent au plus ancien
      .limit(100)
      .populate("user", "name email");

    res.status(200).json(logs); // 🔁 on renvoie directement le tableau (pas { logs })
  } catch (err) {
    console.error("❌ Erreur récupération logs :", err);
    res.status(500).json({ message: "❌ Erreur serveur lors du chargement des logs." });
  }
});

module.exports = router;

