const mongoose = require('mongoose');
require('dotenv').config();

const Reservation = require('../models/Reservation');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const reservation = new Reservation({
      user: new mongoose.Types.ObjectId("660fbe7d6484b3a5e4f7a888"), // à remplacer plus tard
      provider: new mongoose.Types.ObjectId("660fbe7d6484b3a5e4f7a999"), // à remplacer aussi
      date: new Date("2025-04-01T10:00:00"),
      service: "Nettoyage complet",
      location: "Paris, France",
      status: "en attente",
      categorie: "Ménage complet",
      price: 75,
      discountApplied: false
    });

    await reservation.save();
    console.log('✅ Réservation ajoutée :', reservation);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err);
    mongoose.disconnect();
  });

