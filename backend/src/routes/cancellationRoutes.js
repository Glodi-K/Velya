const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Reservation = require('../models/Reservation');
const PremiumSubscription = require('../models/PremiumSubscription');
const { createAndSendNotification } = require('../utils/notificationHelper');

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

    // ✅ Créer une notification pour le client (annulation confirmée)
    try {
      await createAndSendNotification(
        req.app,
        req.user.id,
        '❌ Annulation confirmée',
        `Votre annulation a été confirmée. Frais d'annulation appliqués: ${cancellationFee.toFixed(2)}€`,
        'message'
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification client:', notificationError);
    }

    // ✅ Créer une notification pour le prestataire (annulation par le client)
    try {
      if (reservation.provider) {
        await createAndSendNotification(
          req.app,
          reservation.provider,
          '❌ Mission annulée par le client',
          `Une mission prévue pour le ${new Date(reservation.date).toLocaleDateString('fr-FR')} a été annulée`,
          'message'
        );
      }
    } catch (providerNotificationError) {
      console.error('Erreur lors de la création de la notification prestataire:', providerNotificationError);
    }

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