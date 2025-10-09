const Prestataire = require("../models/Prestataire");

// Fonction pour calculer la distance entre deux points (formule de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
};

const assignProvider = async (reservation) => {
    try {
        const availableProviders = await Prestataire.find({
            service: reservation.service, // Vérifier la spécialité du prestataire
            availability: { $in: [reservation.date] }, // Vérifier la disponibilité
            available: true,
        });

        if (availableProviders.length === 0) {
            console.log("❌ Aucun prestataire disponible");
            return null; // Aucun prestataire trouvé
        }

        // Trier les prestataires par distance par rapport à la réservation
        availableProviders.sort((a, b) => {
            const distanceA = calculateDistance(
                reservation.location.lat,
                reservation.location.lng,
                a.location.coordinates[1],
                a.location.coordinates[0]
            );
            const distanceB = calculateDistance(
                reservation.location.lat,
                reservation.location.lng,
                b.location.coordinates[1],
                b.location.coordinates[0]
            );

            return distanceA - distanceB; // Trier par distance croissante
        });

        console.log("✅ Prestataire sélectionné :", availableProviders[0]._id);
        return availableProviders[0]._id; // Retourner l'ID du prestataire sélectionné

    } catch (error) {
        console.error("❌ Erreur lors de l'attribution du prestataire :", error.message);
        throw new Error("Erreur interne lors de l'assignation du prestataire");
    }
};

module.exports = { assignProvider };

