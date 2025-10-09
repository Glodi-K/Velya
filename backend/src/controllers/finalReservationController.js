const Reservation = require("../models/Reservation");
const Prestataire = require("../models/Prestataire");
const User = require("../models/User");
const calculatePrice = require("../utils/calculatePrice");
const sendEmail = require("../utils/sendEmail");
const determineSaison = require("../utils/determineSaison");
const { sendPushNotification } = require("../services/notificationService");
const { updateUserPreferences } = require("../services/userService");
const PaymentSecurityService = require("../services/paymentSecurityService");

// ✅ Générer un code PIN à 4 chiffres
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

// ✅ Créer une réservation finale avec prestataire sélectionné
const createFinalReservation = async (req, res) => {
  try {
    if (!req.files || req.files.length < 1 || req.files.length > 30) {
      return res.status(400).json({ message: "Ajoutez entre 1 et 30 photos." });
    }

    const clientId = req.user.id;
    const {
      typeService,
      surface,
      adresse,
      date,
      heure,
      niveauSale,
      categorie,
      options = {},
      elements = {},
      serviceSpecifique,
      coordinates,
      providerId // ID du prestataire sélectionné
    } = req.body;

    // Validation
    if (!typeService || !surface || !adresse || !date || !heure || !providerId) {
      return res.status(400).json({ message: "Champs manquants dans la requête." });
    }

    // Vérifier que le prestataire existe
    const provider = await Prestataire.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable." });
    }

    const photoPaths = req.files?.map((file) => file.path) || [];

    // Déterminer automatiquement la saison
    const saison = req.body.saison || determineSaison(date);

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(clientId);

    // Calcul du prix
    const prix = calculatePrice({
      surface: parseFloat(surface),
      typeService,
      niveauSale,
      options: parseOptionsObject(options),
      elements: parseOptionsObject(elements),
      saison,
      serviceSpecifique,
      user
    }) || {
      total: 0,
      provider: 0,
      platform: 0,
    };

    // Créer la réservation avec le prestataire sélectionné
    const reservation = new Reservation({
      client: clientId,
      provider: providerId,
      service: typeService,
      surface,
      adresse,
      coordinates: coordinates ? JSON.parse(coordinates) : null,
      date,
      heure,
      photos: photoPaths,
      options: parseOptionsObject(options),
      elements: parseOptionsObject(elements),
      niveauSale,
      validationPin: generatePin(),
      status: "en_attente_estimation",
      categorie: categorie || "Nettoyage maison",
      saison,
      serviceSpecifique,
      prixTotal: prix.total,
      partPrestataire: prix.provider,
      partPlateforme: prix.platform,
      paid: false,
    });

    await reservation.save();

    // Mise à jour des préférences utilisateur
    if (req.body.preferences) {
      const updatedUser = await updateUserPreferences(req.user.id, req.body.preferences);
      console.log("✅ Préférences mises à jour :", updatedUser.preferences);
    }

    // Notification au prestataire
    const io = req.app.get("io");
    io.emit("nouvelle_reservation_assignee", {
      id: reservation._id,
      adresse: reservation.adresse,
      date: reservation.date,
      heure: reservation.heure,
      service: reservation.service,
      providerId: providerId
    });

    res.status(201).json({ 
      message: "✅ Réservation créée avec succès", 
      reservation,
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email
      }
    });
  } catch (error) {
    console.error("❌ Erreur création réservation finale :", error);
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
};

// Fonction utilitaire pour parser les options
function parseOptionsObject(optionsData) {
  if (!optionsData) return {};
  
  if (typeof optionsData === 'object' && !Array.isArray(optionsData)) {
    return optionsData;
  }
  
  const options = {};
  Object.keys(optionsData).forEach(key => {
    if (key.startsWith('options[') || key.startsWith('elements[')) {
      const optionName = key.match(/\[(.*?)\]/)[1];
      options[optionName] = optionsData[key] === 'true' ? true : 
                           !isNaN(optionsData[key]) ? Number(optionsData[key]) : 
                           optionsData[key];
    }
  });
  
  return options;
}

module.exports = {
  createFinalReservation
};
