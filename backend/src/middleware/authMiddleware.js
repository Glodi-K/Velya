const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prestataire = require("../models/PrestataireSimple");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "⛔ Aucun token fourni" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      user = await Prestataire.findById(decoded.id).select("-password");
    }
    
    if (!user) {
      return res.status(401).json({ message: "⛔ Utilisateur introuvable" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "⛔ Token invalide ou expiré" });
  }
};

module.exports = verifyToken;

