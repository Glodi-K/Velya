// models/PaymentLog.js
// 📊 Modèle pour journaliser tous les paiements - Section 6.1

const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  
  type: {
    type: String,
    enum: [
      'client_payment',
      'provider_payment', 
      'commission_payment',
      'refund',
      'chargeback',
      'dispute'
    ],
    required: true
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Données Stripe/PayPal
  paymentId: String,
  amount: Number,
  currency: { type: String, default: 'usd' },
  status: String,
  
  // Métadonnées de sécurité
  ipAddress: String,
  userAgent: String,
  
}, {
  timestamps: true
});

// Index pour les recherches rapides
paymentLogSchema.index({ reservationId: 1, timestamp: -1 });
paymentLogSchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('PaymentLog', paymentLogSchema);