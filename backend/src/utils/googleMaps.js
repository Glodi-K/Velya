// Calcul de distance simple sans Google Maps API
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
}

function getDistanceMatrix(origin, destination) {
    const [originLat, originLon] = origin.split(',').map(Number);
    const destinations = Array.isArray(destination) ? destination : [destination];
    
    const elements = destinations.map(dest => {
        const [destLat, destLon] = dest.split(',').map(Number);
        const distance = calculateDistance(originLat, originLon, destLat, destLon);
        return {
            distance: { value: distance * 1000, text: `${distance.toFixed(1)} km` },
            duration: { value: Math.round(distance * 60), text: `${Math.round(distance)} min` }
        };
    });
    
    return { status: 'OK', rows: [{ elements }] };
}

module.exports = { getDistanceMatrix };
