require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Test de connexion MongoDB');
console.log('URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });