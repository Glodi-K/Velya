const Notification = require('../models/Notification');

// Configuration email désactivée temporairement
const transporter = null;

/**
 * Notifie le prestataire qu'il a reçu un paiement
 */
const notifyProviderPayment = async (reservation) => {
  try {
    if (!reservation.provider) return;

    const amount = reservation.prixTotal;
    const commission = Math.round(amount * 0.2 * 100) / 100;
    const providerAmount = Math.round((amount - commission) * 100) / 100;

    // Créer notification dans l'app
    await Notification.create({
      recipient: reservation.provider._id,
      recipientModel: 'PrestataireSimple',
      title: '💰 Paiement reçu',
      message: `Vous avez reçu ${providerAmount}€ pour la réservation du ${new Date(reservation.date).toLocaleDateString()}`,
      type: 'payment',
      data: {
        reservationId: reservation._id,
        amount: providerAmount,
        commission: commission,
        totalPaid: amount
      }
    });

    // Envoyer email
    if (transporter && reservation.provider.email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reservation.provider.email,
        subject: '💰 Paiement reçu - Velya',
        html: `
          <h2>Paiement reçu !</h2>
          <p>Bonjour ${reservation.provider.nom},</p>
          <p>Vous avez reçu un paiement pour votre prestation :</p>
          <ul>
            <li><strong>Service :</strong> ${reservation.service}</li>
            <li><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString()}</li>
            <li><strong>Montant reçu :</strong> ${providerAmount}€</li>
            <li><strong>Commission Velya :</strong> ${commission}€</li>
          </ul>
          <p>L'argent a été transféré directement sur votre compte Stripe.</p>
          <p>Merci de votre service !</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de paiement envoyé à ${reservation.provider.email}`);
    }

    console.log(`✅ Notification de paiement créée pour le prestataire ${reservation.provider._id}`);
  } catch (error) {
    console.error('❌ Erreur notification paiement:', error);
  }
};

module.exports = { notifyProviderPayment };