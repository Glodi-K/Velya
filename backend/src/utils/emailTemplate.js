/**
 * Templates d'email professionnels pour Velya
 * Avec logo et mise en forme cohérente
 */

const getEmailTemplate = (title, subtitle, content, ctaButton = null, userType = 'user') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background-color: #f5f5f5; 
          line-height: 1.6;
          color: #333;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .logo { 
          max-width: 200px; 
          margin-bottom: 15px; 
          font-size: 48px; 
          font-weight: bold;
        }
        .header h1 { 
          margin: 15px 0 8px 0; 
          font-size: 28px; 
          font-weight: 700;
        }
        .header p { 
          margin: 0; 
          opacity: 0.95; 
          font-size: 15px; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .greeting { 
          font-size: 16px; 
          margin-bottom: 20px; 
          line-height: 1.8;
        }
        .greeting strong { 
          color: #667eea; 
        }
        .section { 
          margin: 25px 0; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: 600; 
          color: #667eea; 
          margin-bottom: 15px; 
          border-bottom: 2px solid #f0f0f0; 
          padding-bottom: 10px;
        }
        .detail-box { 
          background-color: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 15px 0;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 12px 0; 
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child { 
          border-bottom: none; 
        }
        .detail-label { 
          font-weight: 600; 
          color: #333; 
          flex: 0 0 45%;
        }
        .detail-value { 
          color: #666; 
          text-align: right; 
          flex: 0 0 55%;
        }
        .info-box { 
          background-color: #e7f3ff; 
          border-left: 4px solid #667eea; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .info-box p { 
          margin: 0; 
          color: #004085; 
          font-size: 14px;
        }
        .warning-box { 
          background-color: #fef3cd; 
          border-left: 4px solid #ffc107; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .warning-box p { 
          margin: 0; 
          color: #856404; 
          font-size: 14px;
        }
        .success-box { 
          background-color: #d4edda; 
          border-left: 4px solid #28a745; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .success-box p { 
          margin: 0; 
          color: #155724; 
          font-size: 14px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600; 
          margin: 25px 0; 
          text-align: center;
          transition: transform 0.2s;
        }
        .button:hover { 
          transform: translateY(-2px); 
        }
        .footer { 
          background-color: #f8f9fa; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e9ecef; 
          font-size: 12px; 
          color: #666;
        }
        .footer p { 
          margin: 5px 0; 
        }
        .footer-brand { 
          font-weight: 600; 
          color: #333; 
          font-size: 14px; 
          margin-bottom: 5px;
        }
        .footer-links { 
          margin-top: 10px; 
        }
        .footer-links a { 
          color: #667eea; 
          text-decoration: none; 
          margin: 0 8px;
        }
        .highlight { 
          color: #667eea; 
          font-weight: 600;
        }
        .text-muted { 
          color: #999; 
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <text x="20" y="60" font-size="48" font-weight="bold" fill="white">Velya</text>
          </svg>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        
        <div class="content">
          ${content}
          ${ctaButton ? `
            <div style="text-align: center;">
              <a href="${ctaButton.url}" class="button">${ctaButton.text}</a>
            </div>
          ` : ''}
          
          <div class="info-box">
            <p><strong>Besoin d'aide ?</strong> Contactez notre support à <a href="mailto:support@velya.com" style="color: #004085; text-decoration: none;">support@velya.com</a></p>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-brand">Velya - Plateforme de services de ménage</p>
          <p>© 2024 Velya. Tous droits réservés.</p>
          <div class="footer-links">
            <a href="https://velya.com/conditions">Conditions d'utilisation</a>
            <a href="https://velya.com/privacy">Confidentialité</a>
            <a href="https://velya.com/contact">Contact</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const get2FAEmailContent = (code) => {
  const content = `
    <div class="greeting">
      <p>Bonjour,</p>
      <p>Voici votre code de vérification à deux facteurs. Ce code expire dans <strong>10 minutes</strong>.</p>
    </div>
    
    <div class="detail-box" style="text-align: center;">
      <div style="font-size: 32px; font-weight: bold; color: #667eea; font-family: monospace; letter-spacing: 2px; margin: 20px 0;">
        ${code}
      </div>
      <p class="text-muted">Ne partagez ce code avec personne. Velya ne vous le demandra jamais.</p>
    </div>
    
    <div class="warning-box">
      <p><strong>Sécurité:</strong> Si vous n'avez pas demandé ce code, ignorez ce message.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Code de vérification',
    'Votre authentification à deux facteurs',
    content
  );
};

const getReservationConfirmationContent = (userName, reservation) => {
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Merci pour votre confiance ! Votre demande de réservation a été enregistrée avec succès. Un prestataire va examiner votre demande et vous contactera sous peu.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Détails de votre demande</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heure:</span>
          <span class="detail-value">${reservation.heure || 'À convenir'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Localisation:</span>
          <span class="detail-value">${reservation.adresse || 'Non spécifiée'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Surface:</span>
          <span class="detail-value">${reservation.surface || 'Non spécifiée'} m²</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Estimation:</span>
          <span class="detail-value"><strong>${reservation.prixTotal ? reservation.prixTotal + '€' : 'À définir'}</strong></span>
        </div>
      </div>
    </div>
    
    <div class="info-box">
      <p><strong>Prochaines étapes:</strong> Un prestataire va examiner votre demande et vous envoyer une estimation. Vous pourrez alors accepter ou refuser son devis.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Réservation confirmée',
    'Votre demande a été enregistrée',
    content,
    {
      text: '👁️ Voir ma réservation',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
    }
  );
};

const getMissionAcceptedContent = (clientName, reservation, providerName) => {
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p><strong>${providerName}</strong> a accepté votre mission</p>
    </div>
    
    <div class="success-box">
      <p><strong>Excellente nouvelle !</strong> Votre mission a été assignée à un prestataire professionnel qui va se mettre en contact avec vous sous peu.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Détails de votre mission</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Prestataire:</span>
          <span class="detail-value"><strong>${providerName || 'Non défini'}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie || 'Non défini'}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date prévue:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heure:</span>
          <span class="detail-value">${reservation.heure || 'À convenir'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Localisation:</span>
          <span class="detail-value">${reservation.adresse || 'Non définie'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Surface:</span>
          <span class="detail-value">${reservation.surface || 'Non définie'} m²</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Prix estimé:</span>
          <span class="detail-value"><strong>${reservation.prixTotal ? reservation.prixTotal + '€' : 'À définir'}</strong></span>
        </div>
      </div>
    </div>
    
    <div class="info-box">
      <p><strong>À savoir:</strong> Le prestataire va vous contacter pour confirmer les détails finals. Assurez-vous que votre numéro de téléphone est à jour dans votre profil.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Mission acceptée',
    'Un prestataire a accepté votre demande',
    content,
    {
      text: 'Voir les détails',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
    }
  );
};

const getPaymentReminderContent = (clientName, reservation) => {
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p>Votre prestation a été complétée avec succès ! Il ne vous reste plus qu'à effectuer le paiement pour finaliser la transaction.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Paiement en attente</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date du service:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant à payer:</span>
          <span class="detail-value"><strong style="color: #667eea; font-size: 18px;">${reservation.prixTotal}€</strong></span>
        </div>
      </div>
    </div>
    
    <div class="warning-box">
      <p><strong>Rappel important:</strong> Veuillez effectuer le paiement dans les meilleurs délais pour éviter une suspension de votre compte.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Paiement en attente',
    'Finalisez votre réservation',
    content,
    {
      text: 'Effectuer le paiement',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
    }
  );
};

const getReminderEmailContent = (clientName, reservation) => {
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p>C'est un petit rappel ! Votre service de nettoyage est prévu <strong>demain</strong>. Assurez-vous que tout est en ordre pour accueillir le prestataire.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Rappel de votre service</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heure:</span>
          <span class="detail-value"><strong>${reservation.heure}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Localisation:</span>
          <span class="detail-value">${reservation.adresse}</span>
        </div>
      </div>
    </div>
    
    <div class="info-box">
      <p><strong>Conseils utiles:</strong> Préparez l'accès à votre domicile et assurez-vous que le prestataire peut accéder facilement à tous les espaces à nettoyer.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Rappel - Demain',
    'Votre service de nettoyage approche',
    content,
    {
      text: 'Voir les détails',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
    }
  );
};

module.exports = {
  getEmailTemplate,
  get2FAEmailContent,
  getReservationConfirmationContent,
  getMissionAcceptedContent,
  getPaymentReminderContent,
  getReminderEmailContent,
  getMissionCompletedContent: (clientName, reservation, providerName) => {
    const content = `
      <div class="greeting">
        <p>Bonjour <strong>${clientName}</strong>,</p>
        <p>Votre service de nettoyage a été complété avec succès ! Merci pour votre confiance en <strong>${providerName}</strong>.</p>
      </div>
      
      <div class="success-box">
        <p><strong>Mission terminée !</strong> Le prestataire a finalisé le travail. Il ne reste plus qu'à effectuer le paiement.</p>
      </div>
      
      <div class="section">
        <div class="section-title">Détails de votre mission</div>
        <div class="detail-box">
          <div class="detail-row">
            <span class="detail-label">Prestataire:</span>
            <span class="detail-value"><strong>${providerName}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${reservation.service || reservation.categorie}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date du service:</span>
            <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Montant à payer:</span>
            <span class="detail-value"><strong style="color: #28a745; font-size: 18px;">${reservation.prixTotal}€</strong></span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Évaluez le service</div>
        <p>Nous aimerions connaître votre avis sur ce service afin de continuer à maintenir une qualité d'excellence !</p>
      </div>
      
      <div class="info-box">
        <p><strong>À savoir:</strong> Pensez à laisser un avis sur le prestataire pour aider la communauté Velya et obtenir des crédits de fidélité !</p>
      </div>
    `;
    
    return getEmailTemplate(
      'Mission terminée',
      'Votre service a été complété avec succès',
      content,
      {
        text: 'Effectuer le paiement',
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
      }
    );
  },
  getPaymentReminderEmailContent: (clientName, reservation) => {
    const content = `
      <div class="greeting">
        <p>Bonjour <strong>${clientName}</strong>,</p>
        <p>Nous vous rappelons que le paiement pour votre service de nettoyage est en attente depuis quelques jours. Veuillez compléter cette transaction afin que le prestataire puisse recevoir sa rémunération.</p>
      </div>
      
      <div class="section">
        <div class="section-title">Paiement en attente</div>
        <div class="detail-box">
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date du service:</span>
            <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Montant à payer:</span>
            <span class="detail-value"><strong style="color: #667eea; font-size: 18px;">${reservation.prixTotal}€</strong></span>
          </div>
        </div>
      </div>
      
      <div class="warning-box">
        <p><strong>Rappel important:</strong> Veuillez effectuer le paiement dans les meilleurs délais. Si le paiement n'est pas effectué, cela pourrait affecter votre compte Velya.</p>
      </div>
      
      <div class="info-box">
        <p><strong>Besoin d'aide ?</strong> Si vous avez des problèmes de paiement, contactez-nous directement.</p>
      </div>
    `;
    
    return getEmailTemplate(
      'Paiement en attente',
      'Veuillez finaliser votre paiement',
      content,
      {
        text: 'Effectuer le paiement maintenant',
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
      }
    );
  }
};

// Export individual functions for cancellations
const getCancellationEmailContent = (clientName, reservation, reason, notes) => {
  const reasonDisplay = reason ? reason.charAt(0).toUpperCase() + reason.slice(1) : 'Non spécifié';
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p>Votre demande d'annulation a été confirmée avec succès.</p>
    </div>
    
    <div class="success-box">
      <p><strong>Annulation confirmée !</strong> Voici tous les détails de votre annulation.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Détails de la mission annulée</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date prévue:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${reservation.heure ? `<div class="detail-row">
          <span class="detail-label">Heure:</span>
          <span class="detail-value">${reservation.heure}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Localisation:</span>
          <span class="detail-value">${reservation.adresse}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Surface:</span>
          <span class="detail-value">${reservation.surface || 'Non définie'} m²</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant:</span>
          <span class="detail-value"><strong>${reservation.prixTotal}€</strong></span>
        </div>
      </div>
    </div>
    
    <div class="warning-box">
      <p><strong>Motif de l'annulation:</strong> ${reasonDisplay}</p>
      ${notes ? `<p style="margin-top: 10px;"><strong>Détails supplémentaires:</strong><br/>${notes}</p>` : ''}
    </div>
    
    <div class="info-box">
      <p><strong>Remboursement:</strong> Si vous aviez effectué un paiement, il sera remboursé selon nos conditions de remboursement standard. Le traitement peut prendre 5 à 7 jours ouvrables.</p>
    </div>
    
    <div class="info-box">
      <p><strong>À savoir:</strong> Vous pouvez programmer une nouvelle mission quand vous le souhaitez. Notre équipe de prestataires est toujours disponible pour vous aider.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Annulation confirmée',
    'Votre demande a été traitée',
    content,
    {
      text: 'Retour au dashboard',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-client`
    }
  );
};

const getProviderCancellationEmailContent = (providerName, reservation, clientName, reason, notes) => {
  const reasonDisplay = reason ? reason.charAt(0).toUpperCase() + reason.slice(1) : 'Non spécifié';
  const content = `
    <div class="greeting">
      <p>Bonjour <strong>${providerName}</strong>,</p>
      <p><strong>${clientName}</strong> a annulé une mission qui vous était assignée.</p>
    </div>
    
    <div class="warning-box">
      <p><strong>Notification d'annulation</strong> - Une mission pour laquelle vous aviez été accepté a été annulée par le client.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Détails de la mission annulée</div>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Client:</span>
          <span class="detail-value"><strong>${clientName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value"><strong>${reservation.service || reservation.categorie}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date prévue:</span>
          <span class="detail-value">${new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${reservation.heure ? `<div class="detail-row">
          <span class="detail-label">Heure:</span>
          <span class="detail-value">${reservation.heure}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Localisation:</span>
          <span class="detail-value">${reservation.adresse}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant:</span>
          <span class="detail-value"><strong>${reservation.prixTotal}€</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Motif:</span>
          <span class="detail-value">${reasonDisplay}</span>
        </div>
      </div>
    </div>
    
    ${notes ? `<div class="info-box">
      <p><strong>Détails fournis par le client:</strong><br/>${notes}</p>
    </div>` : ''}
    
    <div class="info-box">
      <p><strong>À savoir:</strong> Continuez à accepter d'autres missions. De nouvelles opportunités de travail vous seront proposées régulièrement.</p>
    </div>
  `;
  
  return getEmailTemplate(
    'Mission annulée',
    'Notification d\'annulation de mission',
    content,
    {
      text: 'Voir mes missions',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard-prestataire`
    }
  );
};

// Update module exports
module.exports.getCancellationEmailContent = getCancellationEmailContent;
module.exports.getProviderCancellationEmailContent = getProviderCancellationEmailContent;
