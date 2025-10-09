// utils/determineSaison.js
// Fonction pour déterminer la saison en fonction de la date

/**
 * Détermine la saison en fonction de la date
 * @param {Date|string} date - Date à évaluer
 * @returns {string} - Saison (hiver, printemps, ete, automne)
 */
function determineSaison(date) {
  // Convertir la date en objet Date si c'est une chaîne
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Obtenir le mois (0-11)
  const mois = dateObj.getMonth();
  
  // Déterminer la saison
  if (mois >= 2 && mois <= 4) {
    return 'printemps'; // Mars à Mai
  } else if (mois >= 5 && mois <= 7) {
    return 'ete'; // Juin à Août
  } else if (mois >= 8 && mois <= 10) {
    return 'automne'; // Septembre à Novembre
  } else {
    return 'hiver'; // Décembre à Février
  }
}

module.exports = determineSaison;