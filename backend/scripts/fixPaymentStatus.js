const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');
const PaymentLog = require('../src/models/PaymentLog');
const User = require('../src/models/User');
require('dotenv').config();

// Initialiser Stripe seulement si nécessaire
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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

async function fixPaymentStatus() {
  try {
    console.log('🔍 Recherche des réservations avec problèmes de paiement...\n');
    
    if (!stripe) {
      console.log('⚠️ Stripe non configuré - vérifications limitées\n');
    }

    // 1. Trouver les réservations avec paymentId mais paid=false
    const reservationsWithPaymentId = await Reservation.find({
      paymentId: { $exists: true, $ne: null },
      paid: false
    }).populate('client', 'name email');

    console.log(`📋 Trouvé ${reservationsWithPaymentId.length} réservations avec paymentId mais paid=false`);

    for (const reservation of reservationsWithPaymentId) {
      console.log(`\n🔍 Vérification réservation ${reservation._id}:`);
      console.log(`   Client: ${reservation.client?.name} (${reservation.client?.email})`);
      console.log(`   PaymentId: ${reservation.paymentId}`);
      console.log(`   Montant: ${reservation.prixTotal}€`);
      console.log(`   Status: ${reservation.status}`);

      if (stripe) {
        try {
          // Vérifier le statut du paiement sur Stripe
          let stripePayment;
          
          if (reservation.paymentId.startsWith('cs_')) {
            // C'est une session checkout
            stripePayment = await stripe.checkout.sessions.retrieve(reservation.paymentId);
            console.log(`   Stripe Session Status: ${stripePayment.payment_status}`);
            
            if (stripePayment.payment_status === 'paid') {
              console.log('   ✅ Paiement confirmé sur Stripe - Correction en cours...');
              
              await Reservation.findByIdAndUpdate(reservation._id, {
                paid: true,
                status: 'confirmé',
                paymentDate: new Date(stripePayment.created * 1000)
              });
              
              console.log('   ✅ Réservation mise à jour avec succès');
            }
          } else if (reservation.paymentId.startsWith('pi_')) {
            // C'est un payment intent
            stripePayment = await stripe.paymentIntents.retrieve(reservation.paymentId);
            console.log(`   Stripe PaymentIntent Status: ${stripePayment.status}`);
            
            if (stripePayment.status === 'succeeded') {
              console.log('   ✅ Paiement confirmé sur Stripe - Correction en cours...');
              
              await Reservation.findByIdAndUpdate(reservation._id, {
                paid: true,
                status: 'confirmé',
                paymentDate: new Date(stripePayment.created * 1000)
              });
              
              console.log('   ✅ Réservation mise à jour avec succès');
            }
          }
        } catch (stripeError) {
          console.log(`   ❌ Erreur Stripe: ${stripeError.message}`);
        }
      } else {
        console.log('   ⚠️ Stripe non configuré - vérification manuelle nécessaire');
      }
    }

    // 2. Trouver les réservations avec PaymentLog mais paid=false
    console.log('\n🔍 Vérification des PaymentLogs...');
    
    const paymentLogs = await PaymentLog.find({ status: 'completed' });
    
    for (const log of paymentLogs) {
      const reservation = await Reservation.findById(log.reservation);
      
      if (reservation && !reservation.paid) {
        console.log(`\n🔧 Correction réservation ${reservation._id} basée sur PaymentLog:`);
        console.log(`   PaymentLog ID: ${log._id}`);
        console.log(`   Montant: ${log.totalAmount}€`);
        
        await Reservation.findByIdAndUpdate(reservation._id, {
          paid: true,
          status: 'confirmé',
          paymentId: log.paymentIntentId,
          paymentDate: log.createdAt
        });
        
        console.log('   ✅ Réservation corrigée avec succès');
      }
    }

    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function listUnpaidReservations() {
  try {
    console.log('\n📋 Liste des réservations non payées:');
    
    const unpaidReservations = await Reservation.find({
      paid: false,
      status: { $nin: ['annulée', 'draft'] }
    }).populate('client', 'name email').sort({ createdAt: -1 });

    if (unpaidReservations.length === 0) {
      console.log('✅ Aucune réservation non payée trouvée');
      return;
    }

    unpaidReservations.forEach((res, index) => {
      console.log(`\n${index + 1}. Réservation ${res._id}:`);
      console.log(`   Client: ${res.client?.name} (${res.client?.email})`);
      console.log(`   Service: ${res.service || res.categorie}`);
      console.log(`   Date: ${new Date(res.date).toLocaleDateString()}`);
      console.log(`   Montant: ${res.prixTotal}€`);
      console.log(`   Status: ${res.status}`);
      console.log(`   PaymentId: ${res.paymentId || 'Aucun'}`);
      console.log(`   Créée le: ${new Date(res.createdAt).toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    await listUnpaidReservations();
  } else if (args.includes('--fix')) {
    if (!stripe) {
      console.log('⚠️ Stripe non configuré. Seules les corrections basées sur PaymentLog seront effectuées.');
    }
    await fixPaymentStatus();
  } else {
    console.log('Usage:');
    console.log('  node fixPaymentStatus.js --list    # Lister les réservations non payées');
    console.log('  node fixPaymentStatus.js --fix     # Corriger les statuts de paiement');
  }
  
  await mongoose.disconnect();
  console.log('\n👋 Déconnecté de MongoDB');
}

main().catch(console.error);