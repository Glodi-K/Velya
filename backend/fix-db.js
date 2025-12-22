const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Velya', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Accès à la base de données
    const db = mongoose.connection.db;

    // Supprimer l'index referralCode_1
    try {
      await db.collection('users').dropIndex('referralCode_1');
      console.log('✅ Index referralCode_1 supprimé');
    } catch (err) {
      console.log('⚠️  Index n\'existe pas ou déjà supprimé');
    }

    // Nettoyer les anciens utilisateurs (optionnel)
    // await db.collection('users').deleteMany({});
    // console.log('✅ Collection users vidée');

    console.log('✅ Base de données réparée !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

fixDatabase();
