// config/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';
const JWT_EXPIRES_IN = '1h'; // 🕒 Durée de validité du token standard
const JWT_ADMIN_EXPIRES_IN = '24h'; // 🕒 Durée de validité du token admin (24h)
const JWT_PROVIDER_EXPIRES_IN = '8h'; // 🕒 Durée de validité du token prestataire (8h)

// 🔐 Générer un token signé
function generateToken(payload) {
  let expiresIn = JWT_EXPIRES_IN;
  if (payload.role === 'admin') {
    expiresIn = JWT_ADMIN_EXPIRES_IN;
  } else if (payload.role === 'prestataire') {
    expiresIn = JWT_PROVIDER_EXPIRES_IN;
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
}

// 🔍 Vérifier un token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("❌ Token invalide :", err.message);
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ADMIN_EXPIRES_IN,
  JWT_PROVIDER_EXPIRES_IN,
};

