// config/stripe.js
// Initialise Stripe avec la clé secrète

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Vérification que les clés Stripe sont configurées
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
  console.error('⚠️ ERREUR: Clés Stripe non configurées dans .env');
  console.error('Consultez STRIPE_LIVE_SETUP.md pour la configuration');
}

// Configuration des webhooks pour la vérification de signature
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Configuration des options de paiement par défaut
const paymentOptions = {
  payment_method_types: ['card'],
  currency: 'eur',
  statement_descriptor: 'VELYA',
  automatic_payment_methods: {
    enabled: true,
  }
};

// Configuration pour les transferts aux prestataires
const transferOptions = {
  destination_charge_enabled: true,
  connect_application_fee_percent: 15, // 15% de commission - standardisé dans toute l'application
};

module.exports = {
  stripe,
  endpointSecret,
  paymentOptions,
  transferOptions
};