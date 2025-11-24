const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");
const Reservation = require("../models/Reservation");
const reservationController = require("../controllers/reservationController");
const cron = require("node-cron");

const {
  sendClientNotification,
  sendProviderNotification,
  sendReservationCancellation,
  sendReservationReminder,
  sendMissionCompletedEmail,
} = require("../services/emailService.js");

const multer = require("multer");
const fs = require("fs");

// ✅ Configuration de Multer pour enregistrer les photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = `uploads/reservations`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ Route de création de réservation officielle
router.post(
  "/",
  verifyToken,
  upload.array("photos", 50),
  reservationController.createReservation
);

// ✅ Voir toutes les réservations (admin seulement)
router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json({ message: "✅ Réservations récupérées", reservations });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Réservations disponibles pour les prestataires
router.get("/available", verifyToken, reservationController.getAvailableReservations);

// ✅ Suivi du statut d'une réservation
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["En attente", "Attribuée", "En cours", "Terminée", "Annulée"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "❌ Statut invalide" });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });

    res.status(200).json({ message: "✅ Statut mis à jour", reservation });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur", error });
  }
});

// ✅ Acceptation ou refus d'une réservation
router.patch("/:id/accept", verifyToken, reservationController.acceptReservation);
router.patch("/:id/refuse", verifyToken, reservationController.refuseReservation);
router.patch("/:id/estimate", verifyToken, reservationController.estimateReservation);
router.patch("/:id/pay", verifyToken, reservationController.markAsPaid);
router.patch("/:id/assign-provider", verifyToken, reservationController.assignProvider);

// ✅ Estimation finale par le prestataire
router.post("/:id/niveau-sale", verifyToken, reservationController.finalEstimation);

// ✅ Détails d'une réservation spécifique
router.get("/:id", verifyToken, reservationController.getReservationById);

// ✅ Détails complets d'une réservation pour prestataire (avec photos et maps)
router.get("/:id/details", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone');
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    // Construire l'URL Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.adresse)}`;
    
    // Construire les URLs des photos
    const photoUrls = reservation.photos ? reservation.photos.map(photo => {
      return `http://localhost:5001/${photo.replace(/\\/g, '/')}`;
    }) : [];

    const detailedReservation = {
      ...reservation.toObject(),
      mapsUrl,
      photoUrls
    };

    res.json(detailedReservation);
  } catch (error) {
    console.error("❌ Erreur récupération détails:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Toutes les réservations d'un client
router.get("/user/:userId", verifyToken, reservationController.getReservationsByUser);

// ✅ Récupérer les missions à venir d'un prestataire
router.get("/upcoming/:providerId", verifyToken, reservationController.getUpcomingReservations);

// ✅ Historique des prestations d'un prestataire
router.get("/history/:providerId", reservationController.getProviderHistory);

// ✅ Commandes acceptées par un prestataire
router.get("/accepted/:providerId", verifyToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const acceptedReservations = await Reservation.find({
      provider: providerId,
      status: { $in: ["en_attente_estimation", "estime", "confirmed", "en cours"] }
    })
    .populate("client", "name email phone")
    .sort({ date: 1 });
    
    res.json(acceptedReservations);
  } catch (error) {
    console.error("❌ Erreur récupération commandes acceptées:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Réservations assignées au prestataire (pour acceptation)
router.get("/assigned/:providerId", verifyToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const assignedReservations = await Reservation.find({

      status: "en_attente_prestataire"
    })
    .populate("client", "name email phone")
    .sort({ createdAt: -1 });
    
    res.json(assignedReservations);
  } catch (error) {
    console.error("❌ Erreur récupération réservations assignées:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Annuler une réservation par le client
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email')
      .populate('provider', 'name email');
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });
    
    if (req.user.id !== reservation.client._id.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    
    if (reservation.status === "terminée") {
      return res.status(400).json({ message: "❌ Impossible d'annuler une mission terminée" });
    }
    
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "annulée" },
      { new: true }
    );
    
    // Email au client
    if (reservation.client && reservation.client.email) {
      try {
        await sendReservationCancellation(reservation.client.email, reservation);
        console.log("✅ Email d'annulation envoyé au client:", reservation.client.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email au client:", emailError);
      }
    }
    
    // Email au prestataire si assigné
    if (reservation.provider && reservation.provider.email) {
      try {
        await sendReservationCancellation(reservation.provider.email, reservation);
        console.log("✅ Email d'annulation envoyé au prestataire:", reservation.provider.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email au prestataire:", emailError);
      }
    }
    
    res.json({ message: "✅ Réservation annulée avec succès", reservation: updatedReservation });
  } catch (error) {
    console.error("❌ Erreur lors de l'annulation:", error);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Marquer une commande comme terminée
router.patch("/:id/complete", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email')
      .populate('provider', 'name email');
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });
    
    if (req.user.id !== reservation.provider._id.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "terminée" },
      { new: true }
    );
    
    // Email au client
    if (reservation.client && reservation.client.email) {
      try {
        const providerName = reservation.provider ? reservation.provider.name : "Votre prestataire";
        await sendMissionCompletedEmail(
          reservation.client.email,
          reservation,
          providerName
        );
        console.log("✅ Email de fin de mission envoyé au client:", reservation.client.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de fin de mission:", emailError);
      }
    }
    
    res.json({ message: "✅ Commande marquée comme terminée", reservation: updatedReservation });
  } catch (error) {
    console.error("❌ Erreur lors de la finalisation:", error);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Modifier une réservation
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });

    if (req.user.id !== reservation.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ message: "✅ Réservation mise à jour", reservation: updatedReservation });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Supprimer une réservation
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });

    if (req.user.id !== reservation.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "🚫 Accès interdit" });
    }

    try {
      await sendReservationCancellation(req.user.email, reservation);
      console.log("📩 Email d'annulation envoyé !");
    } catch (emailError) {
      console.error("❌ Erreur email :", emailError);
    }

    await reservation.deleteOne();
    res.json({ message: "✅ Réservation supprimée et email envoyé" });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Objectifs hebdo du prestataire
