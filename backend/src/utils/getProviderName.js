/**
 * Récupère le nom d'affichage du prestataire
 * Pour un indépendant: "Prénom Nom"
 * Pour une entreprise: "Raison Sociale"
 * @param {Object} provider - Objet prestataire
 * @returns {string} Nom du prestataire
 */
const getProviderName = (provider) => {
  if (!provider) return 'Votre prestataire';
  
  // Si c'est une entreprise
  if (provider.typePrestataire === 'entreprise') {
    return provider.raisonSociale || 'Votre prestataire';
  }
  
  // Si c'est un indépendant
  if (provider.typePrestataire === 'independant') {
    if (provider.prenom && provider.nom) {
      return `${provider.prenom} ${provider.nom}`;
    }
  }
  
  // Fallback sur le virtual 'name' ou providerName
  return provider.name || provider.providerName || 'Votre prestataire';
};

module.exports = getProviderName;
