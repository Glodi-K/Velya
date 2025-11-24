const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prestataire = require("../models/PrestataireSimple");
const Admin = require("../models/Admin");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "⛔ Token manquant" });
    }

    const token = authHeader.split(" ")[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    
    // Si c'est un admin, chercher dans la table Admin
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select("-password");
      if (user) {
        user.role = 'admin'; // S'assurer que le rôle est défini
      }
    }
    // Si c'est un prestataire, chercher dans la table Prestataire
    else if (decoded.role === 'prestataire') {
      user = await Prestataire.findById(decoded.id).select("-password");
    } else {
      // Sinon chercher dans la table User
      user = await User.findById(decoded.id).select("-password");
    }
    
    if (!user) {
      return res.status(401).json({ message: "⛔ Utilisateur introuvable ou supprimé" });
    }

    // Vérifier si le prestataire existe toujours (pas supprimé)
    if (decoded.role === 'prestataire' && (!user.isActive || user.isDeleted)) {
      return res.status(401).json({ message: "⛔ Compte prestataire désactivé ou supprimé" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Erreur vérification token:", error.message);
    return res.status(401).json({ message: "⛔ Token invalide ou expiré" });
  }
};

module.exports = verifyToken;