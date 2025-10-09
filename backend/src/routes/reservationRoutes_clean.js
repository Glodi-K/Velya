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

// ✅ Marquer une commande comme terminée
router.patch("/:id/complete", verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });
    if (req.user.id !== reservation.provider.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    reservation.status = "Terminée";
    await reservation.save();
    res.status(200).json({ message: "✅ Commande marquée comme terminée", reservation });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur", error });
  }
});

// ✅ CRON : Rappel automatique des réservations du lendemain
cron.schedule("0 18 * * *", async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const reservations = await Reservation.find({
      date: { $gte: tomorrow, $lt: dayAfter },
      status: { $in: ["confirmed", "en cours"] }
    }).populate("client provider");

    let remindersSent = 0;
    for (const reservation of reservations) {
      if (reservation.client?.email) {
        await sendClientNotification(reservation.client.email, reservation);
        remindersSent++;
      }
      if (reservation.provider?.email) {
        await sendProviderNotification(reservation.provider.email, reservation);
        remindersSent++;
      }
    }
    console.log(`✅ CRON: ${remindersSent} rappels envoyés pour les réservations du ${tomorrow.toLocaleDateString()}`);
  } catch (error) {
    console.error("❌ CRON erreur rappel réservations:", error);
  }
});

module.exports = router;
