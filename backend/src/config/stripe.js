// config/stripe.js
// Initialise Stripe avec la clé secrète

let stripe;

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe configuré');
} else {
  console.warn('⚠️ Stripe non configuré. Paiements désactivés.');
  stripe = null;
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
  connect_application_fee_percent: 20, // 20% de commission pour l'admin (Tarrification 3)
};

module.exports = {
  stripe,
  endpointSecret,
  paymentOptions,
  transferOptions
};