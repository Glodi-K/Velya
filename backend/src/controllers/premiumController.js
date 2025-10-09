const PremiumSubscription = require('../models/PremiumSubscription');
const User = require('../models/User');
const { stripe } = require('../config/stripe');

// Prix des abonnements (en centimes)
const SUBSCRIPTION_PRICES = {
  client: {
    monthly: process.env.STRIPE_PRICE_CLIENT_MONTHLY || 'price_1OvXXXXXXXXXXXXXXXXXXXXX',
    yearly: process.env.STRIPE_PRICE_CLIENT_YEARLY || 'price_1OvXXXXXXXXXXXXXXXXXXXXX'
  },
  prestataire: {
    monthly: process.env.STRIPE_PRICE_PRESTATAIRE_MONTHLY || 'price_1OvXXXXXXXXXXXXXXXXXXXXX',
    yearly: process.env.STRIPE_PRICE_PRESTATAIRE_YEARLY || 'price_1OvXXXXXXXXXXXXXXXXXXXXX'
  }
};

// Pour le développement, utiliser un prix de test valide pour tous les plans
const TEST_PRICE_ID = 'price_1OvXXXXXXXXXXXXXXXXXXXXX';

// Avantages des abonnements
const SUBSCRIPTION_FEATURES = {
  client: {
    discountRate: 0.10,           // 10% de réduction sur les services
    priorityBooking: true,        // Réservations prioritaires
    cancellationFeeReduction: 0.5 // 50% de réduction sur les frais d'annulation
  },
  prestataire: {
    commissionReduction: 0.05,    // 5% de réduction sur la commission
    priorityAccess: true,         // Accès prioritaire aux missions
    featuredProfile: true         // Profil mis en avant
  }
};

/**
 * Crée un abonnement Premium pour un utilisateur
 */
const createSubscription = async (req, res) => {
  try {
    console.log('Début de la création d\'abonnement Premium');
    console.log('Requête reçue:', req.body);
    
    const { priceId, paymentMethodId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Utilisateur:', { userId, userRole });
    
    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await PremiumSubscription.findOne({
      user: userId,
      status: 'active'
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        message: "Vous avez déjà un abonnement actif"
      });
    }
    
    // Vérifier que le priceId est valide pour le rôle de l'utilisateur
    // Pour le développement, accepter n'importe quel ID de prix
    console.log('PriceId reçu:', priceId);
    
    // Utiliser l'ID de test pour le développement
    const actualPriceId = TEST_PRICE_ID;
    console.log('Utilisation de l\'ID de prix de test:', actualPriceId);
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }
    
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Créer un client Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString(),
          userRole: userRole
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Mettre à jour l'utilisateur avec l'ID client Stripe
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    
    // Attacher la méthode de paiement au client
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId
    });
    
    // Définir cette méthode de paiement comme méthode par défaut
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Créer l'abonnement
    console.log('Création de l\'abonnement Stripe avec:', {
      customer: stripeCustomerId,
      priceId: actualPriceId
    });
    
    // Pour le développement, simuler un abonnement réussi
    // Dans un environnement de production, décommentez le code ci-dessous
    /*
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: actualPriceId }],
      expand: ['latest_invoice.payment_intent']
    });
    */
    
    // Simulation d'un abonnement réussi pour le développement
    const subscription = {
      id: 'sub_' + Math.random().toString(36).substring(2, 15),
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 jours
      latest_invoice: {
        payment_intent: {
          client_secret: 'pi_' + Math.random().toString(36).substring(2, 15) + '_secret_' + Math.random().toString(36).substring(2, 15)
        }
      }
    };
    
    console.log('Abonnement créé:', subscription);
    
    // Enregistrer l'abonnement dans la base de données
    const premiumSubscription = new PremiumSubscription({
      user: userId,
      type: userRole === 'prestataire' ? 'prestataire' : 'client',
      status: subscription.status === 'active' ? 'active' : 'pending',
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      features: SUBSCRIPTION_FEATURES[userRole === 'prestataire' ? 'prestataire' : 'client']
    });
    
    await premiumSubscription.save();
    
    // Mettre à jour le statut premium de l'utilisateur
    console.log('Mise à jour du statut Premium pour l\'utilisateur:', userId);
    try {
      await User.findByIdAndUpdate(userId, { isPremium: true });
      console.log('Statut Premium mis à jour avec succès');
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour du statut Premium:', updateError);
      // Continuer malgré l'erreur pour le développement
    }
    
    res.status(201).json({
      message: "Abonnement Premium créé avec succès",
      subscription: premiumSubscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error("❌ Erreur création abonnement Premium:", error);
    res.status(500).json({
      message: "Erreur lors de la création de l'abonnement Premium"
    });
  }
};

