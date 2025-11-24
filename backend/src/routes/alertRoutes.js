// routes/alertRoutes.js
// Routes pour consulter et gérer les alertes système

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getUnresolvedAlerts,
  getFailedTransfers,
  resolveAlert,
  getAlertStats
} = require('../controllers/alertController');

/**
 * @route GET /api/alerts/unresolved
 * @desc Récupère les alertes non résolues
 * @access Admin only
 */
router.get('/unresolved', verifyToken, getUnresolvedAlerts);

/**
 * @route GET /api/alerts/failed-transfers
 * @desc Récupère les paiements avec transfert échoué (argent bloqué)
 * @access Admin only
 */
router.get('/failed-transfers', verifyToken, getFailedTransfers);

/**
 * @route PATCH /api/alerts/:alertId/resolve
 * @desc Marque une alerte comme résolue
 * @access Admin only
 */
router.patch('/:alertId/resolve', verifyToken, resolveAlert);

/**
 * @route GET /api/alerts/stats
 * @desc Récupère les statistiques des alertes
 * @access Admin only
 */
router.get('/stats', verifyToken, getAlertStats);

module.exports = router;
