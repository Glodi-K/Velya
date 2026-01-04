const Rating = require('../models/Rating');
const Reservation = require('../models/Reservation');
const Prestataire = require('../models/Prestataire');

exports.createRating = async (req, res) => {
  try {
    const { reservationId, rating, comment } = req.body;
    const clientId = req.user.id;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    if (reservation.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (reservation.status !== 'terminée') {
      return res.status(400).json({ message: 'La réservation doit être terminée' });
    }

    const existingRating = await Rating.findOne({ reservation: reservationId });
    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce service' });
    }

    const newRating = await Rating.create({
      reservation: reservationId,
      client: clientId,
      provider: reservation.provider,
      rating,
      comment
    });

    // ✅ Créer une notification pour le prestataire
    try {
      const { createAndSendNotification } = require('../utils/notificationHelper');
      const emoji = rating >= 4 ? '⭐' : rating >= 3 ? '👍' : '📝';
      await createAndSendNotification(
        req.app,
        reservation.provider,
        `${emoji} Nouvel avis de ${rating}/5`,
        `Vous avez reçu un nouvel avis : ${comment || '(Sans commentaire)'}`,
        'message'
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification d\'avis:', notificationError);
    }

    res.status(201).json(newRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProviderRatings = async (req, res) => {
  try {
    const { providerId } = req.params;

    const ratings = await Rating.find({ provider: providerId })
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      ratings,
      average: avgRating.toFixed(1),
      total: ratings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.canRate = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const clientId = req.user.id;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation || reservation.client.toString() !== clientId) {
      return res.json({ canRate: false });
    }

    const existingRating = await Rating.findOne({ reservation: reservationId });
    const canRate = reservation.status === 'terminée' && !existingRating;

    res.json({ canRate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const { providerId } = req.params;

    const ratings = await Rating.find({ provider: providerId });

    const average = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;

    res.json({
      average: parseFloat(average),
      total: ratings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer la note pour une réservation spécifique
exports.getReservationRating = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const rating = await Rating.findOne({ reservation: reservationId })
      .populate('client', 'name');

    if (!rating) {
      return res.status(404).json({ message: 'Aucune note pour cette réservation' });
    }

    res.json({ rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
