/**
 * Script pour corriger les réservations payées avec un mauvais statut
 * Les réservations "confirmées" qui sont payées doivent devenir "terminées"
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Charger le modèle
const Reservation = require('../src/models/Reservation');

async function fixPaidReservations() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Velya');
    console.log('✅ Connecté à MongoDB');

    // Trouver toutes les réservations payées avec statut "confirmé"
    const reservationsToFix = await Reservation.find({
      paid: true,
      status: { $in: ['confirmé', 'confirmed'] }
    });

    console.log(`\n🔍 Réservations à corriger: ${reservationsToFix.length}`);

    if (reservationsToFix.length === 0) {
      console.log('✅ Aucune réservation à corriger');
      await mongoose.disconnect();
      return;
    }

    // Afficher un aperçu
    console.log('\n📋 Aperçu des réservations:');
    reservationsToFix.forEach((res, idx) => {
      console.log(`   ${idx + 1}. ID: ${res._id} | Client: ${res.client} | Prix: ${res.prixTotal}€ | Payé: ${res.paid} | Statut: ${res.status}`);
    });

    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('\n✏️ Voulez-vous mettre à jour ces réservations ? (oui/non): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      await mongoose.disconnect();
      return;
    }

    // Mettre à jour les réservations
    const result = await Reservation.updateMany(
      { paid: true, status: { $in: ['confirmé', 'confirmed'] } },
      { status: 'terminée' }
    );

    console.log(`\n✅ ${result.modifiedCount} réservation(s) mise(s) à jour avec succès !`);
    console.log(`   - Modifiées: ${result.modifiedCount}`);
    console.log(`   - Inchangées: ${result.matchedCount - result.modifiedCount}`);

    // Vérifier les mises à jour
    const updatedReservations = await Reservation.find({
      paid: true,
      status: 'terminée'
    });

    console.log(`\n📊 Total des réservations payées avec statut 'terminée': ${updatedReservations.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de MongoDB');

  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixPaidReservations();
