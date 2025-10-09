const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Prestataire = require("../models/PrestataireSimple");

// 📸 Contrôleur pour upload + vérification du selfie
exports.uploadSelfie = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image reçue" });
    }

    const selfiePath = req.file.path;
    console.log("✅ Selfie reçu :", selfiePath);

    // 📌 Récupérer l'utilisateur depuis le token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 💾 Sauvegarder le chemin du selfie en base
    await Prestataire.findByIdAndUpdate(decoded.id, {
      selfieImagePath: selfiePath
    });
    
    console.log("✅ Selfie accepté et sauvegardé en base");
    
    return res.status(200).json({ success: true, message: "Selfie vérifié avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur lors du traitement du selfie :", error);
    res.status(500).json({ message: "Erreur serveur lors de la vérification du selfie" });
  }
};

