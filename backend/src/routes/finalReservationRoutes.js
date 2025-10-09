const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { createFinalReservation } = require("../controllers/finalReservationController");
const verifyToken = require("../middleware/verifyToken");

// Configuration Multer pour les photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/reservations/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Route pour créer une réservation finale avec prestataire
router.post(
  "/final-reservation",
  verifyToken,
  upload.array("photos", 30),
  createFinalReservation
);

module.exports = router;
