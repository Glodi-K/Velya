const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const existing = await User.findOne({ email: 'admin@velya.com' });
  if (existing) {
    console.log("ℹ️ Un utilisateur avec cet email existe déjà.");
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = new User({
    name: 'Admin Test',
  email: 'admin@velya.com',
    password: hashedPassword,
    role: 'admin'
  });

  await admin.save();
  console.log("✅ Utilisateur admin ajouté avec succès !");
  process.exit();
};

run().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

