const nodemailer = require("nodemailer");

// Vérification des variables d'environnement
if ((!process.env.SMTP_USER || !process.env.SMTP_PASS) && process.env.NODE_ENV !== "test") {
    console.error("❌ Erreur: Variables d'environnement SMTP_USER ou SMTP_PASS non définies !");
    process.exit(1);
}

// Création du transporteur sécurisé
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    console.log("✅ Transporteur Nodemailer configuré avec succès !");
} catch (error) {
    console.error("❌ Erreur lors de la configuration du transporteur :", error);
}

// Fonction générique
const sendMail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email envoyé avec succès :", subject);
        return true;
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email :", error);
        return false;
    }
};

// ✅ Fonction pour l'envoi du code 2FA
const send2FACodeEmail = async (userEmail, code) => {
    const html = `<h2>Code de vérification 2FA</h2>
        <p>Votre code est : <strong>${code}</strong></p>
        <p>⏳ Il expire dans 10 minutes.</p>`;
    return await sendMail(userEmail, "🔐 Votre code de vérification", html);
};

// Fonctions existantes
const sendReservationConfirmation = async (userEmail, reservation) => {
    const html = `<h2>Merci pour votre réservation !</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>Votre réservation est en attente de confirmation.</p>`;
    return await sendMail(userEmail, "Confirmation de votre réservation 🏠", html);
};

const sendReminderEmail = async (userEmail, reservation) => {
    const html = `<h2>Rappel de votre réservation</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>Assurez-vous d’être disponible à l’heure convenue.</p>`;
    return await sendMail(userEmail, "⏳ Rappel : Votre service de ménage approche !", html);
};

const sendCancellationEmail = async (userEmail, reservation) => {
    const html = `<h2>Votre réservation a été annulée ❌</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>Nous sommes désolés de cette annulation.</p>`;
    return await sendMail(userEmail, "⚠️ Annulation de votre réservation", html);
};

const sendClientNotification = async (userEmail, reservation) => {
    const html = `<h2>Merci pour votre réservation</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>👨‍🔧 Prestataire : ${reservation.providerName}</p>
        <p>📍 Adresse : ${reservation.location}</p>`;
    return await sendMail(userEmail, "✅ Votre réservation a été confirmée !", html);
};

const sendProviderNotification = async (providerEmail, reservation) => {
    const html = `<h2>Nouvelle mission !</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>📍 Localisation : ${reservation.location}</p>
        <p>🧹 Service : ${reservation.service}</p>`;
    return await sendMail(providerEmail, "📌 Nouvelle mission de ménage !", html);
};

// ✅ Fonction pour l'annulation de réservation
const sendReservationCancellation = async (userEmail, reservation) => {
    const html = `<h2>Votre réservation a été annulée ❌</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>📍 Adresse : ${reservation.adresse}</p>
        <p>Nous sommes désolés de cette annulation.</p>`;
    return await sendMail(userEmail, "⚠️ Annulation de votre réservation", html);
};

// ✅ Fonction pour les rappels de réservation
const sendReservationReminder = async (userEmail, reservation) => {
    const html = `<h2>Rappel : Votre service de ménage demain</h2>
        <p>📅 Date : ${reservation.date}</p>
        <p>🕐 Heure : ${reservation.heure}</p>
        <p>🧹 Service : ${reservation.service}</p>
        <p>📍 Adresse : ${reservation.adresse}</p>
        <p>Assurez-vous d'être disponible à l'heure convenue.</p>`;
    return await sendMail(userEmail, "⏰ Rappel : Votre service de ménage demain", html);
};

// ✅ Fonction pour notifier le client qu'un prestataire a accepté sa mission
const sendMissionAcceptedEmail = async (userEmail, reservation, providerName) => {
    const html = `<h2>🎉 Excellente nouvelle !</h2>
        <p>Un prestataire a accepté votre mission de ménage !</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📋 Détails de votre réservation :</h3>
            <p><strong>📅 Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>🕐 Heure :</strong> ${reservation.heure}</p>
            <p><strong>🧹 Service :</strong> ${reservation.service}</p>
            <p><strong>📍 Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>🏠 Surface :</strong> ${reservation.surface} m²</p>
            <p><strong>👨‍🔧 Prestataire :</strong> ${providerName}</p>
        </div>
        <p>Le prestataire va maintenant vous contacter pour organiser les détails et vous envoyer un devis.</p>
        <p>Vous pouvez suivre l'évolution de votre réservation dans votre dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard-client"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                📊 Voir mon dashboard
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>`;
    return await sendMail(userEmail, "✅ Votre mission a été acceptée par un prestataire !", html);
};

// ✅ Fonction pour notifier le client de la fin de mission
const sendMissionCompletedEmail = async (userEmail, reservation, providerName) => {
    const html = `<h2>🎉 Mission terminée avec succès !</h2>
        <p>Votre service de ménage a été terminé par votre prestataire.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📋 Détails de votre mission :</h3>
            <p><strong>📅 Date :</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>🕐 Heure :</strong> ${reservation.heure}</p>
            <p><strong>🧹 Service :</strong> ${reservation.service}</p>
            <p><strong>📍 Adresse :</strong> ${reservation.adresse}</p>
            <p><strong>👨🔧 Prestataire :</strong> ${providerName}</p>
        </div>
        <p>Nous espérons que vous êtes satisfait(e) du service rendu !</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard-client"
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                ⭐ Laisser un avis
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard-client"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                📊 Voir mon dashboard
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            Merci de faire confiance à Velya pour vos services de ménage !
        </p>`;
    return await sendMail(userEmail, "✅ Mission terminée - Merci pour votre confiance !", html);
};

// ✅ Exports
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
};

