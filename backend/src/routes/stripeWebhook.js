// routes/stripeWebhook.js
// Gère les webhooks Stripe pour traiter les événements de paiement

const express = require('express');
const { stripe, endpointSecret } = require('../config/stripe');
const { markReservationAsPaid } = require('../controllers/stripeController');
const { notifyProviderPayment } = require('../services/paymentNotificationService');

/**
 * Traite les transferts d'argent après un paiement réussi
 */
const processPaymentTransfers = async (reservation, session) => {
  try {
    const totalAmount = session.amount_total; // en centimes
    const applicationFee = Math.round(totalAmount * 0.20); // 20% commission pour l'admin (Tarrification 3)
    const providerAmount = totalAmount - applicationFee; // 80% pour le prestataire
    
    // Vérifier que le prestataire a un compte Stripe valide
    if (!reservation.provider?.stripeAccountId) {
      console.error('❌ Compte Stripe du prestataire non configuré');
      throw new Error('Compte Stripe du prestataire non configuré');
    }

    // Effectuer le transfert via Stripe
    let transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: providerAmount,
        currency: 'eur',
        destination: reservation.provider.stripeAccountId,
        transfer_group: `reservation_${reservation._id}`,
        description: `Paiement pour la réservation ${reservation._id}`,
        metadata: {
          reservationId: reservation._id.toString(),
          providerId: reservation.provider._id.toString()
        }
      });
      console.log(`✅ Transfert Stripe créé: ${transfer.id}`);
    } catch (transferError) {
      console.error('❌ Erreur lors du transfert Stripe:', transferError);
      throw transferError;
    }
    
    // Créer l'enregistrement du transfert
    const PaymentLog = require('../models/PaymentLog');
    const paymentLog = new PaymentLog({
      reservation: reservation._id,
      client: reservation.client._id,
      provider: reservation.provider._id,
      paymentIntentId: session.payment_intent,
      sessionId: session.id,
      totalAmount: totalAmount / 100,
      applicationFee: applicationFee / 100,
      providerAmount: providerAmount / 100,
      currency: session.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      transferStatus: transfer ? 'completed' : 'failed',
      transferId: transfer?.id,
      createdAt: new Date()
    });
    
    await paymentLog.save();
    
    // Mettre à jour les gains du prestataire
    if (reservation.provider) {
      const Prestataire = require('../models/PrestataireSimple');
      await Prestataire.findByIdAndUpdate(
        reservation.provider._id,
        { 
          $inc: { 
            totalEarnings: providerAmount / 100,
            pendingEarnings: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? providerAmount / 100 : 0
          }
        }
      );
    }
    
    // 💰 Créditer la commission de l'admin
    try {
      const Admin = require('../models/Admin');
      // Récupérer le premier admin (super-admin)
      const adminUser = await Admin.findOne({ role: 'super-admin' });
      
      if (adminUser) {
        await Admin.findByIdAndUpdate(
          adminUser._id,
          { 
            $inc: { 
              totalCommissions: applicationFee / 100,
              pendingCommissions: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? applicationFee / 100 : 0
            }
          }
        );
        console.log(`✅ Commission admin créditée: ${applicationFee/100}€`);
      }
    } catch (adminError) {
      console.error('❌ Erreur lors de l\'ajout de la commission admin:', adminError);
    }
    
    console.log(`💰 Transfert traité - Commission admin: ${applicationFee/100}€, Prestataire: ${providerAmount/100}€`);
    
  } catch (error) {
    console.error('❌ Erreur traitement transferts:', error);
  }
};

