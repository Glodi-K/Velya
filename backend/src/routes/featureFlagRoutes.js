const express = require('express');
const router = express.Router();
const FeatureFlagService = require('../services/featureFlagService');
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// ✅ Récupérer toutes les feature flags (public)
router.get('/', (req, res) => {
  const flags = FeatureFlagService.getAllFlags();
  res.json({ flags });
});

// ✅ Vérifier une feature flag spécifique
router.get('/:flagName', (req, res) => {
  const { flagName } = req.params;
  const isEnabled = FeatureFlagService.isEnabled(flagName);
  res.json({ flagName, enabled: isEnabled });
});

// ✅ Health check avec statut des features
router.get('/health/status', (req, res) => {
  const flags = FeatureFlagService.getAllFlags();
  const maintenanceMode = FeatureFlagService.checkMaintenanceMode();
  
  res.json({
    status: maintenanceMode ? 'maintenance' : 'operational',
    environment: process.env.NODE_ENV,
    features: flags,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;