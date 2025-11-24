const mongoose = require('mongoose');

/**
 * Modèle pour enregistrer les alertes système
 * (notamment les problèmes de paiement/transfert)
 */
const alertLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'PAYMENT_TRANSFER_FAILED',
      'PAYMENT_MISSING_PROVIDER',
      'STRIPE_API_ERROR',
      'WEBHOOK_PROCESSING_ERROR'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'error',
    index: true
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestataire',
    index: true
  },
  paymentSessionId: {
    type: String,
    index: true
  },
  amount: {
    type: Number,
    description: 'Montant en euros'
  },
  reason: {
    type: String,
    description: 'Raison technique de l\'alerte'
  },
  message: {
    type: String,
    description: 'Message d\'alerte lisible'
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: Date,
  resolutionNote: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Index composite pour rechercher les alertes non résolues par type
alertLogSchema.index({ type: 1, resolved: 1, createdAt: -1 });

module.exports = mongoose.model('AlertLog', alertLogSchema);
