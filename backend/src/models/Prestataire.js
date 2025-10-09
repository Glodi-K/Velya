const mongoose = require('mongoose');

const PrestataireSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
  },

  nomEntreprise: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  identityFilePath: {
    type: String,
    required: false,
  },
  service: {
    type: String,
    required: false,
    trim: true,
  },
  // location: {
  //   type: {
  //     type: String,
  //     enum: ['Point'],
  //   },
  //   coordinates: {
  //     type: [Number], // [longitude, latitude]
  //   },
  // },
  availability: {
    type: [Date],
    required: false,
  },
  available: {
    type: Boolean,
    default: false,
  },

  // ✅ Rôle du prestataire
  role: {
    type: String,
    enum: ['provider'],
    default: 'provider',
  },

  // ✅ Admin prestataire ?
  isAdmin: {
    type: Boolean,
    default: false,
  },

  // ✅ Informations Stripe pour les paiements
  stripeAccountId: {
    type: String,
    default: null,
  },
  stripeAccountVerified: {
    type: Boolean,
    default: false,
  },
  stripeAccountDetails: {
    type: Object,
    default: null,
  },

  // ✅ Informations bancaires (stockées de manière sécurisée via Stripe)
  bankAccountLastFour: {
    type: String,
    default: null,
  },
  bankAccountType: {
    type: String,
    default: null,
  },

  // ✅ Statistiques de paiement
  totalEarnings: {
    type: Number,
    default: 0,
  },
  pendingPayouts: {
    type: Number,
    default: 0,
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PrestataireSchema.virtual('name').get(function() {
  return this.nom;
});

// 📍 Index géospatial (désactivé temporairement)
// PrestataireSchema.index({ location: '2dsphere' });

const Prestataire = mongoose.model('Prestataire', PrestataireSchema);
module.exports = Prestataire;
