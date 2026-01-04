const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
const PaymentLog = require('../src/models/PaymentLog');
const PrestataireSimple = require('../src/models/PrestataireSimple');
const { calculateCommissionInEuros } = require('../src/utils/commissionCalculator');
require('dotenv').config();

async function finalizePayment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const reservationId = '692881a26e058b9742ec8db4';
    const providerId = '68eefa5e2faf153a16fa55f1';
    
    // Vérifier la réservation
    const reservation = await Reservation.findById(reservationId);
    console.log('📋 Réservation:', {
      id: reservation._id,
      paid: reservation.paid,
      paymentId: reservation.paymentId,
      montant: reservation.prixTotal
    });

    // Calculer le montant prestataire (80% du total - Tarrification 3)
    const { commission: applicationFee, providerAmount } = calculateCommissionInEuros(reservation.prixTotal);
    console.log('💰 Montant prestataire:', providerAmount + '€');

    // Mettre à jour les gains du prestataire
    const result = await PrestataireSimple.findByIdAndUpdate(
      providerId,
      { 
        $inc: { 
          totalEarnings: providerAmount,
          pendingEarnings: providerAmount // Mode test
        }
      },
      { new: true }
    );

    console.log('✅ Prestataire mis à jour:', {
      id: result._id,
      totalEarnings: result.totalEarnings,
      pendingEarnings: result.pendingEarnings
    });

    // Créer le log de paiement
    const paymentLog = new PaymentLog({
      reservation: reservationId,
      client: reservation.client,
      provider: providerId,
      paymentIntentId: reservation.paymentId,
      totalAmount: reservation.prixTotal,
      applicationFee: applicationFee,
      providerAmount: providerAmount,
      currency: 'eur',
      status: 'completed',
      paymentMethod: 'stripe'
    });

    await paymentLog.save();
    console.log('📝 Log de paiement créé:', paymentLog._id);

    console.log('🎉 Paiement finalisé avec succès !');
    console.log(`💳 Le prestataire a maintenant ${result.totalEarnings}€ dans ses gains`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

finalizePayment();