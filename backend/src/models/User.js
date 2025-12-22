const mongoose = require('mongoose');

// ✅ Définition du schéma utilisateur
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Supprime les espaces inutiles
  },
  email: {
    type: String,
    required: true,
    unique: true, // Empêche la duplication des emails
    lowercase: true, // Convertit en minuscules
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Vérification du format email
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Longueur minimale du mot de passe
  },

  // ✅ Rôle de l'utilisateur
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client',
  },

  // ✅ Admin
  isAdmin: {
    type: Boolean,
    default: false,
  },

  // ✅ Premium
  isPremium: {
    type: Boolean,
    default: false, // Tous les utilisateurs ne sont pas premium par défaut
  },

  // ✅ Liste des prestataires favoris
  favoriteProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestataire',
  }],

  // 🪄 Champs pour le système de parrainage
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Ignore les null dans l'index unique
  },
  referredBy: {
    type: String,
    default: null,
  },
  referralsCount: {
    type: Number,
    default: 0,
  },
  referralRewards: {
    type: Number,
    default: 0,
  },
  hasUsedReferralDiscount: {
    type: Boolean,
    default: false,
  },

  // 🔐 Double authentification (2FA)
  twoFactorCode: {
    type: String,
  },
  twoFactorExpires: {
    type: Date,
  },

  // 📧 Vérification d'email
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
  },
  emailVerificationCode: {
    type: String,
    default: null,
  },
  emailVerificationCodeExpires: {
    type: Date,
    default: null,
  },
  pendingNewEmail: {
    type: String,
    default: null,
  },

  phone: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  identityFilePath: {
    type: String,
    required: false,
  },
  profilePhoto: {
    type: String,
    required: false,
  },

  // 🏢 Données prestataire (si role === 'provider')
  prestataireType: {
    type: String,
    enum: ['independant', 'entreprise', null],
    default: null,
  },
  prestataireData: {
    // Pour prestataire indépendant
    prenom: String,
    nom: String,
    
    // Pour prestataire entreprise
    raisonSociale: String,
    siret: String,
    representantPrenom: String,
    representantNom: String,
  },
}, { timestamps: true }); // createdAt & updatedAt auto

// ✅ Création du modèle
const User = mongoose.model('User', UserSchema);
module.exports = User;

