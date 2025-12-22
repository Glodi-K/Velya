const mongoose = require('mongoose');
const User = require('./src/models/User');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Velya');
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'index problématique
    try {
      await mongoose.connection.collection('users').dropIndex('referralCode_1');
      console.log('✅ Index referralCode_1 supprimé');
    } catch (err) {
      console.log('⚠️  Index déjà supprimé');
    }

    // Supprimer les utilisateurs de test
    const deleted = await User.deleteMany({});
    console.log(`✅ ${deleted.deletedCount} utilisateurs supprimés`);

    console.log('✅ Nettoyage terminé !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

cleanup();
