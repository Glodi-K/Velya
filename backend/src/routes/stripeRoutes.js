// routes/stripeRoutes.js
// Définit les routes API pour les paiements Stripe

const express = require('express');
const router = express.Router();
const { 
  createCheckoutSession, 
  createPaymentIntent,
  createAccountLink,
  checkAccountStatus
} = require('../controllers/stripeController');
const verifyToken = require('../middleware/verifyToken');

/**
 * @route POST /api/stripe/create-checkout-session
 * @desc Crée une session de paiement Stripe Checkout
 * @access Private
 */
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

/**
 * @route POST /api/stripe/create-payment-intent
 * @desc Crée un payment intent pour un paiement côté client
 * @access Private
 */
router.post('/create-payment-intent', verifyToken, createPaymentIntent);

/**
 * @route GET /api/stripe/config
 * @desc Renvoie la clé publique Stripe pour le frontend
 * @access Public
 */
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

/**
 * @route POST /api/stripe/create-account-link
 * @desc Crée un lien de configuration Stripe Connect pour un prestataire
 * @access Private (prestataires uniquement)
 */
router.post('/create-account-link', verifyToken, createAccountLink);

/**
 * @route POST /api/stripe/onboard-provider
 * @desc Crée un compte Stripe Connect pour un prestataire (ancienne route)
 * @access Private (prestataires uniquement)
 */
// Supprimé car remplacé par create-account-link

/**
 * @route GET /api/stripe/account-status
 * @desc Vérifie le statut du compte Stripe d'un prestataire
 * @access Private (prestataires uniquement)
 */
router.get('/account-status', verifyToken, checkAccountStatus);

// Le webhook est maintenant géré dans stripeWebhook.js

module.exports = router;