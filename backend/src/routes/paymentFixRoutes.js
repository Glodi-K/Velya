const express = require('express');
const router = express.Router();
const PaymentMonitorService = require('../services/paymentMonitorService');

// Route pour corriger automatiquement les paiements
router.post('/fix-payments', async (req, res) => {
  try {
    const result = await PaymentMonitorService.autoFixPayments();
    res.json({ 
      success: true, 
      message: `${result.fixed} paiements corrigés`,
      fixed: result.fixed 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la correction des paiements',
      error: error.message 
    });
  }
});

// Route pour vérifier la santé des paiements
router.get('/health-check', async (req, res) => {
  try {
    const issues = await PaymentMonitorService.checkPaymentHealth();
    res.json({ 
      success: true, 
      issues,
      hasIssues: issues.length > 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification',
      error: error.message 
    });
  }
});

module.exports = router;