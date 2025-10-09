// config/stripe.js
// Initialise Stripe avec la clé secrète

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuration des webhooks pour la vérification de signature
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Configuration des options de paiement par défaut
const paymentOptions = {
  payment_method_types: ['card'],
  currency: 'usd',
  statement_descriptor: 'VELYA',
  automatic_payment_methods: {
    enabled: true,
  }
};

// Configuration pour les transferts aux prestataires
const transferOptions = {
  destination_charge_enabled: true,
  connect_application_fee_percent: 20, // 20% de commission
};

module.exports = {
  stripe,
  endpointSecret,
  paymentOptions,
  transferOptions
};