const Reservation = require("../models/Reservation");
const Prestataire = require("../models/PrestataireSimple");
const User = require("../models/User");
const calculatePrice = require("../utils/calculatePrice");
const sendEmail = require("../utils/sendEmail");
const determineSaison = require("../utils/determineSaison");
const getProviderName = require("../utils/getProviderName");
const { sendPushNotification } = require("../services/notificationService");
const { updateUserPreferences, addFavoriteProvider } = require("../services/userService");
const PaymentSecurityService = require("../services/paymentSecurityService");
const { createAndSendNotification } = require("../utils/notificationHelper");

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
    status: "en_attente_prestataire",
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

    // Notifier tous les prestataires disponibles
    const prestataires = await Prestataire.find({ isApproved: true });
    for (const prestataire of prestataires) {
      await createAndSendNotification(
        req.app,
        prestataire._id,
        '🎉 Nouvelle mission disponible',
        `${typeService} - ${surface}m² à ${adresse} le ${new Date(date).toLocaleDateString('fr-FR')}`,
        'new_reservation'
      );
      
      // Envoyer email au prestataire
      if (prestataire.email) {
        try {
          const emailService = require("../services/emailService");
          const reservationData = {
            date: reservation.date,
            heure: reservation.heure,
            service: reservation.service,
            categorie: reservation.categorie,
            adresse: reservation.adresse,
            surface: reservation.surface
          };
          console.log('📧 Envoi email prestataire:', prestataire.email, reservationData);
          const emailResult = await emailService.sendProviderNotification(prestataire.email, reservationData);
          console.log("✅ Email envoyé au prestataire:", prestataire.email, "Résultat:", emailResult);
        } catch (emailError) {
          console.error("❌ Erreur email prestataire:", prestataire.email, emailError);
        }
      }
    }

    const io = req.app.get("io");
    if (io) {
      console.log('📡 Émission nouvelle_reservation:', reservation._id);
      io.emit("nouvelle_reservation", {
        id: reservation._id,
        adresse: reservation.adresse,
        date: reservation.date,
        heure: reservation.heure,
        service: reservation.service,
      });
    }

    res.status(201).json({ message: "✅ Réservation créée avec succès", reservation });
  } catch (error) {
    console.error("❌ Erreur création réservation :", error);
    const payload = { message: "Erreur serveur lors de la création." };
    if (process.env.NODE_ENV !== 'production') {
      payload.error = error.message;
      payload.stack = error.stack;
    }
    res.status(500).json(payload);
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
    // Récupérer toutes les missions acceptées par le prestataire (peu importe le statut final)
    // On exclut seulement les brouillons et les réservations non acceptées
    const reservations = await Reservation.find({
      provider: req.params.providerId,
      status: { $in: ["acceptée", "en attente d'estimation", "en attente de devis", "confirmé", "terminée", "annulée"] }
    }).sort({ date: -1 });
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
    
    const allReservations = await Reservation.find({
      provider: req.params.providerId,
      date: { $gte: today.toISOString() },
      status: { $in: ['acceptée', 'en attente d\'estimation', 'en attente de devis', 'confirmé'] },
      paid: { $ne: true } // Exclure les missions payées
    }).sort({ date: 1 });
    
    res.status(200).json(allReservations);
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
    const provider = await Prestataire.findById(req.user.id);
    const providerName = getProviderName(provider);
    
    // Sauvegarder le nom du prestataire dans la réservation
    reservation.providerName = providerName;

    reservation.status = "en_attente_estimation";
    reservation.provider = req.user.id;
    
    // ✅ Générer le lien Google Calendar
    const googleCalendarService = require('../services/googleCalendarService');
    const calendarLink = googleCalendarService.generateCalendarLink(reservation);
    
    // ✅ Créer l'événement Google Calendar (optionnel)
    try {
      const calendarEvent = await googleCalendarService.createEvent(reservation, provider.email);
      if (calendarEvent) {
        reservation.googleCalendarEventId = calendarEvent.id;
        console.log('✅ Événement Google Calendar créé:', calendarEvent.id);
      }
    } catch (calendarError) {
      console.error('❌ Erreur Google Calendar:', calendarError);
    }
    
    await reservation.save();

    // ✅ Émettre événement Socket.IO
    const io = req.app.get("io");
    if (io) {
      console.log('📡 Émission reservation_updated et mission_accepted pour:', reservation._id);
      io.emit("reservation_updated", { reservationId: reservation._id, status: reservation.status });
      io.to(`user_${reservation.client._id}`).emit("mission_accepted", reservation);
      io.to(`user_${req.user.id}`).emit("mission_accepted", reservation);
    } else {
      console.error('❌ Socket.IO non disponible');
    }

    // ✅ Créer une notification pour le client
    if (reservation.client && reservation.client._id) {
      await createAndSendNotification(
        req.app,
        reservation.client._id,
        '✅ Mission acceptée !',
        `${providerName} a accepté votre mission du ${new Date(reservation.date).toLocaleDateString('fr-FR')}`,
        'mission_accepted'
      );
    }

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

    // ✅ Envoyer un email au prestataire pour confirmer l'acceptation de la mission
    // Utiliser l'email du prestataire - essayer provider.email en priorité, puis req.user.email
    const providerEmail = provider?.email || req.user?.email;
    
    if (providerEmail) {
      try {
        const emailService = require("../services/emailService");
        await emailService.sendProviderMissionAcceptedEmail(
          providerEmail,
          providerName,
          reservation
        );
        console.log("✅ Email de confirmation envoyé au prestataire:", providerEmail);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email au prestataire:", emailError);
        // Ne pas bloquer l'acceptation si l'email échoue
      }
    } else {
      console.warn("⚠️ Email du prestataire introuvable - provider.email:", provider?.email, "req.user.email:", req.user?.email);
    }

    res.status(200).json({ 
      message: "✅ Mission acceptée, en attente d'estimation", 
      reservation,
      calendarLink 
    });
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
    ).populate('client');
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    
    // ✅ Émettre événement Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("reservation_updated", { reservationId: reservation._id, status: reservation.status });
      if (reservation.client) io.to(`user_${reservation.client._id}`).emit("mission_refused", reservation);
    }
    
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
    ).populate('client');
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    
    // ✅ Émettre événement Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("reservation_updated", { reservationId: reservation._id, status: reservation.status });
      if (reservation.client) io.to(`user_${reservation.client._id}`).emit("estimation_received", reservation);
    }
    
    res.status(200).json({ message: "✅ Estimation envoyée", reservation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const currentReservation = await Reservation.findById(req.params.id);
    // Si "confirmed", devenir "terminée" au moment du paiement
    let newStatus = currentReservation.status;
    if (currentReservation.status === 'confirmed' || currentReservation.status === 'confirmé') {
      newStatus = 'terminée';
    }
    
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { paid: true, status: newStatus },
      { new: true }
    ).populate('client provider');
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });
    
    // ✅ Émettre événement Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("reservation_updated", { reservationId: reservation._id, status: reservation.status, paid: true });
      if (reservation.client) io.to(`user_${reservation.client._id}`).emit("payment_confirmed", reservation);
      if (reservation.provider) io.to(`user_${reservation.provider._id}`).emit("payment_confirmed", reservation);
    }
    
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