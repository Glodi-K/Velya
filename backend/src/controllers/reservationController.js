const Reservation = require("../models/Reservation");
const Prestataire = require("../models/PrestataireSimple");
const User = require("../models/User");
const calculatePrice = require("../utils/calculatePrice");
const sendEmail = require("../utils/sendEmail");
const determineSaison = require("../utils/determineSaison");
const { sendPushNotification } = require("../services/notificationService");
const { updateUserPreferences, addFavoriteProvider } = require("../services/userService");
const PaymentSecurityService = require("../services/paymentSecurityService");

// ✅ Générer un code PIN à 4 chiffres
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

// ✅ Créer une nouvelle réservation
const createReservation = async (req, res) => {
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
      coordinates
    } = req.body;
    
    // Déterminer automatiquement la saison en fonction de la date
    const saison = req.body.saison || determineSaison(date);

    if (!typeService || !surface || !adresse || !date || !heure) {
      return res.status(400).json({ message: "Champs manquants dans la requête." });
    }

    const photoPaths = req.files?.map((file) => file.path) || [];

    // Récupérer les informations de l'utilisateur pour les réductions
    const user = await User.findById(clientId);
    
    // Utilisation de la fonction calculatePrice pour déterminer le prix
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

    // Traitement des coordonnées GPS
    let parsedCoordinates = null;
    if (coordinates) {
      try {
        // Si les coordonnées sont envoyées comme objet FormData
        if (typeof coordinates === 'string') {
          parsedCoordinates = JSON.parse(coordinates);
        } else if (typeof coordinates === 'object') {
          parsedCoordinates = coordinates;
        }
        console.log("📍 Coordonnées GPS reçues:", parsedCoordinates);
      } catch (error) {
        console.error("❌ Erreur parsing coordonnées:", error);
        parsedCoordinates = null;
      }
    }

    const reservation = new Reservation({
      client: clientId,
      service: typeService,
      surface,
      adresse,
      coordinates: parsedCoordinates,
      date,
      heure,
      photos: photoPaths,
      options: parseOptionsObject(options),
      elements: parseOptionsObject(elements),
      niveauSalete: niveauSale,
      validationPin: generatePin(),
      status: "En attente du prestataire",
      categorie: categorie || "Nettoyage maison",
      saison,
      serviceSpecifique,
      prixTotal: prix.total,
      partPrestataire: prix.provider,
      partPlateforme: prix.platform,
      paid: false,
    });
    
    console.log(`🆕 Nouvelle réservation créée avec statut: ${reservation.status}`);

    await reservation.save();
   
    if (req.body.preferences) {
      const updatedUser = await updateUserPreferences(req.user.id, req.body.preferences);
      console.log("✅ Préférences mises à jour :", updatedUser.preferences);
    }

    const io = req.app.get("io");
    io.emit("nouvelle_reservation", {
      id: reservation._id,
      adresse: reservation.adresse,
      date: reservation.date,
      heure: reservation.heure,
      service: reservation.service,
    });

    res.status(201).json({ message: "✅ Réservation créée avec succès", reservation });
  } catch (error) {
    console.error("❌ Erreur création réservation :", error);
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
};

// Fonction utilitaire pour parser les options depuis FormData
function parseOptionsObject(optionsData) {
  if (!optionsData) return {};
  
  // Si c'est déjà un objet, le retourner tel quel
  if (typeof optionsData === 'object' && !Array.isArray(optionsData)) {
    return optionsData;
  }
  
  // Sinon, essayer de parser les options depuis FormData
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

const verifyReservationPin = async (req, res) => {
  const { reservationId, enteredPin } = req.body;
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "❌ Réservation introuvable" });

    if (reservation.validationPin === enteredPin) {
      return res.status(200).json({ success: true, message: "✅ Code PIN validé avec succès" });
    } else {
      return res.status(401).json({ success: false, message: "❌ Code PIN incorrect" });
    }
  } catch (err) {
    console.error("❌ Erreur vérification PIN :", err);
    res.status(500).json({ message: "Erreur serveur lors de la vérification" });
  }
};
// Assigner un ou plusieurs prestataires à une réservation
const assignProvidersToReservation = async (req, res) => {
  try {
    const { reservationId, providerIds } = req.body;
    if (!reservationId || !Array.isArray(providerIds) || providerIds.length === 0) {
      return res.status(400).json({ message: "reservationId et providerIds requis" });
    }
    
    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { 
        assignedProviders: providerIds,
        status: "assigned"
      },
      { new: true }
    );
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    
    res.status(200).json({ message: "Prestataires assignés avec succès", reservation });
  } catch (error) {
    console.error("❌ Erreur assignation prestataires:", error);
    res.status(500).json({ message: "Erreur serveur lors de l'assignation" });
  }
};

const getReservationsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("🔍 Recherche réservations pour userId:", userId);
    
    // Ensure userId is a valid ObjectId
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const reservations = await Reservation.find({ client: userId })
      .populate('client', 'name email')
      .populate('provider', 'name email phone')
      .sort({ date: -1 });
      
    console.log("📦 Réservations récupérées :", reservations.length);
    res.status(200).json({ reservation: reservations });
  } catch (error) {
    console.error("❌ Erreur récupération réservations :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getProviderHistory = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      provider: req.params.providerId,
      status: "terminée",
    });
    res.status(200).json(reservations);
  } catch (error) {
    console.error("❌ Erreur getProviderHistory :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les missions à venir d'un prestataire
const getUpcomingReservations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reservations = await Reservation.find({
      provider: req.params.providerId,
      status: { $nin: ["terminée", "annulée", "refused"] },
      date: { $gte: today.toISOString() }
    }).sort({ date: 1 });
    
    res.status(200).json(reservations);
  } catch (error) {
    console.error("❌ Erreur récupération missions à venir :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const acceptReservation = async (req, res) => {
  try {
    console.log("acceptReservation called with id:", req.params.id);
    const reservation = await Reservation.findById(req.params.id).populate('client', 'name email');
    if (!reservation) {
      console.log("Reservation not found for id:", req.params.id);
      return res.status(404).json({ message: "❌ Réservation introuvable" });
    }
    // Vérifier si la réservation est disponible pour acceptation
    if (reservation.provider && reservation.provider.toString() !== req.user.id && reservation.status !== "en_attente_prestataire") {
      return res.status(403).json({ message: "⛔ Réservation déjà prise par un autre prestataire." });
    }

    // Récupérer les informations du prestataire
    const provider = await User.findById(req.user.id);
    const providerName = provider ? provider.name : "Prestataire";

    reservation.status = "en_attente_estimation";
    reservation.provider = req.user.id;
    await reservation.save();

    // ✅ Envoyer un email au client pour l'informer que sa mission a été acceptée
    if (reservation.client && reservation.client.email) {
      try {
        const emailService = require("../services/emailService");
        await emailService.sendMissionAcceptedEmail(
          reservation.client.email,
          reservation,
          providerName
        );
        console.log("✅ Email de notification envoyé au client:", reservation.client.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de notification:", emailError);
        // Ne pas bloquer l'acceptation si l'email échoue
      }
    }

    res.status(200).json({ message: "✅ Mission acceptée, en attente d'estimation", reservation });
  } catch (error) {
    console.error("❌ Erreur lors de l'acceptation :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const refuseReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "refused" },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json({ message: "❌ Réservation refusée avec succès", reservation });
  } catch (error) {
    console.error("❌ Erreur lors du refus :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const rescheduleReservation = async (req, res) => {
  const { id: reservationId } = req.params;
  try {
    const oldReservation = await Reservation.findById(reservationId);
    if (!oldReservation) return res.status(404).json({ message: "Réservation introuvable" });
    oldReservation.reprogrammed = true;
    oldReservation.status = "annulée";
    await oldReservation.save();

    const otherProvider = await Prestataire.findOne({ _id: { $ne: oldReservation.provider } });
    if (!otherProvider) return res.status(404).json({ message: "Aucun autre prestataire dispo" });

    const newDate = new Date(oldReservation.date);
    newDate.setDate(newDate.getDate() + 1);

    const newReservation = new Reservation({
      client: oldReservation.client,
      provider: otherProvider._id,
      date: newDate,
      service: oldReservation.service,
      adresse: oldReservation.adresse,
      surface: oldReservation.surface,
      status: "en_attente_prestataire"
    });

    await newReservation.save();
    res.status(200).json({ message: "✅ Réservation reprogrammée", reservation: newReservation });
  } catch (error) {
    console.error("❌ Erreur reprogrammation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const estimateReservation = async (req, res) => {
  try {
    const { estimatedPrice } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { estimatedPrice, status: "estime" },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json({ message: "✅ Estimation envoyée", reservation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { paid: true, status: "confirmed" },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json({ message: "✅ Paiement confirmé", reservation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const assignProvider = async (req, res) => {
  try {
    const { providerId } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { 
        provider: providerId,
        status: "assigned"
      },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json({ message: "✅ Prestataire assigné", reservation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const finalEstimation = async (req, res) => {
  try {
    const { finalPrice } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { finalPrice, status: "estimation_finale" },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json({ message: "✅ Estimation finale envoyée", reservation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone');
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getAvailableReservations = async (req, res) => {
  try {
    // Debug: compter toutes les réservations par statut
    const allReservations = await Reservation.find({});
    const statusCounts = {};
    allReservations.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    console.log("📋 Statuts des réservations:", statusCounts);
    
    const reservations = await Reservation.find({
      status: "en_attente_prestataire"
    }).populate('client', 'name email phone').sort({ createdAt: -1 });
    console.log(`📋 Réservations disponibles trouvées: ${reservations.length}`);
    res.status(200).json(reservations);
  } catch (error) {
    console.error("❌ Erreur getAvailableReservations:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  createReservation,
  verifyReservationPin,
  getReservationsByUser,
  getProviderHistory,
  getUpcomingReservations,
  acceptReservation,
  refuseReservation,
  rescheduleReservation,
  estimateReservation,
  markAsPaid,
  assignProvider,
  finalEstimation,
  getReservationById,
  getAvailableReservations,
  assignProvidersToReservation
};