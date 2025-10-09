const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

// ✅ Offres conditionnelles (ex: 3 nettoyages = 15% réduction)
router.get('/conditional-offers/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));

    // Compter les réservations du mois
    const monthlyReservations = await Reservation.countDocuments({
      client: userId,
      status: 'terminée',
      createdAt: { $gte: oneMonthAgo }
    });

    let offer = null;
    if (monthlyReservations >= 3) {
      offer = {
        type: 'loyalty_discount',
        discount: 15,
        message: "🎉 Félicitations ! 15% de réduction sur votre prochain nettoyage",
        eligible: true
      };
    } else {
      offer = {
        type: 'progress',
        needed: 3 - monthlyReservations,
        message: `Plus que ${3 - monthlyReservations} nettoyage(s) pour débloquer 15% de réduction !`,
        eligible: false
      };
    }

    res.json({ offer, monthlyReservations });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Système de points de fidélité
router.get('/points/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const totalReservations = await Reservation.countDocuments({
      client: req.params.userId,
      status: 'terminée'
    });

    // 10 points par réservation terminée
    const points = totalReservations * 10;
    
    // Badges selon les points
    let badge = '';
    if (points >= 100) badge = '🏆 Client VIP';
    else if (points >= 50) badge = '⭐ Client Fidèle';
    else if (points >= 20) badge = '🚀 Client Régulier';

    res.json({ points, badge, totalReservations });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;