const mongoose = require("mongoose");

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
    try {
        console.log("🔍 Tentative de connexion à MongoDB avec URI :", process.env.MONGO_URI ? process.env.MONGO_URI.replace(/(mongodb:\/\/.*@)(.*)(:.*)/, '$1***$3') : "Non défini");
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 30000, // Timeout de connexion explicite à 30 secondes
        });

        console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erreur MongoDB: ${error.message}`);
        process.exit(1); // Arrête le serveur en cas d’échec
    }
};

module.exports = connectDB;

