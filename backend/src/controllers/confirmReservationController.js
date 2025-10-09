const Reservation = require("../models/Reservation");
const User = require("../models/User");
const calculatePrice = require("../utils/calculatePrice");
const determineSaison = require("../utils/determineSaison");
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

// ✅ Confirmer une réservation avec prestataire
const confirmReservation = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { providerId, reservationData } = req.body;

    if (!providerId || !reservationData) {
      return res.status(400).json({ message: "Provider ID et données de réservation requis" });
    }

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
      photos = []
    } = reservationData;

    // Validation des champs requis
    if (!typeService || !surface || !adresse || !date || !heure) {
      return res.status(400).json({ message: "Champs manquants dans la réservation" });
    }

    // Déterminer la saison
    const saison = determineSaison(date);

    // Récupérer l'utilisateur pour les réductions
    const user = await User.findById(clientId);
    
    // Calculer le prix
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

    // Marquer la réduction de parrainage comme utilisée si applicable
    if (user && user.referredBy && !user.hasUsedReferralDiscount) {
      user.hasUsedReferralDiscount = true;
      await user.save();
    }

    // Créer la réservation avec le prestataire sélectionné
    const reservation = new Reservation({
      client: clientId,
      provider: providerId,
      service: typeService,
      surface,
      adresse,
      coordinates: coordinates || null,
      date,
      heure,
      photos: req.files?.map(file => file.path) || [],
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

    // Émettre l'événement de nouvelle réservation
    const io = req.app.get("io");
    io.emit("nouvelle_reservation", {
      id: reservation._id,
      adresse: reservation.adresse,
      date: reservation.date,
      heure: reservation.heure,
      service: reservation.service,
      provider: providerId
    });

    res.status(201).json({ 
      message: "✅ Réservation confirmée avec succès", 
      reservation 
    });

  } catch (error) {
    console.error("❌ Erreur confirmation réservation :", error);
    res.status(500).json({ message: "Erreur serveur lors de la confirmation" });
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
  confirmReservation
};
