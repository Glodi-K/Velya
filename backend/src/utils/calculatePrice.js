// utils/calculatePrice.js
// Fonction qui reçoit un type de service + une surface ou une quantité, et retourne le prix

const { pricingTable, forfaits, majorations, tarifsSaisonniers } = require('../config/pricingTable');

/**
 * Calcule le prix d'un service de nettoyage
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.surface - Surface en m²
 * @param {string} params.typeService - Type de service (standard, renovation, specialise)
 * @param {string} params.niveauSale - Niveau de saleté (propre, sale, tres_sale, tapis, exterieur, vitres)
 * @param {Object} params.options - Options supplémentaires (animaux, urgence, week_end, etc.)
 * @param {Object} params.elements - Éléments forfaitaires (matelas_queen, canape_3places, etc.)
 * @param {string} params.saison - Saison (hiver, printemps, ete, automne)
 * @param {string} params.serviceSpecifique - Service spécifique saisonnier
 * @param {Object} params.user - Utilisateur pour appliquer les réductions (Premium, parrainage)
 * @returns {Object} Détails du prix calculé
 */
function calculatePrice({ surface, typeService, niveauSale, options = {}, elements = {}, saison, serviceSpecifique, user }) {
  if (!surface || !typeService || !niveauSale) return null;

  // 1. Tarif de base - vérifier d'abord les tarifs saisonniers si applicable
  let baseRate;
  
  // Si une saison et un service spécifique sont fournis, utiliser le tarif saisonnier
  if (saison && serviceSpecifique && tarifsSaisonniers[saison] && tarifsSaisonniers[saison][serviceSpecifique]) {
    baseRate = tarifsSaisonniers[saison][serviceSpecifique];
    // Si le tarif est un objet (pour les forfaits), utiliser la valeur appropriée
    if (typeof baseRate === 'object' && !Array.isArray(baseRate)) {
      if (baseRate.min && baseRate.max) {
        // Pour les fourchettes de prix, utiliser la moyenne
        baseRate = (baseRate.min + baseRate.max) / 2;
      } else {
        // Pour les autres objets, utiliser le premier tarif disponible
        baseRate = Object.values(baseRate)[0] || pricingTable.standard.propre;
      }
    }
  } else {
    // Sinon, utiliser le tarif standard
    baseRate = pricingTable[typeService]?.[niveauSale] || pricingTable.standard.propre;
  }

  // 2. Majoration cumulée
  let majoration = 0;
  Object.keys(options).forEach((opt) => {
    if (options[opt]) {
      majoration += majorations[opt] || 0;
    }
  });

  // 3. Calcul du prix au m²
  const pricePerM2 = baseRate + majoration;
  let total = surface * pricePerM2;

  // 4. Ajout des forfaits par élément
  Object.keys(elements).forEach((element) => {
    if (elements[element] > 0) {
      total += (forfaits[element] || 0) * elements[element];
    }
  });

  // 5. Application des réductions (Premium et parrainage)
  let discount = 0;
  let discountDetails = [];
  
  if (user) {
    // Réduction Premium (10%)
    if (user.isPremium) {
      discount += 0.10;
      discountDetails.push('Premium: -10%');
    }
    
    // Réduction parrainage pour les nouveaux utilisateurs (10%)
    if (user.referredBy && !user.hasUsedReferralDiscount) {
      discount += 0.10;
      discountDetails.push('Parrainage: -10%');
    }
  }
  
  // Appliquer la réduction (maximum 20%)
  discount = Math.min(discount, 0.20);
  const discountAmount = total * discount;
  const finalTotal = total - discountAmount;

  // 6. Répartition
  const provider = (finalTotal * 0.8).toFixed(2);
  const platform = (finalTotal * 0.2).toFixed(2);

  return {
    pricePerM2: pricePerM2.toFixed(2),
    subtotal: parseFloat(total.toFixed(2)),
    discount: parseFloat(discountAmount.toFixed(2)),
    discountPercentage: Math.round(discount * 100),
    discountDetails,
    total: parseFloat(finalTotal.toFixed(2)),
    provider: parseFloat(provider),
    platform: parseFloat(platform),
  };
}

module.exports = calculatePrice;