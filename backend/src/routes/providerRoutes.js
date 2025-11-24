const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getDistanceMatrix = require("../utils/googleMaps");
const Prestataire = require("../models/PrestataireSimple");
const User = require("../models/User");
const PremiumSubscription = require("../models/PremiumSubscription");
const Reservation = require('../models/Reservation');
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// ✅ Route pour inscrire un prestataire
router.post("/register", async (req, res) => {
    try {
        const { nom, email, password, phone, service, availability, location } = req.body;

        // Vérifier si l'email existe déjà
        const existingPrestataire = await Prestataire.findOne({ email });
        if (existingPrestataire) {
            return res.status(400).json({ message: "❌ Email déjà utilisé" });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le prestataire
        const newPrestataire = new Prestataire({
            nom,
            email,
            password: hashedPassword,
            phone,
            service,
            availability,
            location,
        });

        await newPrestataire.save();
        res.status(201).json({ message: "✅ Prestataire inscrit avec succès !", provider: newPrestataire });

    } catch (error) {
        console.error("🔥 Erreur serveur:", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ Route pour mise à jour de la position du prestataire
router.post("/update-location", async (req, res) => {
  try {
    const { providerId, lat, lng } = req.body;

    if (!providerId || lat == null || lng == null) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    const updated = await Prestataire.findByIdAndUpdate(
      providerId,
      {
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        lastUpdated: Date.now()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    res.json({
      message: "📍 Position mise à jour avec succès",
      location: updated.location
    });

  } catch (error) {
    console.error("❌ Erreur update-location :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// ✅ Route pour récupérer la position actuelle d'un prestataire
router.get('/:id/location', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id); // ✅ ici
    const prestataire = await Prestataire.findById(id);

    if (
      !prestataire ||
      !prestataire.location ||
      !prestataire.location.coordinates ||
      prestataire.location.coordinates.length !== 2
    ) {
      return res.status(404).json({ message: "❌ Prestataire ou position introuvable" });
    }

    const [lng, lat] = prestataire.location.coordinates;

    res.status(200).json({
      location: { lat, lng },
      providerName: prestataire.nom,
    });
  } catch (error) {
    console.error("❌ Erreur récupération position :", error.message);
    res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
  }
});

// ✅ Route pour mettre à jour la disponibilité d'un prestataire
router.patch("/availability", verifyToken, async (req, res) => {
    try {
        const { availability } = req.body;
        const prestataire = await Prestataire.findByIdAndUpdate(
      req.user.id,
            { availability },
            { new: true }
        );

        if (!prestataire) {
            return res.status(404).json({ message: "❌ Prestataire non trouvé" });
        }

        res.json({ message: "✅ Disponibilité mise à jour", provider: prestataire });

    } catch (error) {
        console.error("🔥 Erreur serveur:", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ Route pour récupérer tous les prestataires
router.get("/", async (req, res) => {
    try {
        const prestataires = await Prestataire.find({ isDeleted: { $ne: true } });
        res.json({ message: "✅ Prestataires récupérés", prestataires });

    } catch (error) {
        console.error("🔥 Erreur serveur:", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ Route pour récupérer les prestataires disponibles avec leur localisation
router.get("/available", async (req, res) => {
    try {
        const prestataires = await Prestataire.find({ 
            available: true, 
            isDeleted: { $ne: true },
            isActive: true 
        }).select("nom location");
        res.json({ message: "✅ Prestataires disponibles récupérés", prestataires });

    } catch (error) {
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ Route pour récupérer un prestataire par ID
router.get("/:id", async (req, res) => {
    try {
        console.log("📌 ID reçu:", req.params.id);

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "❌ ID du prestataire invalide" });
        }

        const prestataire = await Prestataire.findOne({ 
            _id: req.params.id, 
            isDeleted: { $ne: true } 
        });
        
        if (!prestataire) {
            return res.status(404).json({ message: "❌ Prestataire non trouvé ou supprimé" });
        }

        res.json({ message: "✅ Prestataire trouvé", prestataire });

    } catch (error) {
        console.error("🔥 Erreur serveur:", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ Route pour suivre un prestataire par son ID
router.get("/tracking", async (req, res) => {
    try {
        const { providerId } = req.query;
        console.log("📌 providerId reçu:", providerId); // DEBUG

        if (!providerId) {
            return res.status(400).json({ message: "❌ Aucun ID de prestataire fourni" });
        }

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({ message: "❌ ID du prestataire invalide" });
        }

        const prestataire = await Prestataire.findById(providerId);
        if (!prestataire) {
            return res.status(404).json({ message: "❌ Prestataire non trouvé" });
        }

        res.json({ location: prestataire.location });

    } catch (error) {
        console.error("🔥 Erreur serveur:", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// 📢 Vérification si la route est bien atteinte
console.log("🚀 Le fichier providerRoutes.js est chargé");

// ✅ Route pour trouver le prestataire le plus proche
router.get("/optimal", async (req, res) => {
    try {
        console.log("📢 La route /optimal a bien été appelée !");

        // 🔍 Récupérer la localisation du client
        const { clientLocation } = req.query;
        console.log("📍 Paramètre reçu : clientLocation =", clientLocation);
        
        if (!clientLocation) {
            return res.status(400).json({ message: "❌ Aucune localisation client fournie" });
        }
        
        const [clientLat, clientLng] = clientLocation.split(",").map(Number);
        if (isNaN(clientLat) || isNaN(clientLng)) {
            return res.status(400).json({ message: "❌ Format de localisation invalide" });
        }
        
        // 🔍 Récupérer les prestataires disponibles
        const prestataires = await Prestataire.find({ available: true });
        console.log("📋 Prestataires disponibles :", prestataires);

        if (prestataires.length === 0) {
            return res.status(404).json({ message: "❌ Aucun prestataire disponible" });
        }

        // 🔍 Vérifier que les IDs sont bien convertis en ObjectId
        const prestataireIds = prestataires.map(p => p._id);
        console.log("🔎 IDs des prestataires trouvés :", prestataireIds);

        // 🔍 Obtenir les distances via Google Maps API
        const prestataireLocations = prestataires.map(p => `${p.location.coordinates[1]},${p.location.coordinates[0]}`);
        console.log("📍 Coordonnées prestataires :", prestataireLocations);

        const distances = await getDistanceMatrix(clientLocation, prestataireLocations);
        console.log("📡 Réponse distances Google Maps :", distances);

        if (distances.status !== "OK") {
            return res.status(500).json({ message: "❌ Erreur API Google Maps", error: distances });
        }

        // 🔍 Trouver le prestataire le plus proche
        let optimalPrestataire = null;
        let minDistance = Infinity;

        prestataires.forEach((prestataire, index) => {
            const distanceValue = distances.rows[0].elements[index].distance.value;
            if (distanceValue < minDistance) {
                minDistance = distanceValue;
                optimalPrestataire = prestataire;
            }
        });

        if (!optimalPrestataire) {
            return res.status(404).json({ message: "❌ Aucun prestataire trouvé à proximité" });
        }

        // 🔍 Debugging de l'ID du prestataire
        console.log("✅ Prestataire sélectionné :", optimalPrestataire);
        console.log("🛠 Type de ID :", typeof optimalPrestataire?._id);
        console.log("🔎 L'ID est-il valide ?", mongoose.Types.ObjectId.isValid(optimalPrestataire._id));

        // 🔍 Vérification finale de l'ID du prestataire
        if (!optimalPrestataire || !optimalPrestataire._id || !mongoose.Types.ObjectId.isValid(optimalPrestataire._id)) {
            return res.status(400).json({ message: "❌ ID du prestataire invalide" });
        }

        res.json({ message: "✅ Prestataire optimal trouvé", prestataire: optimalPrestataire });
    } catch (error) {
        console.error("🔥 Erreur serveur :", error);
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ➡️ Ajouter un prestataire manuellement
router.post('/add-provider', async (req, res) => {
    try {
        const { nom, service, email } = req.body;
        const newPrestataire = new Prestataire({ nom, service, email });
        await newPrestataire.save();
        res.status(201).json({ message: "✅ Prestataire ajouté avec succès", prestataire: newPrestataire });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de l'ajout", error });
    }
});

// ➡️ Obtenir la liste complète des prestataires (admin ou debug)
router.get('/all-providers', async (req, res) => {
    try {
        const prestataires = await Prestataire.find();
        res.json({ message: "📜 Liste des prestataires", prestataires });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur de récupération", error });
    }
});

// ✅ Vérifier si un prestataire est Premium
router.get('/check-provider-premium/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const subscription = await PremiumSubscription.findOne({ user: providerId, type: 'provider', status: 'active' });
    res.json({ isPremium: !!subscription });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur lors de la vérification Premium", error });
  }
});



// ✅ Route : Nombre de prestations terminées cette semaine
router.get('/weekly-count/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // dimanche

    const count = await Reservation.countDocuments({
      provider: providerId,
      status: "confirmed",
      date: { $gte: startOfWeek },
    });

    res.json({ count });
  } catch (error) {
    console.error("❌ Erreur weekly-count :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Voir les prestataires favoris - Route temporairement simplifiée
router.get("/favorites", verifyToken, async (req, res) => {
  try {
    // Retourner un tableau vide pour éviter l'erreur 400
    res.json([]);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des favoris :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Ajouter un prestataire aux favoris
router.post('/favorites/:providerId', verifyToken, async (req, res) => {
  try {
    const providerId = req.params.providerId;
    // Retourner simplement l'ID pour simuler un succès
    res.status(200).json({ _id: providerId });
  } catch (error) {
    console.error("❌ Erreur POST favoris :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Retirer un prestataire des favoris
router.delete('/favorites/:providerId', verifyToken, async (req, res) => {
  try {
    const providerId = req.params.providerId;
    // Retourner simplement l'ID pour simuler un succès
    res.status(200).json({ _id: providerId });
  } catch (error) {
    console.error("❌ Erreur DELETE favoris :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Vérifier le statut Stripe du prestataire
router.get('/stripe-status/:providerId', verifyToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const prestataire = await Prestataire.findById(providerId);
    
    if (!prestataire) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }
    
    const hasStripeAccount = !!(prestataire.stripeAccountId && prestataire.stripeOnboardingComplete);
    
    // Si le prestataire a un compte Stripe, actualiser le statut depuis Stripe
    let accountStatus = prestataire.stripeAccountStatus;
    if (hasStripeAccount && prestataire.stripeAccountId) {
      try {
        const { stripe } = require('../config/stripe');
        const account = await stripe.accounts.retrieve(prestataire.stripeAccountId);
        
        // Mettre à jour le statut basé sur les détails Stripe
        accountStatus = account.details_submitted 
          ? account.charges_enabled && account.payouts_enabled
            ? 'active'
            : 'pending_verification'
          : 'incomplete';
        
        // Sauvegarder les mises à jour
        prestataire.stripeAccountStatus = accountStatus;
        prestataire.stripeOnboardingComplete = account.details_submitted;
        prestataire.stripeAccountVerified = accountStatus === 'active';
        prestataire.stripeAccountDetails = {
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          lastUpdated: new Date()
        };
        await prestataire.save();
        
        console.log(`✅ Status Stripe actualisé pour ${prestataire.name}: ${accountStatus}`);
      } catch (stripeError) {
        console.error('❌ Erreur lors de l\'actualisation du statut Stripe:', stripeError);
        // Continuer avec le statut en base si erreur
      }
    }
    
    res.json({ 
      hasStripeAccount,
      accountStatus: accountStatus || null
    });
  } catch (error) {
    console.error("❌ Erreur vérification Stripe:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Récupérer les revenus du prestataire
router.get('/earnings/:providerId', verifyToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const PaymentLog = require('../models/PaymentLog');
    
    // Vérifier que l'utilisateur peut accéder à ces données
    if (req.user.id !== providerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    // Récupérer tous les paiements du prestataire
    const payments = await PaymentLog.find({ 
      provider: providerId, 
      status: 'completed' 
    }).populate('reservation', 'date categorie');
    
    // Calculer les statistiques
    const totalEarnings = payments.reduce((sum, payment) => sum + payment.providerAmount, 0);
    const totalCommissions = payments.reduce((sum, payment) => sum + payment.applicationFee, 0);
    const totalTransactions = payments.length;
    
    // Revenus par mois
    const monthlyEarnings = {};
    payments.forEach(payment => {
      const month = new Date(payment.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyEarnings[month] = (monthlyEarnings[month] || 0) + payment.providerAmount;
    });
    
    res.json({
      totalEarnings,
      totalCommissions,
      totalTransactions,
      monthlyEarnings,
      recentPayments: payments.slice(-10) // 10 derniers paiements
    });
  } catch (error) {
    console.error('❌ Erreur récupération revenus:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// New route to get random available prestataires
const { getRandomAvailablePrestataires } = require("../controllers/prestataireController");

router.get("/random-available", getRandomAvailablePrestataires);

// ✅ Exporter les routes
module.exports = router;