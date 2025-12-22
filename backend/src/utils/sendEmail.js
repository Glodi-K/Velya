const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ ou autre : 'smtp' personnalisé
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Velya" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: "Vous avez un nouveau message de Velya.",
      html,
    });

    console.log(`✅ Email envoyé à ${to} avec succès`);
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email :", err);
  }
};

module.exports = sendEmail;
