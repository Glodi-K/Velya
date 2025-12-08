const nodemailer = require("nodemailer");
const Mailgun = require('mailgun.js');
const FormData = require('form-data');
const getProviderName = require('../utils/getProviderName');

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
    const html = `<h2>Code de vérification 2FA</h2>
        <p>Votre code est : <strong>${code}</strong></p>
        <p>Il expire dans 10 minutes.</p>`;
    return await sendMail(userEmail, "Votre code de vérification", html);
};

// Fonctions existantes
const sendReservationConfirmation = async (userEmail, reservation) => {
    const html = `<h2>Merci pour votre réservation</h2>
        <p>Date : ${reservation.date}</p>
        <p>Service : ${reservation.service}</p>
        <p>Votre réservation est en attente de confirmation.</p>`;
    return await sendMail(userEmail, "Confirmation de votre réservation", html);
};

const sendReminderEmail = async (userEmail, reservation) => {
    const html = `<h2>Rappel de votre réservation</h2>
        <p>Date : ${reservation.date}</p>
        <p>Service : ${reservation.service}</p>
        <p>Assurez-vous d'être disponible à l'heure convenue.</p>`;
    return await sendMail(userEmail, "Rappel : Votre service de ménage approche", html);
};

const sendCancellationEmail = async (userEmail, reservation) => {
    const html = `<h2>Votre réservation a été annulée</h2>
        <p>Date : ${reservation.date}</p>
        <p>Service : ${reservation.service}</p>
        <p>Nous sommes désolés de cette annulation.</p>`;
    return await sendMail(userEmail, "Annulation de votre réservation", html);
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
const sendReservationCancellation = async (userEmail, reservation) => {
    const html = `<h2>Votre réservation a été annulée</h2>
        <p>Date : ${reservation.date}</p>
        <p>Service : ${reservation.service}</p>
        <p>Adresse : ${reservation.adresse}</p>
        <p>Nous sommes désolés de cette annulation.</p>`;
    return await sendMail(userEmail, "Annulation de votre réservation", html);
};

// Fonction pour les rappels de réservation
const sendReservationReminder = async (userEmail, reservation) => {
    const html = `<h2>Rappel : Votre service de ménage demain</h2>
        <p>Date : ${reservation.date}</p>
        <p>Heure : ${reservation.heure}</p>
        <p>Service : ${reservation.service}</p>
        <p>Adresse : ${reservation.adresse}</p>
        <p>Assurez-vous d'être disponible à l'heure convenue.</p>`;
    return await sendMail(userEmail, "Rappel : Votre service de ménage demain", html);
};

// Fonction pour notifier le client qu'un prestataire a accepté sa mission
const sendMissionAcceptedEmail = async (userEmail, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = `<h2>Excellente nouvelle</h2>
        <p><strong>${displayName}</strong> a accepté votre mission de ménage !</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de votre réservation :</h3>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>Surface :</strong> ${reservation.surface} m²</p>
            <p><strong>Prestataire :</strong> ${displayName}</p>
        </div>
        <p>Le prestataire va maintenant vous contacter pour organiser les détails et vous envoyer un devis.</p>
        <p>Vous pouvez suivre l'évolution de votre réservation dans votre dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mon dashboard
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>`;
    return await sendMail(userEmail, "Votre mission a été acceptée par un prestataire", html);
};

// Fonction pour notifier le client de la fin de mission
const sendMissionCompletedEmail = async (userEmail, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = `<h2>Mission terminée avec succès</h2>
        <p>Votre service de ménage a été terminé par <strong>${displayName}</strong>.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de votre mission :</h3>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>Prestataire :</strong> ${displayName}</p>
            <p><strong>Montant :</strong> ${reservation.prixTotal}€</p>
        </div>
        <p>Nous espérons que vous êtes satisfait(e) du service rendu !</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                Payer maintenant
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client"
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Laisser un avis
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Merci de faire confiance à Velya pour vos services de ménage !
        </p>`;
    return await sendMail(userEmail, "Mission terminée - Merci pour votre confiance", html);
};

// Fonction pour envoyer un rappel de paiement au client
const sendPaymentReminder = async (userEmail, reservation) => {
        const html = `<h2>Rappel : Paiement en attente</h2>
                <p>Bonjour,</p>
                <p>Nous vous rappelons que le paiement pour votre réservation du <strong>${reservation.date}</strong> (service : ${reservation.service}) est en attente.</p>
                <p>Montant : <strong>${reservation.prixTotal ?? '—'}€</strong></p>
                <p>Veuillez compléter le paiement depuis votre espace client afin que le prestataire puisse recevoir sa rémunération.</p>
                <div style="margin-top:20px">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/reservations/${reservation._id}" style="background-color:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Voir la réservation</a>
                </div>
                <p style="color:#6b7280;margin-top:12px">Si vous avez déjà payé, ignorez ce message.</p>`;
        return await sendMail(userEmail, "Rappel : paiement en attente", html);
};

// Fonction pour envoyer un rappel de paiement au client (depuis le prestataire)
const sendPaymentReminderEmail = async (userEmail, reservation, providerName) => {
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = `<h2>Rappel de paiement</h2>
        <p>Bonjour,</p>
        <p>Votre prestataire <strong>${displayName}</strong> vous rappelle que le paiement pour votre mission terminée est en attente.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Détails de la mission :</h3>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>Montant :</strong> ${reservation.prixTotal}€</p>
        </div>
        <p>Veuillez procéder au paiement depuis votre espace client afin que le prestataire puisse recevoir sa rémunération.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Payer maintenant
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Si vous avez déjà effectué le paiement, veuillez ignorer ce message.
        </p>`;
    return await sendMail(userEmail, "Rappel de paiement - Mission terminée", html);
};

// Fonction pour notifier le prestataire quand il accepte une mission
const sendProviderMissionAcceptedEmail = async (providerEmail, providerName, reservation) => {
    const clientName = reservation.client?.name || 'Client';
    const displayName = getProviderName(typeof providerName === 'object' ? providerName : { name: providerName });
    const html = `<h2>✅ Mission acceptée avec succès</h2>
        <p>Félicitations <strong>${displayName}</strong> !</p>
        <p>Vous avez accepté une nouvelle mission. Voici les détails :</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de la mission :</h3>
            <p><strong>Client :</strong> ${clientName}</p>
            <p><strong>Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${reservation.heure}</p>
            <p><strong>Service :</strong> ${reservation.service || reservation.categorie}</p>
            <p><strong>Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>Surface :</strong> ${reservation.surface} m²</p>
            <p><strong>Prix estimé :</strong> ${reservation.prixTotal}€</p>
        </div>
        <p><strong>Prochaines étapes :</strong></p>
        <ul style="color: #374151;">
            <li>Préparez votre devis détaillé</li>
            <li>Contactez le client pour confirmer les détails</li>
            <li>Validez la date et l'heure avec le client</li>
            <li>Accédez à votre dashboard pour envoyer l'estimation</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accéder à mon Dashboard
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Cette mission est maintenant dans votre liste "Commandes acceptées".
        </p>`;
    return await sendMail(providerEmail, "Nouvelle mission acceptée ✅", html);
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
    sendProviderMissionAcceptedEmail,
    sendMissionCompletedEmail,
    sendPaymentReminder,
    sendPaymentReminderEmail,
};