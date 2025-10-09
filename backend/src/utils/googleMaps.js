require('dotenv').config();

const axios = require("axios");

// Vérifier si la clé API est bien définie
if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("❌ Clé API Google Maps non trouvée !");
    throw new Error("❌ La clé API Google Maps n'est pas définie dans le fichier .env");
} else {
    console.log("✅ Clé API Google Maps détectée :", process.env.GOOGLE_MAPS_API_KEY);
}

// Création du client Google Maps
const googleMapsClient = axios.create({
    baseURL: "https://maps.googleapis.com/maps/api/",
    params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
    },
});

/**
 * Obtenir la distance et le temps estimé entre deux points.
 * @param {string} origin - Adresse ou coordonnées de départ (ex: "48.8566,2.3522").
 * @param {string} destination - Adresse ou coordonnées d'arrivée (ex: "48.8566,2.295").
 * @param {string} mode - Mode de transport ("driving", "walking", "bicycling", "transit").
 * @returns {Promise<Object>} - Distance et durée du trajet.
 */
async function getDistanceMatrix(origin, destination, mode = "driving") {
    try {
        const response = await googleMapsClient.get("distancematrix/json", {
            params: {
                origins: origin.toString(),
                destinations: destination.toString(),
                mode: mode,
                units: "metric", // Utilisation du système métrique
                language: "fr", // Réponse en français
            },
        });

        if (response.data.status !== "OK") {
            throw new Error(`❌ Erreur API Google Maps: ${response.data.error_message || response.data.status}`);
        }

        return response.data;
    } catch (error) {
        console.error("❌ Erreur Google Maps API:", error.response?.data || error.message);
        throw new Error("Impossible d'obtenir les données de distance.");
    }
}

module.exports = { getDistanceMatrix };

