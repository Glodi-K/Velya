const express = require('express');
const router = express.Router();
const { pricingTable, forfaits, majorations } = require('../config/pricingTable');

// Route pour récupérer la grille tarifaire complète
router.get('/pricing', (req, res) => {
  try {
    res.status(200).json({
      pricingTable,
      forfaits,
      majorations
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tarifs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/config', verifyToken, async (req, res) => {
  // Implementation for config route
});

module.exports = router;