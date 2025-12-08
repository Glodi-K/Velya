const User = require('../models/User');
const Prestataire = require('../models/Prestataire');
const fs = require('fs');
const path = require('path');

/**
 * Mise à jour du profil client avec photo
 */
const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Mettre à jour les champs
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Gérer la photo si fournie
    if (req.file) {
      // Supprimer l'ancienne photo
      if (user.profilePhoto) {
        const oldPath = path.join(__dirname, '../../', user.profilePhoto);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePhoto = req.file.path;
    }

    await user.save();

    res.status(200).json({
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour profil client:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

/**
 * Mise à jour du profil prestataire avec photo/logo
 */
const updateProviderProfile = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { 
      nom, 
      prenom, 
      raisonSociale, 
      email, 
      phone, 
      address, 
      service 
    } = req.body;
    
    const provider = await Prestataire.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Mettre à jour les champs selon le type
    if (provider.typePrestataire === 'independant') {
      if (nom) provider.nom = nom;
      if (prenom) provider.prenom = prenom;
    } else if (provider.typePrestataire === 'entreprise') {
      if (raisonSociale) provider.raisonSociale = raisonSociale;
    }

    if (email) provider.email = email;
    if (phone) provider.phone = phone;
    if (address) provider.address = address;
    if (service) provider.service = service;

    // Gérer la photo/logo si fourni
    if (req.file) {
      // Supprimer l'ancienne photo
      if (provider.profilePhoto) {
        const oldPath = path.join(__dirname, '../../', provider.profilePhoto);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      provider.profilePhoto = req.file.path;
    }

    provider.lastUpdated = new Date();
    await provider.save();

    res.status(200).json({
      message: "Profil prestataire mis à jour avec succès",
      provider: {
        id: provider._id,
        typePrestataire: provider.typePrestataire,
        nom: provider.nom,
        prenom: provider.prenom,
        raisonSociale: provider.raisonSociale,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        service: provider.service,
        profilePhoto: provider.profilePhoto
      }
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour profil prestataire:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

/**
 * Récupère le profil complet du client
 */
const getClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("❌ Erreur récupération profil client:", error);
    res.status(500).json({ message: "Erreur lors de la récupération du profil" });
  }
};

/**
 * Récupère le profil complet du prestataire
 */
const getProviderProfile = async (req, res) => {
  try {
    const providerId = req.user.id;
    const provider = await Prestataire.findById(providerId).select('-password');
    
    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    res.status(200).json({ provider });
  } catch (error) {
    console.error("❌ Erreur récupération profil prestataire:", error);
    res.status(500).json({ message: "Erreur lors de la récupération du profil" });
  }
};

module.exports = {
  updateClientProfile,
  updateProviderProfile,
  getClientProfile,
  getProviderProfile
};