/**
 * Gestionnaire de webhook Stripe
 * Cette fonction est exportée directement pour être utilisée comme middleware
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Erreur de signature webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement selon son type
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`💰 PaymentIntent ${paymentIntent.id} réussi!`);
      
      // Marquer la réservation comme payée
      await markReservationAsPaid(paymentIntent.id);
      break;
      
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`💰 Session Checkout ${session.id} complétée!`);
      
      // Si le paiement est réussi
      if (session.payment_status === 'paid') {
        // Récupérer l'ID de réservation depuis les métadonnées
        const reservationId = session.client_reference_id || 
                             (session.metadata && session.metadata.reservationId);
        
        if (reservationId) {
          // Marquer la réservation comme payée
          const Reservation = require('../models/Reservation');
          
          // Récupérer la réservation actuelle pour vérifier son statut
          const currentReservation = await Reservation.findById(reservationId);
          
          // Logique: 
          // - Si déjà "terminée", reste "terminée"
          // - Si "confirmé" (service fini, attente de paiement), devient "terminée" 
          // - Sinon, reste à son statut actuel
          let newStatus = currentReservation.status;
          if (currentReservation.status === 'confirmé' || currentReservation.status === 'confirmed') {
            newStatus = 'terminée';
          }
          
          const reservation = await Reservation.findByIdAndUpdate(
            reservationId,
            { 
              paid: true,
              paymentId: session.id,
              paymentDate: new Date(),
              status: newStatus,
              paymentDetails: {
                sessionId: session.id,
                paymentIntentId: session.payment_intent,
                amountTotal: session.amount_total,
                currency: session.currency
              }
            },
            { new: true }
          ).populate('provider').populate('client');
          
          console.log(`✅ Réservation ${reservationId} marquée comme payée - Montant: ${session.amount_total/100}€`);
          
          // Traiter les transferts d'argent
          await processPaymentTransfers(reservation, session);
          
          // Notifier le prestataire du paiement
          if (reservation && reservation.provider) {
            try {
              await notifyProviderPayment(reservation);
              console.log(`✅ Prestataire ${reservation.provider.name} notifié du paiement`);
            } catch (notifError) {
              console.error('❌ Erreur notification prestataire:', notifError);
            }
          }
        } else {
          console.error('❌ Aucun ID de réservation trouvé dans la session');
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Échec du paiement pour PaymentIntent ${failedPayment.id}`);
      break;
      
    case 'charge.dispute.created':
      const dispute = event.data.object;
      console.log(`⚠️ Litige créé pour la charge ${dispute.charge}`);
      break;
      
    // Événements Stripe Connect
    case 'account.updated':
      const account = event.data.object;
      console.log(`🔄 Compte Stripe mis à jour: ${account.id}`);
      
      try {
        // Mettre à jour le statut du compte dans la base de données
        const Prestataire = require('../models/PrestataireSimple');
        const provider = await Prestataire.findOne({ stripeAccountId: account.id });
        
        if (provider) {
          // Déterminer le statut du compte
          let accountStatus = account.details_submitted 
            ? account.charges_enabled && account.payouts_enabled
              ? 'active'
              : 'pending_verification'
            : 'incomplete';
            
          // Mettre à jour le prestataire
          provider.stripeAccountStatus = accountStatus;
          provider.stripeAccountVerified = accountStatus === 'active';
          provider.stripeOnboardingComplete = account.details_submitted;
          provider.stripeAccountDetails = {
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            lastUpdated: new Date()
          };
          
          await provider.save();
          console.log(`✅ Status du compte mis à jour pour ${provider.name}: ${accountStatus}`);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut du compte:', error);
      }
      break;

    case 'account.application.deauthorized':
      const deauthorizedAccount = event.data.object;
      console.log(`🔒 Compte déconnecté: ${deauthorizedAccount.id}`);
      
      try {
        const Prestataire = require('../models/PrestataireSimple');
        const provider = await Prestataire.findOne({ stripeAccountId: deauthorizedAccount.id });
        
        if (provider) {
          // Réinitialiser les informations Stripe
          provider.stripeAccountId = null;
          provider.stripeAccountStatus = null;
          provider.stripeAccountVerified = false;
          provider.stripeOnboardingComplete = false;
          provider.stripeAccountDetails = null;
          
          await provider.save();
          console.log(`✅ Informations Stripe réinitialisées pour ${provider.name}`);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation du compte:', error);
      }
      break;

    case 'account.external_account.created':
      const bankAccount = event.data.object;
      console.log(`🏦 Compte bancaire ajouté: ${bankAccount.id}`);
      
      try {
        const Prestataire = require('../models/PrestataireSimple');
        const provider = await Prestataire.findOne({ stripeAccountId: bankAccount.account });
        
        if (provider) {
          provider.bankAccountLastFour = bankAccount.last4;
          provider.bankAccountType = bankAccount.bank_name;
          await provider.save();
          console.log(`✅ Informations bancaires mises à jour pour ${provider.name}`);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des informations bancaires:', error);
      }
      break;

    case 'payout.paid':
      const payout = event.data.object;
      console.log(`💸 Paiement effectué: ${payout.id} - ${payout.amount/100}€`);
      
      try {
        const Prestataire = require('../models/PrestataireSimple');
        const provider = await Prestataire.findOne({ stripeAccountId: payout.destination });
        
        if (provider) {
          // Mettre à jour les revenus en attente
          await Prestataire.findByIdAndUpdate(
            provider._id,
            { $inc: { pendingEarnings: -(payout.amount/100) } }
          );
          console.log(`✅ Revenus en attente mis à jour pour ${provider.name}`);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des revenus:', error);
      }
      break;
      
    default:
      // Événements non gérés
      console.log(`Événement non géré: ${event.type}`);
  }

  // Renvoyer une réponse 200 pour confirmer la réception
  res.status(200).json({ received: true });
};

module.exports = handleStripeWebhook;