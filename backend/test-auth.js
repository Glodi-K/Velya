const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Prestataire = require('./src/models/PrestataireSimple');

// Test rapide pour vérifier l'authentification
async function testAuth() {
  try {
    // Connecter à MongoDB
    await mongoose.connect('mongodb://localhost:27017/Velya');
    console.log('✅ Connecté à MongoDB');

    // Trouver un prestataire existant
    const prestataire = await Prestataire.findOne();
    if (!prestataire) {
      console.log('❌ Aucun prestataire trouvé');
      return;
    }

    console.log('🔍 Prestataire trouvé:', {
      id: prestataire._id,
      nom: prestataire.nom,
      email: prestataire.email,
      role: prestataire.role
    });

    // Créer un token comme le fait le backend
    const token = jwt.sign(
      { id: prestataire._id, role: 'prestataire' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: "7d" }
    );

    console.log('🎫 Token créé:', token);

    // Décoder le token pour vérifier
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('🔓 Token décodé:', decoded);

    // Tester la recherche avec l'ID du token
    const foundPrestataire = await Prestataire.findById(decoded.id);
    console.log('🔍 Prestataire trouvé avec token ID:', foundPrestataire ? 'OUI' : 'NON');

    if (foundPrestataire) {
      console.log('✅ Test réussi - L\'authentification devrait fonctionner');
    } else {
      console.log('❌ Test échoué - Problème d\'authentification');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAuth();