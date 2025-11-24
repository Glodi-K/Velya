module.exports = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié et a le rôle admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }

    next();
  } catch (error) {
    console.error("Erreur middleware isAdmin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

