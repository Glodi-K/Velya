const nodemailer = require("nodemailer");
const Mailgun = require('mailgun.js');
const FormData = require('form-data');
const getProviderName = require('../utils/getProviderName');
const {
  get2FAEmailContent,
  getReservationConfirmationContent,
  getMissionAcceptedContent,
  getPaymentReminderContent,
  getReminderEmailContent,
  getCancellationEmailContent,
  getProviderCancellationEmailContent
} = require('../utils/emailTemplate');

// Détermine quel service utiliser
const USE_MAILGUN = process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN;
const USE_GMAIL = process.env.EMAIL_USER && process.env.EMAIL_PASS;

console.log(`Service d'email configuré:`);
console.log(`   Mailgun: ${USE_MAILGUN ? 'Activé' : 'Désactivé'}`);
console.log(`   Gmail (fallback): ${USE_GMAIL ? 'Activé' : 'Désactivé'}`);

// ===== MAILGUN =====
let mgClient = null;
if (USE_MAILGUN) {
  const mailgun = new Mailgun(FormData);
  mgClient = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });
}

// ===== GMAIL FALLBACK =====
let gmailTransporter = null;
if (USE_GMAIL) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Envoie un email via Mailgun avec fallback Gmail
 */
const sendMail = async (to, subject, html) => {
  const mailgunDomain = process.env.MAILGUN_DOMAIN || '';
  const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL || '';
  const gmailFromEmail = process.env.EMAIL_USER || '';

  try {
    console.log('Tentative d\'envoi d\'email...');
    console.log(`   À: ${to}`);
    console.log(`   Sujet: ${subject}`);

    // 1️⃣ Essayer Mailgun d'abord
    if (USE_MAILGUN && mgClient && mailgunDomain && mailgunFromEmail) {
      try {
        const messageData = {
          from: `Velya <${mailgunFromEmail}>`,
          to,
          subject,
          html,
          'o:tracking': 'yes',
          'o:tracking-opens': 'yes',
        };

        const result = await mgClient.messages.create(mailgunDomain, messageData);
        console.log('Email envoyé via Mailgun');
        console.log(`   Message ID: ${result.id}`);
        return true;
      } catch (mailgunError) {
        console.warn('Erreur Mailgun:', mailgunError.message);
        // Continuer au fallback Gmail
      }
    }

    // 2️⃣ Fallback sur Gmail
    if (USE_GMAIL && gmailTransporter && gmailFromEmail) {
      const result = await gmailTransporter.sendMail({
        from: `Velya <${gmailFromEmail}>`,
        to,
        subject,
        html,
      });

      console.log('Email envoyé via Gmail (fallback)');
      console.log(`   Message ID: ${result.messageId}`);
      return true;
    }

    // 3️⃣ Aucun service disponible
    console.error('Aucun service email configuré');
    return false;
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:');
    console.error(`   ${error.message}`);
    return false;
  }
};

// Fonction pour l'envoi du code 2FA
const send2FACodeEmail = async (userEmail, code) => {
    const html = get2FAEmailContent(code);
    return await sendMail(userEmail, "🔐 Code de vérification Velya", html);
};

// Fonctions existantes
const sendReservationConfirmation = async (userEmail, userName, reservation) => {
    const html = getReservationConfirmationContent(userName, reservation);
    return await sendMail(userEmail, "Réservation confirmée", html);
};

const sendReminderEmail = async (userEmail, userName, reservation) => {
    const html = getReminderEmailContent(userName, reservation);
    return await sendMail(userEmail, "Rappel - Votre service approche", html);
};

const sendCancellationEmail = async (userEmail, clientName, reservation, reason, notes) => {
    const html = getCancellationEmailContent(clientName, reservation, reason, notes);
    return await sendMail(userEmail, "Annulation confirmée - Velya", html);
};

const sendClientNotification = async (userEmail, reservation) => {
    const html = `<h2>Merci pour votre réservation</h2>
        <p>Date : ${reservation.date}</p>
        <p>Service : ${reservation.service}</p>
        <p>Prestataire : ${reservation.providerName}</p>
        <p>Adresse : ${reservation.location}</p>`;
    return await sendMail(userEmail, "Votre réservation a été confirmée", html);
};

const sendProviderNotification = async (providerEmail, reservation) => {
    console.log('Envoi email prestataire à:', providerEmail);
    console.log('Données réservation:', {
        date: reservation.date,
        heure: reservation.heure,
        service: reservation.service,
        adresse: reservation.adresse,
        surface: reservation.surface
    });
    
    const html = `<h2>Nouvelle mission disponible</h2>
        <p>Une nouvelle mission de ménage est disponible dans votre secteur.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de la mission :</h3>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>Surface :</strong> ${reservation.surface} m²</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accepter la mission
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Connectez-vous à votre dashboard pour voir tous les détails et accepter cette mission.
        </p>`;
    
    const result = await sendMail(providerEmail, "Nouvelle mission de ménage disponible", html);
    console.log('Résultat envoi email prestataire:', result);
    return result;
};

