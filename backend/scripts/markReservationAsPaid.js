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

async function markReservationAsPaid(reservationId) {
  try {
    const reservation = await Reservation.findById(reservationId).populate('client', 'name email');
    
    if (!reservation) {
      console.log('❌ Réservation introuvable');
      return;
    }

    console.log(`🔍 Réservation trouvée:`);
    console.log(`   ID: ${reservation._id}`);
    console.log(`   Client: ${reservation.client?.name} (${reservation.client?.email})`);
    console.log(`   Service: ${reservation.service || reservation.categorie}`);
    console.log(`   Date: ${new Date(reservation.date).toLocaleDateString()}`);
    console.log(`   Montant: ${reservation.prixTotal}€`);
    console.log(`   Status actuel: ${reservation.status}`);
    console.log(`   Payé: ${reservation.paid ? 'Oui' : 'Non'}`);

    if (reservation.paid) {
      console.log('✅ Cette réservation est déjà marquée comme payée');
      return;
    }

    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Voulez-vous marquer cette réservation comme payée ? (oui/non): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      return;
    }

    // Mettre à jour la réservation
    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      {
        paid: true,
        paymentDate: new Date(),
        paymentId: `manual_${Date.now()}`, // ID de paiement manuel
        status: reservation.status === 'terminée' ? 'terminée' : 'confirmé'
      },
      { new: true }
    );

    console.log('✅ Réservation mise à jour avec succès !');
    console.log(`   Nouveau statut: ${updatedReservation.status}`);
    console.log(`   Payé: ${updatedReservation.paid ? 'Oui' : 'Non'}`);
    console.log(`   Date de paiement: ${updatedReservation.paymentDate}`);
    console.log(`   ID de paiement: ${updatedReservation.paymentId}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const reservationId = args[0];
  
  if (!reservationId) {
    console.log('Usage: node markReservationAsPaid.js <reservationId>');
    console.log('Exemple: node markReservationAsPaid.js 68f07b40fad8fcc20cdbd571');
    process.exit(1);
  }

  await markReservationAsPaid(reservationId);
  
  await mongoose.disconnect();
  console.log('\n👋 Déconnecté de MongoDB');
}

main().catch(console.error);