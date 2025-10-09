const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadSelfie } = require("../controllers/verificationController");

// 📂 Dossier temporaire pour stocker les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/selfies"),
  filename: (req, file, cb) => cb(null, `selfie-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// ✅ Route d’upload
router.post("/selfie", upload.single("selfie"), uploadSelfie);

module.exports = router;

