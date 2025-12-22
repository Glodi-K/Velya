// controllers/stripeController.js
// Gère la logique de paiement avec Stripe

const { stripe, paymentOptions } = require('../config/stripe');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const getProviderName = require('../utils/getProviderName');

/**
 * Crée une session de paiement Stripe Checkout
 */
const createCheckoutSession = async (req, res) => {
  try {
    console.log('🔍 FRONTEND_URL:', process.env.FRONTEND_URL);
    const { reservationId } = req.body;
    
    console.log('📥 Requête paiement reçue:', { reservationId, body: req.body });
    
    if (!reservationId) {
      console.log('❌ ID réservation manquant');
      return res.status(400).json({ message: "ID de réservation requis" });
    }
    
    // Récupérer les détails de la réservation
    const reservation = await Reservation.findById(reservationId)
      .populate('client')
      .populate('provider');
      
    console.log('📦 Réservation trouvée:', {
      id: reservation?._id,
      prixTotal: reservation?.prixTotal,
      typePrixTotal: typeof reservation?.prixTotal,
      client: reservation?.client?.email,
      status: reservation?.status,
      paid: reservation?.paid
    });
      
    if (!reservation) {
      console.log('❌ Réservation introuvable:', reservationId);
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    
    if (reservation.paid) {
      console.log('❌ Réservation déjà payée:', reservationId);
      return res.status(400).json({ message: "Cette réservation a déjà été payée" });
    }
    
    // Validation simple des données importantes
    if (typeof reservation.prixTotal !== 'number' || !isFinite(reservation.prixTotal) || reservation.prixTotal <= 0) {
      console.error('❌ createCheckoutSession: prixTotal invalide', {
        prixTotal: reservation.prixTotal,
        type: typeof reservation.prixTotal,
        isFinite: isFinite(reservation.prixTotal)
      });
      return res.status(400).json({ 
        message: 'Prix de la réservation invalide ou manquant',
        debug: { prixTotal: reservation.prixTotal, type: typeof reservation.prixTotal }
      });
    }
    if (!reservation.client || !reservation.client.email) {
      console.error('❌ createCheckoutSession: client ou email manquant', {
        hasClient: !!reservation.client,
        email: reservation.client?.email
      });
      return res.status(400).json({ message: 'Informations client manquantes (email requis)' });
    }

    // Calculer les montants
    const amount = Math.round(reservation.prixTotal * 100); // Conversion en centimes
    const applicationFee = Math.round(amount * 0.20); // 20% de commission pour l'admin (Tarrification 3)
    const providerAmount = amount - applicationFee; // 80% pour le prestataire
    
    let sessionOptions = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Utiliser EUR au lieu de USD
            product_data: {
              name: `Service de nettoyage - ${reservation.categorie || reservation.service}`,
              description: `Réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')} à ${reservation.heure}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/dashboard-client?payment=success&reservation=${reservationId}`,
      cancel_url: `http://localhost:3000/payment-cancel?reservation=${reservationId}`,
      client_reference_id: reservationId,
      customer_email: reservation.client.email,
      metadata: {
        reservationId: reservationId.toString(),
        service: reservation.categorie || reservation.service,
        clientId: reservation.client._id.toString(),
        providerId: reservation.provider?._id?.toString() || '',
        applicationFee: applicationFee.toString(),
        providerAmount: providerAmount.toString(),
      },
    };
    
    // Si le prestataire a un compte Stripe Connect, configurer le transfert automatique
    if (reservation.provider?.stripeAccountId && reservation.provider?.stripeOnboardingComplete) {
      sessionOptions.payment_intent_data = {
        application_fee_amount: applicationFee,
        on_behalf_of: reservation.provider.stripeAccountId,
        transfer_data: {
          destination: reservation.provider.stripeAccountId,
        },
      };
    }
    
    // Créer la session de paiement
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionOptions);
    } catch (stripeError) {
      // Erreur provenant du SDK Stripe (auth, params, montant invalide...)
      console.error('❌ Stripe SDK error when creating checkout session:', stripeError);
      const message = stripeError?.message || 'Erreur lors de la communication avec Stripe';
      // Retourner le message si raisonnable (ne pas exposer les secrets)
      return res.status(502).json({ message: `Erreur Stripe: ${message}` });
    }

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Erreur création session Stripe:", error);
    // Fournir plus de contexte en dev
    const resp = { message: "Erreur lors de la création de la session de paiement" };
    if (process.env.NODE_ENV !== 'production') resp.error = error.message;
    res.status(500).json(resp);
  }
};

