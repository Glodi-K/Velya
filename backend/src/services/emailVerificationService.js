const crypto = require('crypto');
const { sendMail } = require('./emailService');

/**
 * Service pour la vérification des adresses email
 */

/**
 * Génère un token de vérification unique
 * @returns {string} Token aléatoire
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Génère un code de vérification à 5 chiffres
 * @returns {string} Code numérique 5 chiffres
 */
const generateVerificationCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

/**
 * Envoie un email de vérification
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} verificationToken - Token de vérification
 * @returns {boolean} Succès de l'envoi
 */
const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vérification d'email - Velya</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 20px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
        .cta-button:hover {
          opacity: 0.9;
        }
        .alternative-link {
          font-size: 12px;
          color: #999;
          word-break: break-all;
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 12px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> Vérifiez votre email</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Bienvenue ${userName || ''} </p>
          
          <p class="message">
            Merci de vous être inscrit sur <strong>Velya</strong>. Pour sécuriser votre compte, 
            veuillez confirmer que cette adresse email vous appartient en cliquant sur le bouton ci-dessous.
          </p>
          
          <center>
            <a href="${verificationLink}" class="cta-button">
              ✓ Vérifier mon email
            </a>
          </center>
          
          <p class="message" style="margin-top: 30px;">
            Vous ne pouvez pas cliquer sur le bouton ? Copiez ce lien dans votre navigateur :
          </p>
          
          <div class="alternative-link">
            ${verificationLink}
          </div>
          
          <div class="warning">
            ⏱️ <strong>Ce lien expire dans 24 heures.</strong> Si vous n'avez pas demandé cette inscription, 
            veuillez ignorer cet email.
          </div>
          
          <p class="message" style="margin-top: 30px; font-size: 13px;">
            Pour des raisons de sécurité, nous ne partageons jamais votre email avec des tiers et 
            ne vous enverrons des emails que concernant votre compte Velya.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 Velya. Tous les droits réservés.</p>
          <p>Si vous avez des questions, contactez-nous à support@velya.ca</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await emailService.sendMail(
      userEmail,
      '✓ Vérifiez votre adresse email - Velya',
      html
    );

    if (success) {
      console.log(`📧 Email de vérification envoyé à ${userEmail}`);
    } else {
      console.warn(`⚠️ Impossible d'envoyer l'email de vérification à ${userEmail}`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email de vérification:`, error.message);
    return false;
  }
};

/**
 * Envoie un email de réinitialisation d'email
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} newEmail - Nouvel email à vérifier
 * @param {string} verificationToken - Token de vérification
 * @returns {boolean} Succès de l'envoi
 */
const sendEmailChangeVerification = async (userEmail, userName, newEmail, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-new-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation du changement d'email - Velya</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .content {
          padding: 40px 20px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 12px;
          color: #856404;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Confirmation du changement d'email</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${userName || ''} 👋</p>
          
          <p>
            Vous avez demandé le changement de votre adresse email pour :
            <strong>${newEmail}</strong>
          </p>
          
          <p>
            Pour confirmer ce changement, cliquez sur le bouton ci-dessous :
          </p>
          
          <center>
            <a href="${verificationLink}" class="cta-button">
              ✓ Confirmer le changement
            </a>
          </center>
          
          <div class="warning">
            ⚠️ <strong>Important :</strong> Ce lien expire dans 24 heures. 
            Si vous ne reconnaissez pas cette demande, veuillez ignorer cet email 
            et contacter l'équipe support immédiatement.
          </div>
        </div>
        
        <div class="footer">
          <p>© 2025 Velya. Tous les droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await emailService.sendMail(
      newEmail,
      '🔄 Confirmation du changement d\'email - Velya',
      html
    );

    return success;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi du email de changement:`, error.message);
    return false;
  }
};

/**
 * Envoie un email avec un code de vérification à 5 chiffres pour l'inscription
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} verificationCode - Code 5 chiffres
 * @returns {boolean} Succès de l'envoi
 */
const sendSignupVerificationCode = async (userEmail, userName, verificationCode) => {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de vérification - Velya</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 20px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .code-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
        }
        .code-box .label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .code-box .code {
          font-size: 48px;
          font-weight: 700;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 12px;
          color: #856404;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenue sur Velya !</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Bonjour ${userName || ''} </p>
          
          <p class="message">
            Merci de votre inscription sur <strong>Velya</strong>. 
            Entrez le code ci-dessous sur la page de vérification pour confirmer votre adresse email.
          </p>
          
          <div class="code-box">
            <div class="label">Code de vérification</div>
            <p class="code">${verificationCode}</p>
          </div>
          
          <p class="message">
            Ce code expire dans 15 minutes. Si vous n'avez pas demandé cette inscription, 
            veuillez ignorer cet email.
          </p>
          
          <div class="warning">
            🔒 <strong>Ne partagez jamais ce code.</strong> Velya ne vous demandera jamais ce code par email ou téléphone.
          </div>
          
          <p class="message" style="font-size: 13px;">
            Questions ? Contactez notre équipe support à support@velya.ca
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 Velya. Tous les droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendMail(
      userEmail,
      `✓ Votre code de vérification Velya : ${verificationCode}`,
      html
    );

    if (success) {
      console.log(`📧 Code de vérification envoyé à ${userEmail}`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi du code:`, error.message);
    return false;
  }
};

module.exports = {
  generateVerificationToken,
  generateVerificationCode,
  sendVerificationEmail,
  sendEmailChangeVerification,
  sendSignupVerificationCode,
};
