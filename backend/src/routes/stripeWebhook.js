// routes/stripeWebhook.js
// Gère les webhooks Stripe pour traiter les événements de paiement

const express = require('express');
const { stripe, endpointSecret } = require('../config/stripe');
const { markReservationAsPaid } = require('../controllers/stripeController');

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
          await Reservation.findByIdAndUpdate(
            reservationId,
            { 
              paid: true,
              paymentId: session.id,
              paymentDate: new Date(),
              status: 'confirmé'
            }
          );
          console.log(`✅ Réservation ${reservationId} marquée comme payée`);
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Échec du paiement pour PaymentIntent ${failedPayment.id}`);
      
      // Vous pouvez ajouter ici une logique pour gérer les échecs de paiement
      break;
      
    case 'charge.dispute.created':
      const dispute = event.data.object;
      console.log(`⚠️ Litige créé pour la charge ${dispute.charge}`);
      
      // Vous pouvez ajouter ici une logique pour gérer les litiges
      break;
      
    default:
      // Événements non gérés
      console.log(`Événement non géré: ${event.type}`);
  }

  // Renvoyer une réponse 200 pour confirmer la réception
  res.status(200).json({ received: true });
};

module.exports = handleStripeWebhook;