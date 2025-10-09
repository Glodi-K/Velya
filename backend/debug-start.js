// Script de démarrage simplifié pour debug
require('dotenv').config();

console.log('🔍 Debug - Variables d\'environnement:');
console.log('PORT:', process.env.PORT || '5001');
console.log('MONGO_URI:', process.env.MONGO_URI || 'mongodb://localhost:27017/velya');

const express = require('express');
const cors = require('cors');

const app = express();

// CORS simple
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Route de test simple
app.get('/api/health', (req, res) => {
  console.log('✅ Route /api/health appelée');
  res.json({ 
    status: 'OK', 
    message: 'Backend Velya opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Route de test racine
app.get('/', (req, res) => {
  res.json({ message: 'Backend Velya - Serveur de test' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📍 Testez: http://localhost:${PORT}/api/health`);
});