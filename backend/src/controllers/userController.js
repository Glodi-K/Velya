const User = require("../models/User"); // ✅ Assurez-vous d'importer le modèle User
const bcrypt = require("bcryptjs");
const ActivityLog = require("../models/ActivityLog"); // ✅ NEW : pour loguer les actions
const { sendPushNotification } = require("../services/notificationService");
const { updateUserPreferences, addFavoriteProvider } = require("../services/userService");
const cloudinary = require("../config/cloudinary");

// ✅ Récupérer tous les utilisateurs
exports.getUsers = (req, res) => {
  res.json({ message: "Liste des utilisateurs" });
};

// ✅ Récupérer un utilisateur par son ID
exports.getUserById = (req, res) => {
  const userId = req.params.id;
  res.json({ message: `Utilisateur avec l'ID: ${userId}` });
};

// ✅ Ajouter un prestataire favori (avec logs de débogage)
exports.addFavoriteProvider = async (req, res) => {
  try {
    console.log("🔵 userId reçu :", req.params.id);
    console.log("🔵 providerId reçu :", req.body.providerId);

    const userId = req.params.id;
    const { providerId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ Aucun utilisateur trouvé avec cet ID :", userId);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.favoriteProviders.includes(providerId)) {
      return res.status(400).json({ message: "Le prestataire est déjà dans les favoris" });
    }

    user.favoriteProviders.push(providerId);
    await user.save();

    console.log("✅ Favori ajouté avec succès :", user.favoriteProviders);
    res.status(200).json({
      message: "Prestataire ajouté aux favoris avec succès",
      favoriteProviders: user.favoriteProviders,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l’ajout aux favoris :", error);
    res.status(500).json({ message: "Erreur lors de l’ajout aux favoris" });
  }
};

// ✅ Changer mot de passe + log de sécurité
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // ✅ Log de l’action
    await ActivityLog.create({
      user: user._id,
      action: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ message: "✅ Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error("❌ Erreur changement mot de passe :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Mettre à jour les préférences utilisateur
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body.preferences;

    const updatedUser = await updateUserPreferences(userId, preferences);

    res.status(200).json({
      message: "Préférences mises à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des préférences :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des préférences" });
  }
};

// ✅ Upload avatar utilisateur
exports.uploadAvatar = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: "❌ Chemin d'image manquant" });
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "avatars",
    });

    res.status(200).json({
      message: "✅ Avatar uploadé avec succès",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("❌ Erreur Cloudinary :", err.message);
    res.status(500).json({ message: "Erreur lors de l’upload" });
  }
};

