// ml/getSuggestions.js

// 🔁 Exemple très simplifié (à remplacer par ton vrai modèle ML plus tard)
// Tu peux aussi importer un vrai modèle Python via API ou utiliser Tensorflow.js

const getSuggestions = async (userId, prestationHistory) => {
  // 👇 Simulation d'un traitement de l'historique (à remplacer par un vrai algo ML)
  console.log("🔍 Analyse des prestations pour utilisateur:", userId);

  // Exemple : si l’utilisateur a souvent réservé "Nettoyage maison", on recommande "Vitres" et "Repassage"
  const categories = prestationHistory.map(p => p.category);

  const suggestions = [];

  if (categories.includes("Nettoyage maison")) {
    suggestions.push("Repassage", "Vitres");
  }
  if (categories.includes("Nettoyage voiture")) {
    suggestions.push("Désinfection", "Nettoyage tapis");
  }
  if (categories.includes("Ménage complet")) {
    suggestions.push("Entretien piscine", "Nettoyage bureaux");
  }

  // 🔁 Eliminer les doublons
  const uniqueSuggestions = [...new Set(suggestions)];

  return uniqueSuggestions.slice(0, 3); // Max 3 suggestions
};

module.exports = getSuggestions;

