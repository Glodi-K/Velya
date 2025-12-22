#!/usr/bin/env node
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Velya');
    console.log('✅ Connecté');
    
    const db = mongoose.connection.db;
    
    // Lister les index
    const indexes = await db.collection('users').getIndexes();
    console.log('📋 Indexes avant:', Object.keys(indexes));
    
    // Essayer de supprimer
    try {
      await db.collection('users').dropIndex('referralCode_1');
      console.log('✅ Index supprimé');
    } catch (e) {
      console.log('ℹ️ Index non trouvé');
    }
    
    // Recréer
    await db.collection('users').createIndex({ referralCode: 1 }, { unique: true, sparse: true });
    console.log('✅ Index créé (sparse)');
    
    const newIndexes = await db.collection('users').getIndexes();
    console.log('📋 Indexes après:', Object.keys(newIndexes));
    
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

fixIndex();
