// routes/stripeRoutes.js
// Définit les routes API pour les paiements Stripe

const express = require('express');
const router = express.Router();
const { createCheckoutSession, createPaymentIntent } = require('../controllers/stripeController');
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
 * @route POST /api/stripe/onboard-provider
 * @desc Crée un compte Stripe Connect pour un prestataire
 * @access Private (prestataires uniquement)
 */
router.post('/onboard-provider', verifyToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un prestataire
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const { stripe } = require('../config/stripe');
    const Prestataire = require('../models/Prestataire');

    // Récupérer le prestataire
    const provider = await Prestataire.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }
    
    // Si le prestataire a déjà un compte Stripe
    if (provider.stripeAccountId) {
      // Créer un lien pour mettre à jour le compte
      const accountLink = await stripe.accountLinks.create({
        account: provider.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/dashboard-prestataire/stripe-refresh`,
        return_url: `${process.env.FRONTEND_URL}/dashboard-prestataire/stripe-success`,
        type: 'account_onboarding',
      });
      
      return res.json({ url: accountLink.url });
    }
    
    // Créer un nouveau compte Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      email: provider.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        providerId: provider._id.toString(),
      },
    });
    
    // Mettre à jour le prestataire avec l'ID du compte Stripe
    provider.stripeAccountId = account.id;
    await provider.save();
    
    // Créer un lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard-prestataire/stripe-refresh`,
      return_url: `${process.env.FRONTEND_URL}/dashboard-prestataire/stripe-success`,
      type: 'account_onboarding',
    });
    
    res.json({ url: accountLink.url });
  } catch (error) {
    console.error("❌ Erreur onboarding Stripe:", error);
    res.status(500).json({ message: "Erreur lors de la création du compte Stripe" });
  }
});

/**
 * @route GET /api/stripe/account-status
 * @desc Vérifie le statut du compte Stripe d'un prestataire
 * @access Private (prestataires uniquement)
 */
router.get('/account-status', verifyToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un prestataire
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    const { stripe } = require('../config/stripe');
    const Prestataire = require('../models/Prestataire');

    // Récupérer le prestataire
    const provider = await Prestataire.findById(req.user.id);
    if (!provider || !provider.stripeAccountId) {
      return res.json({ 
        hasAccount: false,
        verified: false,
        details: null
      });
    }
    
    // Récupérer les détails du compte Stripe
    const account = await stripe.accounts.retrieve(provider.stripeAccountId);
    
    // Vérifier si le compte est vérifié
    const isVerified = 
      account.details_submitted && 
      account.charges_enabled && 
      account.payouts_enabled;
    
    // Mettre à jour le statut dans la base de données
    if (provider.stripeAccountVerified !== isVerified) {
      provider.stripeAccountVerified = isVerified;
      provider.stripeAccountDetails = {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        lastUpdated: new Date()
      };
      await provider.save();
    }
    
    res.json({
      hasAccount: true,
      verified: isVerified,
      details: {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      }
    });
  } catch (error) {
    console.error("❌ Erreur vérification compte Stripe:", error);
    res.status(500).json({ message: "Erreur lors de la vérification du compte Stripe" });
  }
});

module.exports = router;