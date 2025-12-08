const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
const PaymentLog = require('../src/models/PaymentLog');
require('dotenv').config();

async function paymentHealthCheck() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔍 Vérification de santé des paiements...\n');

    // 1. Réservations terminées non payées
    const unpaidCompleted = await Reservation.find({
      status: 'terminée',
      paid: false
    }).populate('client', 'name email');

    if (unpaidCompleted.length > 0) {
      console.log('⚠️ ALERTE: Réservations terminées non payées:');
      unpaidCompleted.forEach(res => {
        console.log(`   - ${res._id}: ${res.client?.name} - ${res.prixTotal}€`);
      });
    } else {
      console.log('✅ Aucune réservation terminée non payée');
    }

    // 2. Réservations avec paymentId mais paid=false
    const inconsistentPayments = await Reservation.find({
      paymentId: { $exists: true, $ne: null },
      paid: false
    });

    if (inconsistentPayments.length > 0) {
      console.log('\n⚠️ ALERTE: Réservations avec paymentId mais non marquées payées:');
      inconsistentPayments.forEach(res => {
        console.log(`   - ${res._id}: PaymentId ${res.paymentId}`);
      });
    } else {
      console.log('✅ Aucune incohérence de statut de paiement');
    }

    // 3. Logs de paiement orphelins
    const paymentLogs = await PaymentLog.find({ status: 'completed' });
    let orphanLogs = 0;
    
    for (const log of paymentLogs) {
      const reservation = await Reservation.findById(log.reservation);
      if (!reservation || !reservation.paid) {
        orphanLogs++;
      }
    }

    if (orphanLogs > 0) {
      console.log(`\n⚠️ ALERTE: ${orphanLogs} logs de paiement sans réservation payée correspondante`);
    } else {
      console.log('✅ Tous les logs de paiement sont cohérents');
    }

    console.log('\n📊 Statistiques:');
    const totalReservations = await Reservation.countDocuments();
    const paidReservations = await Reservation.countDocuments({ paid: true });
    const totalPaymentLogs = await PaymentLog.countDocuments();
    
    console.log(`   Total réservations: ${totalReservations}`);
    console.log(`   Réservations payées: ${paidReservations}`);
    console.log(`   Logs de paiement: ${totalPaymentLogs}`);

    await mongoose.disconnect();
    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

paymentHealthCheck();