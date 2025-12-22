// routes/earningsRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const PrestataireSimple = require('../models/PrestataireSimple');
const PaymentLog = require('../models/PaymentLog');

/**
 * @route GET /api/earnings/provider
 * @desc Récupère les gains d'un prestataire
 * @access Private (prestataires uniquement)
 */
router.get('/provider', verifyToken, async (req, res) => {
  try {
    const provider = await PrestataireSimple.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Récupérer l'historique des paiements
    const paymentHistory = await PaymentLog.find({ provider: req.user.id })
      .populate('reservation', 'service date')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      totalEarnings: provider.totalEarnings || 0,
      pendingEarnings: provider.pendingEarnings || 0,
      paidEarnings: provider.paidEarnings || 0,
      paymentHistory: paymentHistory.map(log => ({
        id: log._id,
        amount: log.providerAmount,
        service: log.reservation?.service,
        date: log.createdAt,
        status: log.transferStatus || 'completed',
        reservationDate: log.reservation?.date
      }))
    });
  } catch (error) {
    console.error('❌ Erreur récupération gains:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * @route GET /api/earnings/admin/summary
 * @desc Récupère un résumé des gains pour l'admin
 * @access Private (admin uniquement)
 */
router.get('/admin/summary', verifyToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    // Calculer les totaux
    const totalRevenue = await PaymentLog.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Calculer les commissions basées sur les réservations payées
    const totalCommissions = await PaymentLog.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$totalAmount", 0.2] } } } }
    ]);

    const totalProviderPayments = await PaymentLog.aggregate([
      { $group: { _id: null, total: { $sum: "$providerAmount" } } }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCommissions: totalCommissions[0]?.total || 0,
      totalProviderPayments: totalProviderPayments[0]?.total || 0,
      isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false
    });
  } catch (error) {
    console.error('❌ Erreur récupération résumé admin:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;