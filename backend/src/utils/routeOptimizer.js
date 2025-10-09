const { getDistanceMatrix } = require("./googleMaps");

/**
 * Trouve le prestataire le plus proche du client en fonction de la distance.
 * @param {string} clientLocation - Coordonnées du client (ex: "48.8566,2.3522").
 * @param {Array} providers - Liste des prestataires disponibles [{ name, location }].
 * @returns {Object} - Prestataire optimal { name, location, distance }.
 */
async function findOptimalProvider(clientLocation, providers) {
    try {
        if (!clientLocation) throw new Error("❌ Aucune localisation client fournie.");
        if (providers.length === 0) throw new Error("❌ Aucun prestataire disponible.");

        let bestProvider = null;
        let shortestDistance = Infinity;

        for (const provider of providers) {
            console.log("📍 Calcul de distance pour:", provider.name, provider.location); // DEBUG

            const result = await getDistanceMatrix(clientLocation, provider.location);

            if (result.rows[0].elements[0].status === "OK") {
                const distance = result.rows[0].elements[0].distance.value;

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    bestProvider = { name: provider.name, location: provider.location, distance };
                }
            }
        }

        if (!bestProvider) {
            throw new Error("❌ Impossible de trouver un prestataire.");
        }

        console.log("✅ Prestataire trouvé:", bestProvider); // DEBUG
        return bestProvider;
    } catch (error) {
        console.error("❌ Erreur dans l'optimisation des trajets:", error.message);
        throw new Error("❌ Impossible d'optimiser les trajets.");
    }
}

module.exports = { findOptimalProvider };

