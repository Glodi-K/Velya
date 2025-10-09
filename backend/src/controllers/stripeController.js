// controllers/stripeController.js
// Gère la logique de paiement avec Stripe

const { stripe, paymentOptions } = require('../config/stripe');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

/**
 * Crée une session de paiement Stripe Checkout
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ message: "ID de réservation requis" });
    }
    
    // Récupérer les détails de la réservation
    const reservation = await Reservation.findById(reservationId)
      .populate('client')
      .populate('provider');
      
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    
    if (reservation.paid) {
      return res.status(400).json({ message: "Cette réservation a déjà été payée" });
    }
    
    // Calculer les montants
    const amount = Math.round(reservation.prixTotal * 100); // Conversion en centimes
    const applicationFee = Math.round(amount * 0.2); // 20% de commission
    
    let sessionOptions = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Service de nettoyage - ${reservation.service}`,
              description: `Réservation du ${new Date(reservation.date).toLocaleDateString()} à ${reservation.heure}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?reservation=${reservationId}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel?reservation=${reservationId}`,
      client_reference_id: reservationId,
      customer_email: reservation.client.email,
      metadata: {
        reservationId: reservationId.toString(),
        service: reservation.service,
        clientId: reservation.client._id.toString(),
      },
    };
    
    // Si le prestataire a un compte Stripe, configurer le transfert direct
    if (reservation.provider && reservation.provider.stripeAccountId) {
      sessionOptions.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: reservation.provider.stripeAccountId,
        },
      };
    }
    
    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create(sessionOptions);
    
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Erreur création session Stripe:", error);
    res.status(500).json({ message: "Erreur lors de la création de la session de paiement" });
  }
};

/**
 * Crée un payment intent pour un paiement côté client
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ message: "ID de réservation requis" });
    }
    
    // Récupérer les détails de la réservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    
    // Calculer les montants
    const amount = Math.round(reservation.prixTotal * 100); // Conversion en centimes
    
    // Créer le payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        reservationId: reservationId.toString(),
        service: reservation.service,
      },
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ Erreur création payment intent:", error);
    res.status(500).json({ message: "Erreur lors de la création du payment intent" });
  }
};

/**
 * Marque une réservation comme payée après confirmation de Stripe
 */
const markReservationAsPaid = async (paymentIntentId) => {
  try {
    // Récupérer les détails du paiement
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.metadata.reservationId) {
      console.error("❌ Pas d'ID de réservation dans les métadonnées");
      return;
    }
    
    // Mettre à jour la réservation
    const reservation = await Reservation.findByIdAndUpdate(
      paymentIntent.metadata.reservationId,
      { 
        paid: true,
        paymentId: paymentIntentId,
        paymentDate: new Date(),
        status: 'confirmé'
      },
      { new: true }
    );
    
    if (!reservation) {
      console.error(`❌ Réservation ${paymentIntent.metadata.reservationId} introuvable`);
      return;
    }
    
    console.log(`✅ Réservation ${reservation._id} marquée comme payée`);
    return reservation;
  } catch (error) {
    console.error("❌ Erreur lors du marquage de la réservation comme payée:", error);
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  markReservationAsPaid
};