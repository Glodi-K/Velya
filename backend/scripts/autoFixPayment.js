const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
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

async function fixCompletedReservations() {
  try {
    console.log('🔍 Recherche des réservations terminées non payées...\n');

    // Trouver les réservations terminées mais non payées
    const completedUnpaidReservations = await Reservation.find({
      status: 'terminée',
      paid: false
    }).populate('client', 'name email');

    if (completedUnpaidReservations.length === 0) {
      console.log('✅ Aucune réservation terminée non payée trouvée');
      return;
    }

    console.log(`📋 Trouvé ${completedUnpaidReservations.length} réservation(s) terminée(s) non payée(s):\n`);

    for (const reservation of completedUnpaidReservations) {
      console.log(`🔧 Correction de la réservation ${reservation._id}:`);
      console.log(`   Client: ${reservation.client?.name} (${reservation.client?.email})`);
      console.log(`   Service: ${reservation.service || reservation.categorie}`);
      console.log(`   Date: ${new Date(reservation.date).toLocaleDateString()}`);
      console.log(`   Montant: ${reservation.prixTotal}€`);

      // Mettre à jour la réservation
      const updatedReservation = await Reservation.findByIdAndUpdate(
        reservation._id,
        {
          paid: true,
          paymentDate: new Date(),
          paymentId: `manual_fix_${Date.now()}_${reservation._id}`,
          status: 'terminée' // Garder le statut terminée
        },
        { new: true }
      );

      console.log('   ✅ Réservation corrigée avec succès !');
      console.log(`   Payé: ${updatedReservation.paid ? 'Oui' : 'Non'}`);
      console.log(`   Date de paiement: ${updatedReservation.paymentDate}`);
      console.log(`   ID de paiement: ${updatedReservation.paymentId}\n`);
    }

    console.log('✅ Toutes les réservations terminées ont été marquées comme payées');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function main() {
  await connectDB();
  await fixCompletedReservations();
  await mongoose.disconnect();
  console.log('\n👋 Déconnecté de MongoDB');
}

main().catch(console.error);