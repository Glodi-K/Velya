// services/mailgunService.js
// Service d'envoi d'emails avec Mailgun

const Mailgun = require('mailgun.js');
const FormData = require('form-data');

// Initialiser Mailgun
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || '';

// Vérifier que les variables sont définies
if (!process.env.MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
  console.warn('⚠️ ATTENTION: Variables Mailgun incomplètes');
  console.warn('   Assurez-vous que MAILGUN_API_KEY, MAILGUN_DOMAIN, et MAILGUN_FROM_EMAIL sont définies dans .env');
}

/**
 * Envoie un email via Mailgun
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML de l'email
 * @returns {Promise<boolean>}
 */
const sendMail = async (to, subject, html) => {
  try {
    if (!MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL || !process.env.MAILGUN_API_KEY) {
      console.error('❌ Configuration Mailgun manquante');
      return false;
    }

    const messageData = {
      from: MAILGUN_FROM_EMAIL,
      to,
      subject,
      html,
      // Options pour meilleure délivrabilité
      'o:tracking': 'yes',
      'o:tracking-opens': 'yes',
      'o:tracking-clicks': 'yes',
    };

    console.log('📧 Tentative d\'envoi d\'email via Mailgun...');
    console.log('   De:', MAILGUN_FROM_EMAIL);
    console.log('   À:', to);
    console.log('   Sujet:', subject);

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log('✅ Email envoyé avec succès via Mailgun');
    console.log('   Message ID:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email Mailgun:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    if (error.details) {
      console.error('   Détails:', error.details);
    }
    return false;
  }
};

// ✅ Fonction pour le code 2FA
const send2FACodeEmail = async (userEmail, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 24px;">🔐 Vérification en deux étapes</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Votre code de vérification est:</p>
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0; color: #667eea;">${code}</p>
        </div>
        <p style="color: #666; font-size: 14px;">⏳ Ce code expire dans <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '🔐 Votre code de vérification (10 min)', html);
};

// ✅ Fonction pour confirmation de réservation
const sendReservationConfirmation = async (userEmail, reservation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">✅ Merci pour votre réservation !</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🕐 Heure:</strong> ${reservation.heure}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">Votre réservation est en attente de confirmation d'un prestataire.</p>
        <p style="color: #999; font-size: 12px;">Vous recevrez un email dès qu'un prestataire aura accepté votre demande.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '✅ Confirmation de votre réservation', html);
};

// ✅ Fonction pour rappel de réservation
const sendReservationReminder = async (userEmail, reservation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">⏰ Rappel: Votre service de demain</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🕐 Heure:</strong> ${reservation.heure}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">Assurez-vous d'être disponible à l'heure convenue. Votre prestataire arrivera à l'heure indiquée.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '⏰ Rappel: Service demain', html);
};

// ✅ Fonction pour annulation de réservation
const sendReservationCancellation = async (userEmail, reservation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">❌ Réservation annulée</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f45c43;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">Votre réservation a été annulée. Nous sommes désolés de cette annulation.</p>
        <p style="color: #999; font-size: 12px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '⚠️ Annulation de votre réservation', html);
};

// ✅ Fonction pour mission acceptée
const sendMissionAcceptedEmail = async (userEmail, reservation, providerName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">🎉 Mission acceptée!</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Bonne nouvelle! Un prestataire a accepté votre demande.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #38ef7d; margin: 20px 0;">
          <p><strong>👨‍🔧 Prestataire:</strong> ${providerName}</p>
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🕐 Heure:</strong> ${reservation.heure}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
          <p><strong>💰 Montant:</strong> ${reservation.prixTotal}€</p>
        </div>
        <p style="color: #666;">Le prestataire va maintenant vous contacter pour organiser les détails.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '✅ Votre mission a été acceptée!', html);
};

// ✅ Fonction pour mission terminée
const sendMissionCompletedEmail = async (userEmail, reservation, providerName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">🎉 Mission terminée avec succès!</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Votre service de ménage a été terminé. Merci!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <p><strong>👨‍🔧 Prestataire:</strong> ${providerName}</p>
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
        </div>
        <p style="color: #666;">N'oubliez pas de noter votre prestataire et partager votre avis!</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '✅ Mission terminée', html);
};

// ✅ Fonction pour rappel de paiement
const sendPaymentReminderEmail = async (userEmail, reservation, providerName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">💳 Rappel: Paiement en attente</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Votre prestataire <strong>${providerName}</strong> vous rappelle que le paiement est en attente.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>💰 Montant:</strong> ${reservation.prixTotal}€</p>
        </div>
        <p style="color: #666;">Veuillez procéder au paiement afin que le prestataire puisse recevoir sa rémunération.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '💳 Rappel: Paiement en attente', html);
};

// ✅ Fonction pour notification client (prestataire a accepté)
const sendClientNotification = async (userEmail, reservation) => {
  return sendMissionAcceptedEmail(userEmail, reservation, 'Un prestataire');
};

// ✅ Fonction pour notification prestataire (nouvelle mission)
const sendProviderNotification = async (providerEmail, reservation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 8px 8px 0 0; color: #333;">
        <h2 style="margin: 0;">📌 Nouvelle mission!</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Vous avez une nouvelle mission disponible!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #fee140; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🕐 Heure:</strong> ${reservation.heure}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Localisation:</strong> ${reservation.adresse}</p>
          <p><strong>🏠 Surface:</strong> ${reservation.surface} m²</p>
          <p><strong>💰 Tarif estimé:</strong> ${reservation.prixTotal}€</p>
        </div>
        <p style="color: #666;">Consultez votre dashboard pour accepter ou décliner cette mission.</p>
      </div>
    </div>
  `;
  return await sendMail(providerEmail, '📌 Nouvelle mission disponible', html);
};

// ✅ Fonction générique pour l'annulation
const sendCancellationEmail = async (userEmail, reservation) => {
  return sendReservationCancellation(userEmail, reservation);
};

// ✅ Fonction générique pour les rappels
const sendReminderEmail = async (userEmail, reservation) => {
  return sendReservationReminder(userEmail, reservation);
};

// ✅ Fonction pour rappel de paiement simple
const sendPaymentReminder = async (userEmail, reservation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">🔔 Rappel: Paiement en attente</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Vous avez une réservation dont le paiement est en attente.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>💰 Montant:</strong> ${reservation.prixTotal}€</p>
        </div>
        <p style="color: #666;">Complétez le paiement pour confirmer votre réservation.</p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, '🔔 Rappel: Paiement en attente', html);
};

// Exports
module.exports = {
  send2FACodeEmail,
  sendReservationConfirmation,
  sendReminderEmail,
  sendCancellationEmail,
  sendClientNotification,
  sendProviderNotification,
  sendReservationCancellation,
  sendReservationReminder,
  sendMissionAcceptedEmail,
  sendMissionCompletedEmail,
  sendPaymentReminder,
  sendPaymentReminderEmail,
};