/**
 * Crée un payment intent avec répartition automatique
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ message: "ID de réservation requis" });
    }
    
    // Récupérer les détails de la réservation
    const reservation = await Reservation.findById(reservationId).populate('provider');
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    
    // Calculer les montants
    const amount = Math.round(reservation.prixTotal * 100); // Conversion en centimes
    const applicationFee = Math.round(amount * 0.20); // 20% de commission pour l'admin (Tarrification 3)
    
    let paymentIntentOptions = {
      amount,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        reservationId: reservationId.toString(),
        service: reservation.categorie || reservation.service,
        applicationFee: applicationFee.toString(),
        providerAmount: (amount - applicationFee).toString(),
      },
    };
    
    // Si le prestataire a un compte Stripe Connect
    if (reservation.provider?.stripeAccountId && reservation.provider?.stripeOnboardingComplete) {
      paymentIntentOptions.application_fee_amount = applicationFee;
      paymentIntentOptions.on_behalf_of = reservation.provider.stripeAccountId;
      paymentIntentOptions.transfer_data = {
        destination: reservation.provider.stripeAccountId,
      };
    }
    
    // Créer le payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ Erreur création payment intent:", error);
    res.status(500).json({ message: "Erreur lors de la création du payment intent" });
  }
};

/**
 * Marque une réservation comme payée et traite la répartition des fonds
 */
const markReservationAsPaid = async (paymentIntentId) => {
  try {
    // Récupérer les détails du paiement
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.metadata.reservationId) {
      console.error("❌ Pas d'ID de réservation dans les métadonnées");
      return;
    }
    
    const applicationFee = parseInt(paymentIntent.metadata.applicationFee) || 0;
    const providerAmount = parseInt(paymentIntent.metadata.providerAmount) || 0;
    
    // Mettre à jour la réservation avec les détails de paiement
    const currentReservation = await Reservation.findById(paymentIntent.metadata.reservationId);
    // Si "confirmé", devenir "terminée" au moment du paiement
    let newStatus = currentReservation.status;
    if (currentReservation.status === 'confirmé' || currentReservation.status === 'confirmed') {
      newStatus = 'terminée';
    }
    
    const reservation = await Reservation.findByIdAndUpdate(
      paymentIntent.metadata.reservationId,
      { 
        paid: true,
        paymentId: paymentIntentId,
        paymentDate: new Date(),
        status: newStatus,
        paymentDetails: {
          totalAmount: paymentIntent.amount,
          applicationFee: applicationFee,
          providerAmount: providerAmount,
          currency: paymentIntent.currency
        }
      },
      { new: true }
    ).populate('provider').populate('client');
    
    if (!reservation) {
      console.error(`❌ Réservation ${paymentIntent.metadata.reservationId} introuvable`);
      return;
    }
    
    console.log(`✅ Réservation ${reservation._id} payée - Commission: ${applicationFee/100}€, Prestataire: ${providerAmount/100}€`);
    
    // Enregistrer la transaction pour comptabilité
    await recordPaymentTransaction(reservation, paymentIntent);
    
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
              pendingCommissions: applicationFee / 100
            }
          }
        );
        console.log(`✅ Commission admin créditée: ${applicationFee/100}€`);
      }
    } catch (adminError) {
      console.error('❌ Erreur lors de l\'ajout de la commission admin:', adminError);
    }
    
    // 📧 Envoyer un email de confirmation au client
    if (reservation.client && reservation.client.email) {
      try {
        const emailService = require("../services/emailService");
        const providerName = getProviderName(reservation.provider);
        await emailService.sendMail(
          reservation.client.email,
          "Paiement confirmé - Mission acceptée ✅",
          `<h2>Paiement confirmé</h2>
          <p>Merci ! Votre paiement de <strong>${paymentIntent.amount / 100}€</strong> a été confirmé.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #15803d; margin-top: 0;">Votre mission</h3>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Prestataire :</strong> ${providerName}</p>
            <p><strong>Montant payé :</strong> ${paymentIntent.amount / 100}€</p>
          </div>
          <p>Le prestataire a reçu la confirmation et peut commencer à préparer votre mission.</p>
          <p>Vous recevrez un rappel 24 heures avant la date prévue.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir ma mission
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Merci de faire confiance à Velya !</p>`
        );
        console.log("✅ Email de confirmation de paiement envoyé au client:", reservation.client.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de confirmation:", emailError);
        // Ne pas bloquer si l'email échoue
      }
    }
    
    return reservation;
  } catch (error) {
    console.error("❌ Erreur lors du traitement du paiement:", error);
  }
};

