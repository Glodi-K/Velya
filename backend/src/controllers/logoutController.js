const ActivityLog = require("../models/ActivityLog");

// Liste des tokens invalidés (en production, utiliser Redis)
const invalidatedTokens = new Set();

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Ajouter le token à la liste des tokens invalidés
      invalidatedTokens.add(token);
      
      // Log de déconnexion
      if (req.user) {
        await ActivityLog.create({
          user: req.user.id,
          action: "logout",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }
    }
    
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Fonction pour vérifier si un token est invalidé
exports.isTokenInvalidated = (token) => {
  return invalidatedTokens.has(token);
};

// Nettoyer les anciens tokens (à appeler périodiquement)
exports.cleanupTokens = () => {
  invalidatedTokens.clear();
};