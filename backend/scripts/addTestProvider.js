const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const hashedPassword = await bcrypt.hash('123456', 10);

  const existing = await User.findOne({ email: 'test-presta@example.com' });
  if (existing) {
    console.log("ℹ️ Le prestataire de test existe déjà.");
    return process.exit();
  }

  const user = new User({
    name: "Test Prestataire",
    email: "test-presta@example.com",
    password: hashedPassword,
    role: "prestataire"
  });

  await user.save();
  console.log("✅ Prestataire de test ajouté !");
  process.exit();
};

run().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

