// controllers/alertController.js
// Gère les alertes système (problèmes de paiement, etc.)

const AlertLog = require('../models/AlertLog');

/**
 * Récupère les alertes non résolues (critique pour l'admin)
 */
const getUnresolvedAlerts = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const alerts = await AlertLog.find({ resolved: false })
      .populate('reservationId', 'date heure prixTotal status')
      .populate('providerId', 'name email')
      .sort({ severity: -1, createdAt: -1 })
      .limit(50);

    res.json({
      total: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('❌ Erreur récupération alertes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
  }
};

/**
 * Récupère les alertes de transfert échoué (paiements bloqués)
 */
const getFailedTransfers = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const failedTransfers = await AlertLog.find({
      type: 'PAYMENT_TRANSFER_FAILED',
      resolved: false
    })
      .populate('reservationId', 'date heure prixTotal status client provider')
      .populate('providerId', 'name email stripeAccountId stripeOnboardingComplete')
      .sort({ createdAt: -1 });

    const totalAmount = failedTransfers.reduce((sum, alert) => sum + (alert.amount || 0), 0);

    res.json({
      total: failedTransfers.length,
      totalAmountBlocked: totalAmount,
      transfers: failedTransfers
    });
  } catch (error) {
    console.error('❌ Erreur récupération transferts échoués:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transferts' });
  }
};

/**
 * Marque une alerte comme résolue
 */
const resolveAlert = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const { alertId } = req.params;
    const { resolutionNote } = req.body;

    const alert = await AlertLog.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || 'Marquée comme résolue par admin'
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alerte introuvable" });
    }

    res.json({
      message: "Alerte marquée comme résolue",
      alert
    });
  } catch (error) {
    console.error('❌ Erreur résolution alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la résolution' });
  }
};

/**
 * Récupère les statistiques des alertes
 */
const getAlertStats = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const stats = await AlertLog.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            severity: '$severity',
            resolved: '$resolved'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.severity': -1 } }
    ]);

    const unresolvedCount = await AlertLog.countDocuments({ resolved: false });
    const totalBlockedAmount = await AlertLog.aggregate([
      {
        $match: {
          type: 'PAYMENT_TRANSFER_FAILED',
          resolved: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      unresolvedCount,
      totalBlockedAmount: totalBlockedAmount[0]?.total || 0,
      stats
    });
  } catch (error) {
    console.error('❌ Erreur stats alertes:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des stats' });
  }
};

module.exports = {
  getUnresolvedAlerts,
  getFailedTransfers,
  resolveAlert,
  getAlertStats
};
