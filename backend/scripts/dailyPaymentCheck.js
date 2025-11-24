const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
const PaymentLog = require('../src/models/PaymentLog');
const User = require('../src/models/User');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function dailyPaymentCheck() {
  try {
    console.log('🔍 Vérification quotidienne des paiements...\n');
    
    const issues = [];
    
    // 1. Vérifier les réservations terminées non payées
    const completedUnpaid = await Reservation.find({
      status: 'terminée',
      paid: false
    }).populate('client', 'name email');
    
    if (completedUnpaid.length > 0) {
      issues.push({
        type: 'completed_unpaid',
        count: completedUnpaid.length,
        reservations: completedUnpaid
      });
      console.log(`⚠️ ${completedUnpaid.length} réservation(s) terminée(s) non payée(s) détectée(s)`);
    }
    
    // 2. Vérifier les réservations avec PaymentId mais paid=false
    const withPaymentIdUnpaid = await Reservation.find({
      paymentId: { $exists: true, $ne: null },
      paid: false
    }).populate('client', 'name email');
    
    if (withPaymentIdUnpaid.length > 0) {
      issues.push({
        type: 'payment_id_unpaid',
        count: withPaymentIdUnpaid.length,
        reservations: withPaymentIdUnpaid
      });
      console.log(`⚠️ ${withPaymentIdUnpaid.length} réservation(s) avec PaymentId mais non payée(s)`);
    }
    
    // 3. Vérifier les PaymentLogs sans réservation correspondante payée
    const paymentLogs = await PaymentLog.find({ status: 'completed' });
    let orphanedPayments = 0;
    
    for (const log of paymentLogs) {
      const reservation = await Reservation.findById(log.reservation);
      if (reservation && !reservation.paid) {
        orphanedPayments++;
      }
    }
    
    if (orphanedPayments > 0) {
      issues.push({
        type: 'orphaned_payments',
        count: orphanedPayments
      });
      console.log(`⚠️ ${orphanedPayments} paiement(s) orphelin(s) détecté(s)`);
    }
    
    // 4. Rapport final
    if (issues.length === 0) {
      console.log('✅ Aucun problème de paiement détecté');
    } else {
      console.log(`\n📊 Résumé des problèmes détectés:`);
      issues.forEach(issue => {
        switch (issue.type) {
          case 'completed_unpaid':
            console.log(`   - ${issue.count} réservation(s) terminée(s) non payée(s)`);
            break;
          case 'payment_id_unpaid':
            console.log(`   - ${issue.count} réservation(s) avec PaymentId mais non payée(s)`);
            break;
          case 'orphaned_payments':
            console.log(`   - ${issue.count} paiement(s) orphelin(s)`);
            break;
        }
      });
      
      console.log(`\n💡 Pour corriger ces problèmes, exécutez:`);
      console.log(`   node scripts/autoFixPayment.js`);
    }
    
    // 5. Statistiques générales
    const totalReservations = await Reservation.countDocuments();
    const paidReservations = await Reservation.countDocuments({ paid: true });
    const unpaidReservations = await Reservation.countDocuments({ paid: false });
    
    console.log(`\n📈 Statistiques générales:`);
    console.log(`   - Total réservations: ${totalReservations}`);
    console.log(`   - Réservations payées: ${paidReservations}`);
    console.log(`   - Réservations non payées: ${unpaidReservations}`);
    console.log(`   - Taux de paiement: ${((paidReservations / totalReservations) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

async function main() {
  await connectDB();
  await dailyPaymentCheck();
  await mongoose.disconnect();
  console.log('\n👋 Déconnecté de MongoDB');
}

main().catch(console.error);