router.get("/weekly-goals/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now.setDate(now.getDate() - diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const reservations = await Reservation.find({
      provider: providerId,
      status: "confirmed",
      date: { $gte: monday },
    });

    const count = reservations.length;

    let badge = "";
    if (count >= 5) badge = "🏆 Champion de la semaine";
    else if (count >= 3) badge = "⭐ Performer";
    else if (count >= 1) badge = "🚀 Bien démarré";

    res.json({ count, badge });
  } catch (error) {
    console.error("❌ Erreur objectifs hebdo :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Envoyer un rappel de paiement au client
router.post("/:id/send-payment-reminder", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email')
      .populate('provider', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ message: "❌ Réservation non trouvée" });
    }
    
    // Vérifier que c'est bien le prestataire qui fait la demande
    if (req.user.id !== reservation.provider._id.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    
    // Vérifier que la mission est terminée
    if (reservation.status !== 'terminée' && reservation.status !== 'completed') {
      return res.status(400).json({ message: "❌ La mission doit être terminée" });
    }
    
    // Vérifier que le paiement n'a pas déjà été effectué
    if (reservation.paid) {
      return res.status(400).json({ message: "❌ Cette réservation a déjà été payée" });
    }
    
    // Envoyer l'email de rappel au client
    if (reservation.client && reservation.client.email) {
      const emailService = require('../services/emailService');
      await emailService.sendPaymentReminderEmail(
        reservation.client.email,
        reservation,
        reservation.provider.name
      );
      console.log("✅ Rappel de paiement envoyé au client:", reservation.client.email);
    }
    
    res.json({ message: "✅ Rappel de paiement envoyé au client" });
  } catch (error) {
    console.error("❌ Erreur envoi rappel paiement:", error);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Envoi automatique de rappels
cron.schedule("0 0 * * *", async () => {
  try {
    const maintenant = new Date();
    const demain = new Date(maintenant);
    demain.setDate(demain.getDate() + 1);
    
    const reservations = await Reservation.find({
      date: {
        $gte: demain.setHours(0, 0, 0, 0),
        $lt: demain.setHours(23, 59, 59, 999)
      },
      status: { $in: ["confirmed", "en cours"] }
    })
    .populate("client", "name email")
    .populate("provider", "name email");
    
    for (const reservation of reservations) {
      try {
        if (reservation.client?.email) {
          await sendReservationReminder(reservation.client.email, reservation);
        }
        if (reservation.provider?.email) {
          await sendReservationReminder(reservation.provider.email, reservation);
        }
      } catch (emailError) {
        console.error(`❌ Erreur envoi rappel pour réservation ${reservation._id}:`, emailError);
      }
    }
    
    console.log(`📩 ${reservations.length} rappels envoyés pour demain`);
  } catch (error) {
    console.error("❌ Erreur tâche cron rappels:", error);
  }
});

module.exports = router;
