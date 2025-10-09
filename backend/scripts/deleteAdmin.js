const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const run = async () => {
  rl.question("Entrez l'email de l'administrateur à supprimer : ", async (email) => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    const result = await User.deleteOne({ email: email });
    if (result.deletedCount === 0) {
      console.log(`ℹ️ Aucun utilisateur admin trouvé avec l'email : ${email}`);
    } else {
      console.log(`✅ Utilisateur admin avec l'email ${email} supprimé avec succès !`);
    }

    rl.close();
    process.exit();
  });
};

run().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
