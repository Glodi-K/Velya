const mongoose = require('mongoose');

const premiumSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['client', 'provider'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired'],
    default: 'active'
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  stripePriceId: {
    type: String,
    required: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  features: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour rechercher rapidement les abonnements par utilisateur
premiumSubscriptionSchema.index({ user: 1 });

// Index pour rechercher les abonnements qui expirent bientôt
premiumSubscriptionSchema.index({ currentPeriodEnd: 1 });

module.exports = mongoose.model('PremiumSubscription', premiumSubscriptionSchema);