const User = require('../models/User');
const crypto = require('crypto');
const { createAndSendNotification } = require('../utils/notificationHelper');

// Configuration du programme de parrainage
const REFERRAL_CONFIG = {
  // Récompense pour le parrain (en crédits)
  REFERRER_REWARD: 10,
  
  // Récompense pour le filleul (en crédits)
  REFERRED_REWARD: 5,
  
  // Réduction pour le filleul (en pourcentage)
  REFERRED_DISCOUNT: 10
};

/**
 * Génère un code de parrainage unique
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Code de parrainage
 */
const generateReferralCode = (userId) => {
  // Utiliser les 6 premiers caractères de l'ID utilisateur + 4 caractères aléatoires
  const userPart = userId.toString().substring(0, 6);
  const randomPart = crypto.randomBytes(2).toString('hex');
  return `${userPart}${randomPart}`.toUpperCase();
};

/**
 * Crée ou récupère un code de parrainage pour un utilisateur
 */
const getReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    
    // Si l'utilisateur n'a pas encore de code de parrainage, en générer un
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(userId);
      await user.save();
    }
    
    res.status(200).json({
      referralCode: user.referralCode,
      referralsCount: user.referralsCount || 0,
      referralRewards: user.referralRewards || 0
    });
  } catch (error) {
    console.error("❌ Erreur récupération code de parrainage:", error);
    res.status(500).json({ message: "Erreur lors de la récupération du code de parrainage" });
  }
};

/**
 * Applique un code de parrainage lors de l'inscription
 */
const applyReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const userId = req.user.id;
    
    if (!referralCode) {
      return res.status(400).json({ message: "Code de parrainage manquant" });
    }
    
    // Vérifier que l'utilisateur n'a pas déjà utilisé un code de parrainage
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    
    if (user.referredBy) {
      return res.status(400).json({ message: "Vous avez déjà utilisé un code de parrainage" });
    }
    
    // Vérifier que le code de parrainage existe
    const referrer = await User.findOne({ referralCode });
    
    if (!referrer) {
      return res.status(404).json({ message: "Code de parrainage invalide" });
    }
    
    // Vérifier que l'utilisateur ne tente pas d'utiliser son propre code
    if (referrer._id.toString() === userId) {
      return res.status(400).json({ message: "Vous ne pouvez pas utiliser votre propre code de parrainage" });
    }
    
    // Appliquer le code de parrainage
    user.referredBy = referralCode;
    await user.save();
    
    // Incrémenter le compteur de parrainages du parrain
    referrer.referralsCount = (referrer.referralsCount || 0) + 1;
    referrer.referralRewards = (referrer.referralRewards || 0) + REFERRAL_CONFIG.REFERRER_REWARD;
    await referrer.save();
    
    // Ajouter des crédits au filleul
    user.referralRewards = (user.referralRewards || 0) + REFERRAL_CONFIG.REFERRED_REWARD;
    await user.save();

    // ✅ Créer une notification pour le filleul
    try {
      await createAndSendNotification(
        req.app,
        userId,
        '🎁 Bienvenue avec le code de parrainage',
        `Vous avez reçu ${REFERRAL_CONFIG.REFERRED_REWARD} crédits de réduction de ${REFERRAL_CONFIG.REFERRED_DISCOUNT}% !`,
        'system'
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification filleul:', notificationError);
    }

    // ✅ Créer une notification pour le parrain
    try {
      await createAndSendNotification(
        req.app,
        referrer._id,
        '🎉 Nouveau filleul',
        `Quelqu'un a utilisé votre code de parrainage ! Vous avez reçu ${REFERRAL_CONFIG.REFERRER_REWARD} crédits.`,
        'system'
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification parrain:', notificationError);
    }
    
    res.status(200).json({
      message: "Code de parrainage appliqué avec succès",
      reward: REFERRAL_CONFIG.REFERRED_REWARD,
      discount: REFERRAL_CONFIG.REFERRED_DISCOUNT
    });
  } catch (error) {
    console.error("❌ Erreur application code de parrainage:", error);
    res.status(500).json({ message: "Erreur lors de l'application du code de parrainage" });
  }
};

/**
 * Récupère la liste des filleuls d'un utilisateur
 */
const getReferrals = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier que l'utilisateur a le droit d'accéder à ces informations
    if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à accéder à ces informations" });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    
    // Récupérer les filleuls
    const referrals = await User.find({ referredBy: user.referralCode })
      .select('name email createdAt');
    
    res.status(200).json({
      referralsCount: user.referralsCount || 0,
      referralRewards: user.referralRewards || 0,
      referrals
    });
  } catch (error) {
    console.error("❌ Erreur récupération filleuls:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des filleuls" });
  }
};

module.exports = {
  getReferralCode,
  applyReferralCode,
  getReferrals,
  generateReferralCode
};