/**
 * Enregistre la transaction pour la comptabilité
 */
const recordPaymentTransaction = async (reservation, paymentIntent) => {
  try {
    const PaymentLog = require('../models/PaymentLog');
    
    const paymentLog = new PaymentLog({
      reservation: reservation._id,
      client: reservation.client._id,
      provider: reservation.provider?._id,
      paymentIntentId: paymentIntent.id,
      totalAmount: paymentIntent.amount / 100, // Convertir en euros
      applicationFee: parseInt(paymentIntent.metadata.applicationFee) / 100,
      providerAmount: parseInt(paymentIntent.metadata.providerAmount) / 100,
      currency: paymentIntent.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      createdAt: new Date()
    });
    
    await paymentLog.save();
    console.log(`✅ Transaction enregistrée pour la réservation ${reservation._id}`);
  } catch (error) {
    console.error('❌ Erreur enregistrement transaction:', error);
  }
};

/**
 * Crée un lien de configuration Stripe Connect pour un prestataire
 */
const createAccountLink = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un prestataire
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    const Prestataire = require('../models/Prestataire');
    
    // Récupérer le prestataire
    const provider = await Prestataire.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }
    
    // Si le prestataire a déjà un compte Stripe
    if (provider.stripeAccountId) {
      const accountLink = await stripe.accountLinks.create({
        account: provider.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/stripe-setup`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire`,
        type: 'account_onboarding',
      });
      
      return res.json({ url: accountLink.url });
    }
    
    // Créer un nouveau compte Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      email: provider.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        providerId: provider._id.toString(),
      },
    });
    
    // Mettre à jour le prestataire avec l'ID du compte Stripe
    provider.stripeAccountId = account.id;
    await provider.save();
    
    // Créer un lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/stripe-setup`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire`,
      type: 'account_onboarding',
    });
    
    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('❌ Erreur création lien de compte:', error);
    res.status(500).json({ message: 'Erreur lors de la création du lien de configuration Stripe' });
  }
};

/**
 * Vérifie le statut du compte Stripe d'un prestataire
 */
const checkAccountStatus = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un prestataire  
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const Prestataire = require('../models/Prestataire');
    
    // Récupérer le prestataire
    const provider = await Prestataire.findById(req.user.id);
    if (!provider || !provider.stripeAccountId) {
      return res.json({
        hasStripeAccount: false,
        accountStatus: null,
      });
    }
    
    // Récupérer les détails du compte Stripe
    const account = await stripe.accounts.retrieve(provider.stripeAccountId);
    
    // Vérifier le statut du compte
    const accountStatus = account.details_submitted 
      ? account.payouts_enabled 
        ? 'active'
        : 'pending_verification'
      : 'incomplete';

    // Mettre à jour le statut dans la base de données
    provider.stripeAccountStatus = accountStatus;
    await provider.save();
    
    res.json({
      hasStripeAccount: true,
      accountStatus,
      details: {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du statut du compte' });
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  markReservationAsPaid,
  recordPaymentTransaction,
  createAccountLink,
  checkAccountStatus
};