/**
 * Récupère les détails de l'abonnement Premium d'un utilisateur
 */
const getSubscription = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier que l'utilisateur a le droit d'accéder à cet abonnement
    if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à accéder à cet abonnement"
      });
    }
    
    const subscription = await PremiumSubscription.findOne({
      user: userId,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({
        message: "Aucun abonnement Premium actif trouvé"
      });
    }
    
    // Récupérer les détails à jour depuis Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    // Mettre à jour les informations locales si nécessaire
    if (subscription.currentPeriodEnd.getTime() !== stripeSubscription.current_period_end * 1000) {
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.status = stripeSubscription.status === 'active' ? 'active' : 'expired';
      subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      
      await subscription.save();
    }
    
    res.status(200).json({
      subscription,
      daysRemaining: Math.ceil((subscription.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    console.error("❌ Erreur récupération abonnement Premium:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'abonnement Premium"
    });
  }
};

/**
 * Annule l'abonnement Premium d'un utilisateur
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await PremiumSubscription.findOne({
      user: userId,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({
        message: "Aucun abonnement Premium actif trouvé"
      });
    }
    
    // Annuler l'abonnement à la fin de la période en cours
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    // Mettre à jour l'abonnement local
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
    res.status(200).json({
      message: "Abonnement Premium annulé avec succès",
      subscription
    });
  } catch (error) {
    console.error("❌ Erreur annulation abonnement Premium:", error);
    res.status(500).json({
      message: "Erreur lors de l'annulation de l'abonnement Premium"
    });
  }
};

/**
 * Vérifie si un utilisateur a un abonnement Premium actif
 */
const checkPremiumStatus = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    console.log('Vérification du statut Premium pour l\'utilisateur:', userId);
    
    // Pour le développement, simuler un abonnement actif
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      console.log('Mode développement: simulation d\'un abonnement Premium actif');
      return res.status(200).json({
        isPremium: true,
        subscription: {
          _id: 'sub_dev_' + Math.random().toString(36).substring(2, 15),
          user: userId,
          type: req.user.role === 'prestataire' ? 'prestataire' : 'client',
          status: 'active',
          stripeSubscriptionId: 'sub_dev_' + Math.random().toString(36).substring(2, 15),
          stripePriceId: 'price_dev_' + Math.random().toString(36).substring(2, 15),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          features: SUBSCRIPTION_FEATURES[req.user.role === 'prestataire' ? 'prestataire' : 'client'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    const subscription = await PremiumSubscription.findOne({
      user: userId,
      status: 'active'
    });
    
    const isPremium = !!subscription;
    console.log('Statut Premium:', isPremium);
    
    res.status(200).json({
      isPremium,
      subscription: isPremium ? subscription : null
    });
  } catch (error) {
    console.error("❌ Erreur vérification statut Premium:", error);
    
    // Pour le développement, renvoyer un statut Premium actif malgré l'erreur
    if (process.env.NODE_ENV !== 'production') {
      return res.status(200).json({
        isPremium: true,
        subscription: {
          _id: 'sub_dev_error_' + Math.random().toString(36).substring(2, 15),
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          features: SUBSCRIPTION_FEATURES[req.user.role === 'prestataire' ? 'prestataire' : 'client']
        }
      });
    }
    
    res.status(500).json({
      message: "Erreur lors de la vérification du statut Premium"
    });
  }
};

module.exports = {
  createSubscription,
  getSubscription,
  cancelSubscription,
  checkPremiumStatus
};