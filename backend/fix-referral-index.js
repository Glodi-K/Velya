#!/usr/bin/env node
/**
 * Script pour corriger l'index referralCode
 */
const mongoose = require('mongoose');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Modèle User
const User = require('./src/models/User');

async function fixIndex() {
  try {
    console.log('📊 Connexion à MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Velya', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Supprimer l'ancien index
    console.log('🔄 Suppression de l\'ancien index referralCode...');
    try {
      await User.collection.dropIndex('referralCode_1');
      console.log('✅ Ancien index supprimé');
    } catch (err) {
      console.log('ℹ️  Aucun ancien index trouvé (c\'est normal):', err.message);
    }

    // Recréer l'index avec sparse: true
    console.log('🔄 Recréation de l\'index referralCode avec sparse: true...');
    await User.collection.createIndex({ referralCode: 1 }, { unique: true, sparse: true });
    console.log('✅ Index créé avec succès');

    // Lister tous les index
    const indexes = await User.collection.getIndexes();
    console.log('\n📋 Indexes actuels:');
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n✅ Correction terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixIndex();
