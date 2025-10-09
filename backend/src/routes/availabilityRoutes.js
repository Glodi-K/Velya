// routes/availabilityRoutes.js
const express = require("express");
const router = express.Router();
const Availability = require("../models/Availability");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Récupérer les disponibilités du prestataire
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const availabilities = await Availability.find({ provider: req.user.id });

    res.status(200).json(availabilities);
  } catch (err) {
    console.error("❌ Erreur récupération disponibilités :", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Mettre à jour les disponibilités du prestataire
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ message: "⛔ Données de disponibilité invalides." });
    }

    // Supprimer les anciennes disponibilités
    await Availability.deleteMany({ provider: req.user.id });

    // Créer les nouvelles disponibilités
    const newAvailabilities = [];
    Object.keys(availability).forEach(dayOfWeek => {
      const dayData = availability[dayOfWeek];
      if (dayData.start && dayData.end) {
        newAvailabilities.push({
          provider: req.user.id,
          dayOfWeek,
          startTime: dayData.start,
          endTime: dayData.end
        });
      }
    });

    if (newAvailabilities.length > 0) {
      await Availability.insertMany(newAvailabilities);
    }

    res.status(200).json({
      message: "✅ Disponibilités mises à jour avec succès",
      availability: availability
    });
  } catch (err) {
    console.error("❌ Erreur mise à jour disponibilités :", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

module.exports = router;

