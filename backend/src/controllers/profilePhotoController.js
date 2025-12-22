const User = require('../models/User');
const Prestataire = require('../models/Prestataire');
const fs = require('fs');
const path = require('path');

/**
 * Upload la photo de profil du client
 */
const uploadClientProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.profilePhoto) {
      const oldPath = path.join(__dirname, '../../', user.profilePhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Sauvegarder le chemin de la nouvelle photo
    user.profilePhoto = req.file.path;
    await user.save();

    const photoUrl = `/api/profile-photos/client/${userId}/file`;
    res.status(200).json({
      message: "Photo de profil mise à jour avec succès",
      profilePhoto: photoUrl
    });
  } catch (error) {
    console.error("❌ Erreur upload photo client:", error);
    res.status(500).json({ message: "Erreur lors de l'upload de la photo" });
  }
};

/**
 * Upload la photo de profil/logo du prestataire
 */
const uploadProviderProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const providerId = req.user.id;
    const provider = await Prestataire.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Supprimer l'ancienne photo si elle existe
    if (provider.profilePhoto) {
      const oldPath = path.join(__dirname, '../../', provider.profilePhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Sauvegarder le chemin de la nouvelle photo
    provider.profilePhoto = req.file.path;
    await provider.save();

    const photoUrl = `/api/profile-photos/provider/${providerId}/file`;
    res.status(200).json({
      message: "Photo de profil mise à jour avec succès",
      profilePhoto: photoUrl
    });
  } catch (error) {
    console.error("❌ Erreur upload photo prestataire:", error);
    res.status(500).json({ message: "Erreur lors de l'upload de la photo" });
  }
};

/**
 * Récupère la photo de profil du client
 */
const getClientProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || !user.profilePhoto) {
      return res.status(404).json({ message: "Photo introuvable" });
    }

    const photoUrl = `/api/profile-photos/client/${userId}/file`;
    res.status(200).json({ profilePhoto: photoUrl });
  } catch (error) {
    console.error("❌ Erreur récupération photo client:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la photo" });
  }
};

/**
 * Sert le fichier photo du client
 */
const serveClientProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || !user.profilePhoto) {
      return res.status(404).json({ message: "Photo introuvable" });
    }

    res.sendFile(path.resolve(user.profilePhoto));
  } catch (error) {
    console.error("❌ Erreur service photo client:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la photo" });
  }
};

/**
 * Récupère la photo de profil du prestataire
 */
const getProviderProfilePhoto = async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await Prestataire.findById(providerId);
    
    if (!provider || !provider.profilePhoto) {
      return res.status(404).json({ message: "Photo introuvable" });
    }

    const photoUrl = `/api/profile-photos/provider/${providerId}/file`;
    res.status(200).json({ profilePhoto: photoUrl });
  } catch (error) {
    console.error("❌ Erreur récupération photo prestataire:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la photo" });
  }
};

/**
 * Sert le fichier photo du prestataire
 */
const serveProviderProfilePhoto = async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await Prestataire.findById(providerId);
    
    if (!provider || !provider.profilePhoto) {
      return res.status(404).json({ message: "Photo introuvable" });
    }

    res.sendFile(path.resolve(provider.profilePhoto));
  } catch (error) {
    console.error("❌ Erreur service photo prestataire:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la photo" });
  }
};

module.exports = {
  uploadClientProfilePhoto,
  uploadProviderProfilePhoto,
  getClientProfilePhoto,
  getProviderProfilePhoto,
  serveClientProfilePhoto,
  serveProviderProfilePhoto
};
