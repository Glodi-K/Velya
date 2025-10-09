require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  // Modifie ici l’email du compte à promouvoir
  const user = await User.findOne({ email: "adminclient@test.com" });

  if (!user) {
    console.log("❌ Utilisateur non trouvé");
    return process.exit(1);
  }

  user.role = "admin";
  await user.save();

  console.log("✅ Utilisateur promu admin :", user.email);
  process.exit();
};

run().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

