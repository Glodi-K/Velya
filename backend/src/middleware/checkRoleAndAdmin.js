module.exports = (options = {}) => {
  return (req, res, next) => {
    const { role, isAdmin } = req.user; // récupérés depuis verifyToken
    const { requiredRole, adminOnly = false } = options;

    // 🔒 Si rôle requis
    if (requiredRole && role !== requiredRole) {
      return res.status(403).json({ message: "Accès refusé : rôle insuffisant" });
    }

    // 🔒 Si accès réservé aux admins
    if (adminOnly && !isAdmin) {
      return res.status(403).json({ message: "Accès refusé : admin requis" });
    }

    // ✅ Autorisé
    next();
  };
};

