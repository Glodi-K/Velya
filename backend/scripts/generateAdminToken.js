const mongoose = require('mongoose');
require('dotenv').config();
const { generateToken } = require('../config/jwt');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  // 🔍 Trouver un admin
  const admin = await User.findOne({ role: 'admin' });

  if (!admin) {
    console.log("❌ Aucun utilisateur admin trouvé");
    return process.exit(1);
  }

  // ✅ Générer le token via config/jwt.js
  const token = generateToken({
    id: admin._id,
    role: admin.role,
    isAdmin: true,
  });

  console.log("📬 Token JWT admin :\n");
  console.log(token);

  process.exit();
};

run().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

