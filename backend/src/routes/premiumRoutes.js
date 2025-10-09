const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { requirePremiumFeature } = require("../middleware/featureFlagMiddleware");
const {
  createSubscription,
  getSubscription,
  cancelSubscription,
  checkPremiumStatus
} = require('../controllers/premiumController');

// ✅ Feature flag temporairement désactivé pour le développement
// router.use(requirePremiumFeature);

/**
 * @route POST /api/premium/subscribe
 * @desc Crée un nouvel abonnement Premium
 * @access Private
 */
router.post('/subscribe', verifyToken, createSubscription);

/**
 * @route GET /api/premium/subscription
 * @desc Récupère les détails de l'abonnement Premium de l'utilisateur connecté
 * @access Private
 */
router.get('/subscription', verifyToken, getSubscription);

/**
 * @route GET /api/premium/subscription/:userId
 * @desc Récupère les détails de l'abonnement Premium d'un utilisateur spécifique
 * @access Private (Admin ou utilisateur concerné)
 */
router.get('/subscription/:userId', verifyToken, getSubscription);

/**
 * @route POST /api/premium/cancel
 * @desc Annule l'abonnement Premium de l'utilisateur connecté
 * @access Private
 */
router.post('/cancel', verifyToken, cancelSubscription);

/**
 * @route GET /api/premium/check
 * @desc Vérifie si l'utilisateur connecté a un abonnement Premium actif
 * @access Private
 */
router.get('/check', verifyToken, checkPremiumStatus);

/**
 * @route GET /api/premium/check/:userId
 * @desc Vérifie si un utilisateur spécifique a un abonnement Premium actif
 * @access Private (Admin ou utilisateur concerné)
 */
router.get('/check/:userId', verifyToken, checkPremiumStatus);

/**
 * @route GET /api/premium/plans
 * @desc Récupère les plans d'abonnement disponibles
 * @access Public
 */
router.get('/plans', (req, res) => {
  const plans = {
    client: {
      monthly: {
        id: process.env.STRIPE_PRICE_CLIENT_MONTHLY || 'price_client_monthly',
        name: 'Premium Client Mensuel',
        price: 9.99,
        interval: 'month',
        features: [
          'Réductions de 10% sur tous les services',
          'Réservations prioritaires',
          'Frais d\'annulation réduits de 50%',
          'Support client prioritaire'
        ]
      },
      yearly: {
        id: process.env.STRIPE_PRICE_CLIENT_YEARLY || 'price_client_yearly',
        name: 'Premium Client Annuel',
        price: 99.99,
        interval: 'year',
        features: [
          'Réductions de 10% sur tous les services',
          'Réservations prioritaires',
          'Frais d\'annulation réduits de 50%',
          'Support client prioritaire',
          'Économisez 20% par rapport à l\'abonnement mensuel'
        ]
      }
    },
    provider: {
      monthly: {
        id: process.env.STRIPE_PRICE_PROVIDER_MONTHLY || 'price_provider_monthly',
        name: 'Premium Prestataire Mensuel',
        price: 19.99,
        interval: 'month',
        features: [
          'Commission réduite de 5%',
          'Accès prioritaire aux missions',
          'Profil mis en avant dans les recherches',
          'Support dédié'
        ]
      },
      yearly: {
        id: process.env.STRIPE_PRICE_PROVIDER_YEARLY || 'price_provider_yearly',
        name: 'Premium Prestataire Annuel',
        price: 199.99,
        interval: 'year',
        features: [
          'Commission réduite de 5%',
          'Accès prioritaire aux missions',
          'Profil mis en avant dans les recherches',
          'Support dédié',
          'Économisez 17% par rapport à l\'abonnement mensuel'
        ]
      }
    }
  };
  
  res.status(200).json({ plans });
});

module.exports = router;