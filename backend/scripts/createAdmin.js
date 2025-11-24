const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB établie');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await Admin.findOne({ email: 'admin@velya.com' });
    if (existingAdmin) {
      console.log('❌ Admin déjà existant');
      process.exit(1);
    }

    // Créer l'admin principal
    const admin = new Admin({
      name: 'Administrateur Velya',
      email: 'admin@velya.com',
      password: 'VelyaAdmin2024!',
      role: 'super-admin',
      permissions: [
        'manage_users',
        'manage_providers',
        'manage_reservations',
        'view_analytics',
        'manage_disputes',
        'moderate_reviews',
        'financial_reports'
      ]
    });

    await admin.save();
    console.log('✅ Admin créé avec succès');
    console.log('📧 Email: admin@velya.com');
    console.log('🔑 Mot de passe: VelyaAdmin2024!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();