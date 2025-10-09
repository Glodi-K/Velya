const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Prestataire = require('./src/models/PrestataireSimple');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/Velya')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Page de debug
app.get('/debug', async (req, res) => {
  try {
    const prestataires = await Prestataire.find().select('-password');
    const count = await Prestataire.countDocuments();
    
    res.json({
      status: 'connected',
      database: 'Velya',
      collection: 'prestataires',
      count: count,
      prestataires: prestataires.map(p => ({
        id: p._id,
        nom: p.nom,
        email: p.email,
        role: p.role,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.listen(5002, () => {
  console.log('🔍 Debug server: http://localhost:5002/debug');
});