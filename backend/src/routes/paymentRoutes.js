const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
require('dotenv').config();

const Reservation = require('../models/Reservation'); // ✅ importe ton modèle

router.post('/create-checkout-session', async (req, res) => {
  const { reservationId } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ error: "❌ Réservation non trouvée." });
    }

    // ✅ Vérifications strictes
    console.log("🎯 Données à envoyer à Stripe :", {
      name: reservation.service,
      price: reservation.price,
      currency: 'eur',
      user: reservation.user,
      id: reservation._id.toString(),
    });

    if (!reservation.price || isNaN(reservation.price)) {
      return res.status(400).json({ error: "❌ Montant invalide." });
    }

    if (!reservation.service || typeof reservation.service !== 'string') {
      return res.status(400).json({ error: "❌ Nom de service manquant." });
    }

    if (!reservation.user) {
      return res.status(400).json({ error: "❌ Utilisateur manquant." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // ✅ Apple Pay inclus automatiquement
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: reservation.service || 'Service de ménage',
            },
            unit_amount: reservation.price * 100, // ✅ conversion en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: reservation.user.toString() || 'non spécifié',
        reservationId: reservation._id.toString(),
      },
      success_url: 'https://ton-domaine.com/success',
      cancel_url: 'https://ton-domaine.com/cancel',
    });

    res.json({ url: session.url });
    console.log("✅ URL Stripe Checkout :", session.url);

  } catch (error) {
    console.error("❌ Erreur Stripe :", error);
    res.status(500).json({ error: error.message || "Erreur interne serveur." });
  }
});

module.exports = router;

