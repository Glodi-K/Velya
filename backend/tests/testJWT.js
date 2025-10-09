require('dotenv').config(); // charge les variables d'environnement
const { generateToken, verifyToken } = require('../config/jwt');

// 👤 Exemple de payload à signer
const payload = {
  id: '1234567890abcdef',
  role: 'admin',
  isAdmin: true,
};

console.log("🔐 Payload utilisé :", payload);

// ✅ Générer le token
const token = generateToken(payload);
console.log("\n📦 Token généré :", token);

// ✅ Vérifier le token
const decoded = verifyToken(token);
console.log("\n✅ Token vérifié, contenu décodé :", decoded);

