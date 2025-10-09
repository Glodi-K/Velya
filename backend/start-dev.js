// Script de démarrage pour le développement avec configuration Stripe
require('dotenv').config();

// Configuration par défaut pour le développement
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Velya';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_2024';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Configuration Stripe par défaut (clés de test)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dev_key';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dev_key';

console.log('🚀 Démarrage du serveur Velya en mode développement');
console.log('📊 Configuration:');
console.log(`   - Port: ${process.env.PORT}`);
console.log(`   - MongoDB: ${process.env.MONGO_URI}`);
console.log(`   - Frontend: ${process.env.FRONTEND_URL}`);
console.log(`   - Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configuré' : 'Non configuré'}`);
console.log('');

// Démarrer le serveur
console.log('🔄 Chargement de server.js...');
require('./server.js');