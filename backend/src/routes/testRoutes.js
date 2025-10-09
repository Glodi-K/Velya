const express = require('express');
const router = express.Router();
const Prestataire = require('../models/Prestataire');

// 🔐 Middlewares de sécurité
const verifyToken = require('../middleware/verifyToken');
const checkRoleAndAdmin = require('../middleware/checkRoleAndAdmin');

// ✅ Route de test publique (sans auth)
router.get('/', (req, res) => {
  res.json({ success: true, message: "✅ Route test OK depuis testRoutes.js" });
});

// ✅ Route pour récupérer des prestataires aléatoires disponibles
router.get('/random-prestataires', async (req, res) => {
  try {
    const { service, lat, lng } = req.query;

    if (!service || !lat || !lng) {
      return res.status(400).json({ message: "Paramètres service, lat et lng requis" });
    }

    // Trouver des prestataires disponibles correspondant au service
    const prestataires = await Prestataire.find({
      available: true,
      service: service
    }).limit(10);

    if (!prestataires || prestataires.length === 0) {
      return res.status(404).json({ message: "Aucun prestataire disponible trouvé" });
    }

    // Mélanger et prendre jusqu'à 5 prestataires aléatoires
    const shuffled = prestataires.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    res.status(200).json({ message: "Prestataires disponibles aléatoires", prestataires: selected });
  } catch (error) {
    console.error("Erreur serveur getRandomPrestataires:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// ✅ Route pour mettre à jour la position du prestataire et notifier les clients
router.post("/update-location-tracking", async (req, res) => {
  try {
    const { prestataireId, reservationId, lat, lng, estimatedArrival } = req.body;

    if (!prestataireId || !reservationId || lat == null || lng == null) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    // Mettre à jour la position dans la base de données
    const updated = await Prestataire.findByIdAndUpdate(
      prestataireId,
      {
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        lastUpdated: Date.now()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Récupérer l'instance io depuis l'app
    const io = req.app.get("io");
    
    // Émettre la mise à jour à tous les clients qui suivent cette réservation
    if (io) {
      io.to(`tracking-${reservationId}`).emit("prestataire-location-update", {
        reservationId,
        location: { lat, lng },
        estimatedArrival
      });
    }

    res.json({
      message: "Position mise à jour avec succès",
      location: { lat, lng }
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la position :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// ✅ Route : Admin Client seulement
router.get(
  '/admin/clients',
  verifyToken,
  checkRoleAndAdmin({ requiredRole: 'user', adminOnly: true }),
  (req, res) => {
    res.json({ message: "Bienvenue Admin Client 👑" });
  }
);

// ✅ Route : Prestataire Normal
router.get(
  '/dashboard-prestataire',
  verifyToken,
  checkRoleAndAdmin({ requiredRole: 'prestataire' }),
  (req, res) => {
    res.json({ message: "Bienvenue Prestataire 🧑‍🔧" });
  }
);

// ✅ Route pour récupérer tous les prestataires de la collection "prestataires"
router.get('/get-all-prestataires', async (req, res) => {
  try {
    const Prestataire = require('../models/Prestataire');
    const prestataires = await Prestataire.find({ available: true });
    res.json({ message: "Prestataires récupérés avec succès", prestataires });
  } catch (error) {
    console.error("Erreur lors de la récupération des prestataires:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// ✅ Route : Admin Prestataire seulement
router.get(
  '/admin/prestataires',
  verifyToken,
  checkRoleAndAdmin({ requiredRole: 'prestataire', adminOnly: true }),
  (req, res) => {
    res.json({ message: "Bienvenue Admin Prestataire 🥂" });
  }
);

module.exports = router;

