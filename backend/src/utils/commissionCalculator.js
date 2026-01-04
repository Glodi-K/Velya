/**
 * Utilitaire pour calculer les commissions de manière cohérente
 * Commission standard: 20% (admin), 80% (prestataire)
 */

/**
 * Calcule la commission en fonction du montant total
 * @param {number} amountInEuros - Montant en euros (ex: 100 pour 100€)
 * @returns {object} { commission, providerAmount, total }
 */
const calculateCommission = (amountInEuros) => {
  // Convertir en centimes pour éviter les problèmes de précision
  const amountInCents = Math.round(amountInEuros * 100);
  
  // Calculer la commission: 20%
  const commissionInCents = Math.round(amountInCents * 0.2);
  
  // Calculer le montant du prestataire: 80%
  const providerAmountInCents = amountInCents - commissionInCents;
  
  return {
    commission: commissionInCents / 100, // retourner en euros avec 2 décimales
    providerAmount: providerAmountInCents / 100, // retourner en euros avec 2 décimales
    total: amountInEuros,
    // Utile pour Stripe qui utilise les centimes
    commissionInCents,
    providerAmountInCents,
    amountInCents
  };
};

/**
 * Calcule la commission en centimes (pour Stripe)
 * @param {number} amountInCents - Montant en centimes
 * @returns {object} { commission, providerAmount }
 */
const calculateCommissionInCents = (amountInCents) => {
  const commissionInCents = Math.round(amountInCents * 0.2);
  const providerAmountInCents = amountInCents - commissionInCents;
  
  return {
    commission: commissionInCents,
    providerAmount: providerAmountInCents,
    total: amountInCents
  };
};

/**
 * Calcule la commission pour un montant en euros (retourne en euros avec 2 décimales)
 * @param {number} amountInEuros - Montant en euros
 * @returns {object} { commission, providerAmount, total }
 */
const calculateCommissionInEuros = (amountInEuros) => {
  const result = calculateCommission(amountInEuros);
  return {
    commission: parseFloat(result.commission.toFixed(2)),
    providerAmount: parseFloat(result.providerAmount.toFixed(2)),
    total: amountInEuros
  };
};

/**
 * Valide que commission + providerAmount = total
 * @param {number} commission
 * @param {number} providerAmount
 * @param {number} total
 * @returns {boolean}
 */
const validateCommissionCalculation = (commission, providerAmount, total) => {
  const calculated = parseFloat((commission + providerAmount).toFixed(2));
  const rounded = parseFloat(total.toFixed(2));
  return calculated === rounded;
};

module.exports = {
  calculateCommission,
  calculateCommissionInCents,
  calculateCommissionInEuros,
  validateCommissionCalculation
};
