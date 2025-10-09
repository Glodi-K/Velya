const FeatureFlagService = require('../services/featureFlagService');

// Middleware pour les fonctionnalités chat
const requireChatFeature = FeatureFlagService.requireFeature('CHAT_ENABLED');

// Middleware pour les fonctionnalités premium
const requirePremiumFeature = FeatureFlagService.requireFeature('PREMIUM_ENABLED');

// Middleware pour les notifications push
const requirePushFeature = FeatureFlagService.requireFeature('PUSH_NOTIFICATIONS');

// Middleware pour la géolocalisation avancée
const requireGeoFeature = FeatureFlagService.requireFeature('ADVANCED_GEO');

// Middleware pour Stripe
const requireStripeFeature = FeatureFlagService.requireFeature('STRIPE_PAYMENTS');

// Middleware pour ML
const requireMLFeature = FeatureFlagService.requireFeature('ML_OPTIMIZATION');

// Middleware pour le parrainage
const requireReferralFeature = FeatureFlagService.requireFeature('REFERRAL_SYSTEM');

// Middleware de maintenance globale
const maintenanceMode = FeatureFlagService.maintenanceMiddleware();

module.exports = {
  requireChatFeature,
  requirePremiumFeature,
  requirePushFeature,
  requireGeoFeature,
  requireStripeFeature,
  requireMLFeature,
  requireReferralFeature,
  maintenanceMode
};