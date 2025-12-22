const cron = require('node-cron');
const PaymentMonitorService = require('../services/paymentMonitorService');

// Vérification automatique toutes les heures
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔍 Vérification automatique des paiements...');
    
    const issues = await PaymentMonitorService.checkPaymentHealth();
    
    if (issues.length > 0) {
      console.log('⚠️ Problèmes détectés, correction automatique...');
      const result = await PaymentMonitorService.autoFixPayments();
      console.log(`✅ ${result.fixed} paiements corrigés automatiquement`);
    } else {
      console.log('✅ Tous les paiements sont en ordre');
    }
  } catch (error) {
    console.error('❌ Erreur vérification paiements:', error);
  }
});

module.exports = cron;