// Fonction pour l'annulation de réservation
const sendReservationCancellation = async (userEmail, clientName, reservation, reason, notes) => {
    const html = getCancellationEmailContent(clientName, reservation, reason, notes);
    return await sendMail(userEmail, "Annulation confirmée - Velya", html);
};

// Fonction pour les rappels de réservation
const sendReservationReminder = async (userEmail, userName, reservation) => {
    const html = getReminderEmailContent(userName, reservation);
    return await sendMail(userEmail, "Rappel - Votre service approche", html);
};

// Fonction pour notifier le client qu'un prestataire a accepté sa mission
const sendMissionAcceptedEmail = async (userEmail, clientName, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = getMissionAcceptedContent(clientName, reservation, displayName);
    return await sendMail(userEmail, "Mission acceptée - " + displayName, html);
};

// Fonction pour notifier le client de la fin de mission
const sendMissionCompletedEmail = async (userEmail, clientName, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = getMissionCompletedContent(clientName, reservation, displayName);
    return await sendMail(userEmail, "Mission terminée", html);
};

// Fonction pour notifier le prestataire d'une annulation
const sendProviderCancellationNotification = async (providerEmail, providerName, reservation, clientName, reason, notes) => {
    const html = getProviderCancellationEmailContent(providerName, reservation, clientName, reason, notes);
    return await sendMail(providerEmail, "Notification - Mission annulée", html);
};

// Fonction pour envoyer un rappel de paiement au client
const sendPaymentReminder = async (userEmail, clientName, reservation) => {
    const html = getPaymentReminderEmailContent(clientName, reservation);
    return await sendMail(userEmail, "Rappel - Paiement en attente", html);
};

// Fonction pour envoyer un rappel de paiement au client (depuis le prestataire)
const sendPaymentReminderEmail = async (userEmail, clientName, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = getPaymentReminderContent(clientName, reservation);
    return await sendMail(userEmail, "Rappel de paiement - " + displayName, html);
};

// Fonction pour notifier le prestataire quand il accepte une mission
const sendProviderMissionAcceptedEmail = async (providerEmail, providerName, reservation) => {
    const clientName = reservation.client?.name || 'Client';
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Mission Acceptée !</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Félicitations ${displayName} !</p>
            </div>
            <div style="padding: 40px; color: #1f2937;">
                <p style="font-size: 16px; color: #6b7280; margin: 0 0 20px 0;">Vous avez accepté une nouvelle mission. Voici tous les détails :</p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Détails de la mission</h3>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Client :</span>
                        <span style="color: #1f2937; font-weight: 600;">${clientName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Date :</span>
                        <span style="color: #1f2937;">${new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Heure :</span>
                        <span style="color: #1f2937;">${reservation.heure}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Service :</span>
                        <span style="color: #1f2937;">${reservation.service || reservation.categorie}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Adresse :</span>
                        <span style="color: #1f2937;">${reservation.adresse}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
                        <span style="color: #6b7280; font-weight: 500;">Surface :</span>
                        <span style="color: #1f2937;">${reservation.surface} m²</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span style="color: #6b7280; font-weight: 500;">Prix estimé :</span>
                        <span style="color: #059669; font-weight: 700; font-size: 18px;">${reservation.prixTotal}€</span>
                    </div>
                </div>

                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px; font-weight: 600;">Prochaines étapes</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #166534;">
                        <li style="margin: 8px 0;">Préparez votre devis détaillé</li>
                        <li style="margin: 8px 0;">Contactez le client pour confirmer les détails</li>
                        <li style="margin: 8px 0;">Validez la date et l'heure avec le client</li>
                        <li style="margin: 8px 0;">Accédez à votre dashboard pour envoyer l'estimation</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                        Accéder au Dashboard
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                    Cette mission est maintenant dans votre liste "<strong>Commandes acceptées</strong>".
                </p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © 2024 Velya - Plateforme de services | <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" style="color: #667eea; text-decoration: none;">velya.fr</a>
                </p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                    Besoin d'aide ? <a href="mailto:support@velya.fr" style="color: #667eea; text-decoration: none;">Contactez-nous</a>
                </p>
            </div>
        </div>
    </body>
    </html>`;
    return await sendMail(providerEmail, "Mission acceptée avec succès !", html);
};

// Exports
module.exports = {
    sendMail,
    send2FACodeEmail,
    sendReservationConfirmation,
    sendReminderEmail,
    sendCancellationEmail,
    sendClientNotification,
    sendProviderNotification,
    sendReservationCancellation,
    sendReservationReminder,
    sendMissionAcceptedEmail,
    sendProviderMissionAcceptedEmail,
    sendMissionCompletedEmail,
    sendPaymentReminder,
    sendPaymentReminderEmail,
    sendProviderCancellationNotification,
};