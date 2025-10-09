const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Reservation = require('../models/Reservation');
const PremiumSubscription = require('../models/PremiumSubscription');

// ✅ Frais d'annulation avec réduction Premium
router.post('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    // Vérifier si l'utilisateur a Premium
    const premium = await PremiumSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    // Calculer les frais d'annulation
    const baseFee = reservation.prixTotal * 0.1; // 10% de base
    const cancellationFee = premium ? baseFee * 0.5 : baseFee; // 50% de réduction si Premium

    // Mettre à jour la réservation
    reservation.status = 'annulée';
    reservation.cancellationFee = cancellationFee;
    reservation.cancelledAt = new Date();
    await reservation.save();

    res.json({
      message: "Réservation annulée",
      cancellationFee,
      premiumDiscount: premium ? true : false
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;