const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getReferralCode,
  applyReferralCode,
  getReferrals
} = require('../controllers/referralController');

/**
 * @route GET /api/referrals/code
 * @desc Récupère ou génère un code de parrainage pour l'utilisateur connecté
 * @access Private
 */
router.get('/code', verifyToken, getReferralCode);

/**
 * @route POST /api/referrals/apply
 * @desc Applique un code de parrainage
 * @access Private
 */
router.post('/apply', verifyToken, applyReferralCode);

/**
 * @route GET /api/referrals
 * @desc Récupère la liste des filleuls de l'utilisateur connecté
 * @access Private
 */
router.get('/', verifyToken, getReferrals);

/**
 * @route GET /api/referrals/:userId
 * @desc Récupère la liste des filleuls d'un utilisateur spécifique
 * @access Private (Admin ou utilisateur concerné)
 */
router.get('/:userId', verifyToken, getReferrals);

module.exports = router;