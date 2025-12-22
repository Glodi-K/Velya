const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
const PaymentLog = require('../src/models/PaymentLog');
const PrestataireSimple = require('../src/models/PrestataireSimple');
const User = require('../src/models/User');
require('dotenv').config();

// Enregistrer le modèle Prestataire pour éviter l'erreur
try {
  const Prestataire = require('../src/models/Prestataire');
} catch (error) {
  // Le modèle Prestataire n'existe peut-être pas, on utilisera PrestataireSimple
  console.log('⚠️ Modèle Prestataire non trouvé, utilisation de PrestataireSimple');
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function processRetroactivePayment(reservationId) {
  try {
    console.log(`🔍 Traitement rétroactif du paiement pour la réservation ${reservationId}...`);

    // Récupérer la réservation avec les détails du client et prestataire
    const reservation = await Reservation.findById(reservationId)
      .populate('client');
    
    // Récupérer le prestataire séparément
    let provider = null;
    if (reservation && reservation.provider) {
      provider = await PrestataireSimple.findById(reservation.provider);
      reservation.provider = provider;
    }

    if (!reservation) {
      console.error('❌ Réservation introuvable');
      return;
    }

    console.log(`📋 Détails de la réservation:`);
    console.log(`   Client: ${reservation.client?.name} (${reservation.client?.email})`);
    console.log(`   Service: ${reservation.service || reservation.categorie}`);
    console.log(`   Date: ${new Date(reservation.date).toLocaleDateString()}`);
    console.log(`   Montant: ${reservation.prixTotal}€`);
    console.log(`   Status: ${reservation.status}`);
    console.log(`   Payé: ${reservation.paid ? 'Oui' : 'Non'}`);

    if (reservation.paid) {
      console.log('✅ Cette réservation est déjà marquée comme payée');
      return;
    }

    // Calculer les montants
    const totalAmount = reservation.prixTotal;
    const applicationFee = Math.round(totalAmount * 0.20 * 100) / 100; // 20% commission pour l'admin (Tarrification 3)
    const providerAmount = Math.round((totalAmount - applicationFee) * 100) / 100; // 80% pour le prestataire

    console.log(`💰 Répartition des montants:`);
    console.log(`   Montant total: ${totalAmount}€`);
    console.log(`   Commission plateforme (20%): ${applicationFee}€`);
    console.log(`   Montant prestataire (80%): ${providerAmount}€`);

    // Générer un ID de paiement unique pour le traitement rétroactif
    const paymentId = `retroactive_${Date.now()}_${reservationId}`;
    const paymentDate = new Date();

    // 1. Mettre à jour la réservation
    console.log('🔄 Mise à jour de la réservation...');
    await Reservation.findByIdAndUpdate(reservationId, {
      paid: true,
      paymentId: paymentId,
      paymentDate: paymentDate,
      status: 'terminée', // Garder le statut terminée
      paymentDetails: {
        totalAmount: totalAmount,
        applicationFee: applicationFee,
        providerAmount: providerAmount,
        currency: 'eur'
      }
    });

    // 2. Créer un log de paiement
    console.log('📝 Création du log de paiement...');
    const paymentLog = new PaymentLog({
      reservation: reservation._id,
      client: reservation.client._id,
      provider: reservation.provider?._id,
      paymentIntentId: paymentId,
      totalAmount: totalAmount,
      applicationFee: applicationFee,
      providerAmount: providerAmount,
      currency: 'eur',
      status: 'completed',
      paymentMethod: 'stripe',
      notes: 'Paiement traité rétroactivement - Service terminé'
    });

    await paymentLog.save();

    // 3. Mettre à jour les gains du prestataire
    if (reservation.provider) {
      console.log('💳 Mise à jour des gains du prestataire...');
      
      const provider = await PrestataireSimple.findById(reservation.provider._id);
      if (provider) {
        // Ajouter aux gains totaux
        provider.totalEarnings = (provider.totalEarnings || 0) + providerAmount;
        
        // En mode test, ajouter aux gains en attente
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
          provider.pendingEarnings = (provider.pendingEarnings || 0) + providerAmount;
          console.log(`   ⚠️ Mode TEST: ${providerAmount}€ ajoutés aux gains en attente`);
        } else {
          provider.paidEarnings = (provider.paidEarnings || 0) + providerAmount;
          console.log(`   ✅ Mode PROD: ${providerAmount}€ ajoutés aux gains payés`);
        }
        
        await provider.save();
        
        console.log(`✅ Gains du prestataire ${provider.nom} mis à jour:`);
        console.log(`   Gains totaux: ${provider.totalEarnings}€`);
        console.log(`   Gains en attente: ${provider.pendingEarnings}€`);
        console.log(`   Gains payés: ${provider.paidEarnings}€`);
      }
    }

    console.log('✅ Paiement rétroactif traité avec succès !');
    console.log(`📧 Le prestataire devrait maintenant voir ${providerAmount}€ dans ses gains`);

    return {
      success: true,
      paymentId,
      totalAmount,
      applicationFee,
      providerAmount
    };

  } catch (error) {
    console.error('❌ Erreur lors du traitement rétroactif:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const reservationId = args[0];
  
  if (!reservationId) {
    console.log('Usage: node processRetroactivePayment.js <reservationId>');
    console.log('Exemple: node processRetroactivePayment.js 692881a26e058b9742ec8db4');
    process.exit(1);
  }
  
  await processRetroactivePayment(reservationId);
  
  await mongoose.disconnect();
  console.log('👋 Déconnecté de MongoDB');
}

main().catch(console.error);