const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestataire',
  },
  providerName: {
    type: String,
  },

  date: {
    type: String, // Date + heure combinées simplifiées
    required: true,
  },
  heure: {
    type: String,
    required: true,
  },
  adresse: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  service: {
    type: String,
    required: true,
  },

  validationPin: {
    type: String,
  },

  // ✅ Sécurité paiements - Section 6.1
  executionProof: {
    validated: { type: Boolean, default: false },
    validatedAt: { type: Date },
    validatedBy: { type: String }, // 'client' ou 'provider'
    proofType: { type: String, enum: ['pin', 'photos', 'client_confirmation'] },
    proofData: { type: mongoose.Schema.Types.Mixed }, // PIN, photos URLs, etc.
  },

  paymentSecurity: {
    clientPaid: { type: Boolean, default: false },
    clientPaymentId: { type: String },
    clientAuthorized: { type: Boolean, default: false },
    stripePaymentIntentId: { type: String },
    clientPaymentDate: { type: Date },
    providerPaid: { type: Boolean, default: false },
    providerPaymentId: { type: String },
    providerPaymentDate: { type: Date },
    commission: { type: Number },
    commissionPaid: { type: Boolean, default: false },
  },

  fraudDetection: {
    suspiciousActivity: { type: Boolean, default: false },
    bypassAttempts: [{
      timestamp: { type: Date, default: Date.now },
      type: { type: String }, // 'direct_payment_attempt', 'validation_bypass', etc.
      details: { type: String },
      ipAddress: { type: String },
    }],
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String },
  },

  paid: {
    type: Boolean,
    default: false,
  },
  paymentId: {
    type: String,
    required: false
  },
  paymentDate: {
    type: Date,
    required: false
  },
  paymentDetails: {
    totalAmount: { type: Number },
    applicationFee: { type: Number },
    providerAmount: { type: Number },
    currency: { type: String, default: 'eur' }
  },

  status: {
    type: String,
    enum: [
      'draft',
      'pending',
      'confirmed',
      'cancelled',
      'en attente',
      'attribuée',
      'en cours',
      'terminée',
      'annulée',
      'refused',
      'en_attente_prestataire',
      'en_attente_estimation',
    ],
    default: 'draft',
  },

  categorie: {
    type: String,
    required: true,
  },

  surface: {
    type: Number,
  },

  niveauSalete: {
    type: String,
    enum: ['propre', 'faible', 'modere', 'important', 'critique', 'sale'],
  },

  options: {
    type: Object,
    default: {},
  },

  photos: {
    type: [String],
    default: [],
  },

  prixTotal: {
    type: Number,
  },
  partPrestataire: {
    type: Number,
  },
  partPlateforme: {
    type: Number,
  },

  discountApplied: {
    type: Boolean,
    default: false,
  },

  reprogrammed: {
    type: Boolean,
    default: false,
  },

  // ✅ Motifs d'annulation
  cancellation: {
    reason: {
      type: String,
      enum: [
        'client_change_mind',
        'scheduling_conflict',
        'found_alternative',
        'too_expensive',
        'provider_not_available',
        'provider_emergency',
        'provider_sick',
        'weather',
        'other'
      ],
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    cancelledBy: {
      type: String,
      enum: ['client', 'provider'],
    },
    cancelledAt: {
      type: Date,
    },
  },

  saison: {
    type: String,
    enum: ['hiver', 'printemps', 'ete', 'automne'],
  },

  serviceSpecifique: {
    type: String,
  },

  // ✅ Système de notation
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  ratedAt: {
    type: Date,
  },

  // ✅ Google Calendar
  googleCalendarEventId: {
    type: String,
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Reservation', reservationSchema);

