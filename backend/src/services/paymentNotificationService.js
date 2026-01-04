const Notification = require('../models/Notification');
const { createAndSendNotification } = require('../utils/notificationHelper');
const { calculateCommissionInEuros } = require('../utils/commissionCalculator');

/**
 * Notifie le prestataire qu'il a reçu un paiement
 */
const notifyProviderPayment = async (app, reservation) => {
  try {
    if (!reservation.provider || !reservation.provider._id) return;

    const amount = reservation.prixTotal;
    const { commission, providerAmount } = calculateCommissionInEuros(amount);

    // Créer notification avec le nouveau schéma
    await createAndSendNotification(
      app,
      reservation.provider._id,
      'Paiement reçu',
      `Vous avez reçu ${providerAmount.toFixed(2)}€ pour la réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')}`,
      'payment'
    );

    console.log(`✅ Notification de paiement créée pour le prestataire ${reservation.provider._id}`);
  } catch (error) {
    console.error('❌ Erreur notification paiement:', error);
  }
};

module.exports = { notifyProviderPayment };