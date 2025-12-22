/**
 * Retourne le statut complet d'une réservation en tenant compte du paiement
 * @param {Object} reservation - L'objet réservation
 * @returns {Object} - { status: string, displayStatus: string, icon: string }
 */
const getReservationStatus = (reservation) => {
  const baseStatus = reservation.status;
  const isPaid = reservation.paid;

  // Combinaison status + paid
  if (baseStatus === 'terminée') {
    if (isPaid) {
      return {
        status: 'terminée',
        displayStatus: '✅ Terminée & Payée',
        color: 'bg-green-500',
        badgeColor: 'bg-green-100 text-green-800',
        icon: 'CheckCircle'
      };
    } else {
      return {
        status: 'terminée',
        displayStatus: '⏳ Terminée (En attente de paiement)',
        color: 'bg-orange-500',
        badgeColor: 'bg-orange-100 text-orange-800',
        icon: 'AlertCircle'
      };
    }
  }

  if (baseStatus === 'confirmé' || baseStatus === 'confirmed' || baseStatus === 'en cours') {
    return {
      status: baseStatus,
      displayStatus: '🟢 Confirmée',
      color: 'bg-blue-500',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: 'CheckCircle'
    };
  }

  if (baseStatus === 'annulée') {
    return {
      status: baseStatus,
      displayStatus: '❌ Annulée',
      color: 'bg-red-500',
      badgeColor: 'bg-red-100 text-red-800',
      icon: 'AlertCircle'
    };
  }

  if (baseStatus === 'estime' || baseStatus === 'en_attente_estimation') {
    return {
      status: baseStatus,
      displayStatus: '📋 En attente d\'estimation',
      color: 'bg-yellow-500',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      icon: 'Clock'
    };
  }

  // Défaut
  return {
    status: baseStatus,
    displayStatus: baseStatus,
    color: 'bg-gray-500',
    badgeColor: 'bg-gray-100 text-gray-800',
    icon: 'AlertCircle'
  };
};

module.exports = { getReservationStatus };
