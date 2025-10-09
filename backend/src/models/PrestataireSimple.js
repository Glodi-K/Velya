const mongoose = require('mongoose');

const PrestataireSimpleSchema = new mongoose.Schema({
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
  selfieImagePath: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ['prestataire'],
    default: 'prestataire',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'prestataires'
});

PrestataireSimpleSchema.virtual('name').get(function() {
  return this.nom;
});

const PrestataireSimple = mongoose.model('PrestataireSimple', PrestataireSimpleSchema);
module.exports = PrestataireSimple;