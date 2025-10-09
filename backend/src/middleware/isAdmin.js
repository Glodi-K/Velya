// ✅ Bypass temporaire du middleware admin pour debug UI
module.exports = async (req, res, next) => {
  try {
    // 🔐 Si l'utilisateur n'est pas authentifié (ex: pas de token), on injecte un admin fictif
    if (!req.user) {
      req.user = {
        id: "admin-temp",
        role: "admin",
  email: "admin@velya.com",
      };
    }

    // ✅ Vérification stricte du rôle
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "⛔ Accès réservé aux admins." });
    }

    next(); // Passe au middleware suivant
  } catch (error) {
    console.error("❌ Erreur middleware isAdmin :", error);
    res.status(500).json({ message: "❌ Erreur interne du middleware admin" });
  }
};

