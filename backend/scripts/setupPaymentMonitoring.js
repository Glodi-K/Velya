const mongoose = require('mongoose');
const PaymentMonitorService = require('../src/services/paymentMonitorService');
require('dotenv').config();

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Configuration du système de surveillance des paiements...');
    
    // Corriger tous les paiements en attente
    const result = await PaymentMonitorService.autoFixPayments();
    console.log(`✅ ${result.fixed} paiements corrigés`);
    
    // Vérifier la santé
    const issues = await PaymentMonitorService.checkPaymentHealth();
    if (issues.length === 0) {
      console.log('✅ Système de paiement en parfait état');
    } else {
      console.log('⚠️ Problèmes restants:', issues);
    }
    
    await mongoose.disconnect();
    console.log('✅ Configuration terminée - Surveillance automatique active');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

setup();