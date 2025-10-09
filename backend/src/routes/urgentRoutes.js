const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Reservation = require('../models/Reservation');

// ✅ Mode Express/Urgent avec majoration dynamique
router.post('/urgent-booking', verifyToken, async (req, res) => {
  try {
    const { service, adresse, urgencyLevel } = req.body;
    
    // Calculer la majoration selon l'urgence
    let surcharge = 1;
    switch(urgencyLevel) {
      case 'express_2h': surcharge = 1.5; break; // +50%
      case 'urgent_1h': surcharge = 2.0; break;  // +100%
      case 'immediate': surcharge = 2.5; break;  // +150%
      default: surcharge = 1;
    }

    // Prix de base (à adapter selon votre logique)
    const basePrice = 50;
    const finalPrice = basePrice * surcharge;

    const reservation = new Reservation({
      ...req.body,
      client: req.user.id,
      prixTotal: finalPrice,
      isUrgent: true,
      urgencyLevel,
      surcharge: (surcharge - 1) * 100, // % de majoration
      status: 'en_attente_prestataire'
    });

    await reservation.save();

    res.status(201).json({
      message: "Réservation urgente créée",
      reservation,
      surcharge: `+${(surcharge - 1) * 100}%`
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;