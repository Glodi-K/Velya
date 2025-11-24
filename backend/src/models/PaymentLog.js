const mongoose = require('mongoose');

const PaymentLogSchema = new mongoose.Schema({
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrestataireSimple',
    required: false
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  applicationFee: {
    type: Number,
    required: true,
    default: 0
  },
  providerAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'eur'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    default: 'stripe'
  },
  stripeTransferId: {
    type: String,
    required: false
  },
  refundId: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
PaymentLogSchema.index({ reservation: 1 });
PaymentLogSchema.index({ client: 1 });
PaymentLogSchema.index({ provider: 1 });
PaymentLogSchema.index({ status: 1 });
PaymentLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PaymentLog', PaymentLogSchema);