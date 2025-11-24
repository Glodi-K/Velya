// services/paymentSecurityService.js
// 🔐 Service de sécurité des paiements - Section 6.1 du plan

const Reservation = require('../models/Reservation');
const { stripe } = require('../config/stripe');

class PaymentSecurityService {
  
  /**
   * 🔐 Valide l'exécution d'une mission avant paiement du prestataire
   */
  static async validateMissionExecution(reservationId, proofData, validatedBy) {
    try {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        throw new Error('Réservation introuvable');
      }

      // Vérifier que le client a payé
      if (!reservation.paymentSecurity.clientPaid) {
        throw new Error('Le client doit payer avant validation de la mission');
      }

      // Vérifier que la mission n'est pas déjà validée
      if (reservation.executionProof.validated) {
        throw new Error('Mission déjà validée');
      }

      // Valider selon le type de preuve
      let isValid = false;
      let proofType = '';

      if (proofData.pin && proofData.pin === reservation.validationPin) {
        isValid = true;
        proofType = 'pin';
      } else if (proofData.photos && proofData.photos.length > 0) {
        isValid = true;
        proofType = 'photos';
      } else if (proofData.clientConfirmation && validatedBy === 'client') {
        isValid = true;
        proofType = 'client_confirmation';
      }

      if (!isValid) {
        // Enregistrer tentative de contournement
        await this.logBypassAttempt(reservationId, 'validation_bypass', 
          'Tentative de validation sans preuve valide', proofData.ipAddress);
        throw new Error('Preuve d\'exécution invalide');
      }

      // Mettre à jour la validation
      reservation.executionProof = {
        validated: true,
        validatedAt: new Date(),
        validatedBy,
        proofType,
        proofData
      };

      reservation.status = 'terminée';

      // Si un PaymentIntent Stripe a été créé (autorisation), capturer le paiement maintenant
      if (reservation.paymentSecurity && reservation.paymentSecurity.stripePaymentIntentId && reservation.paymentSecurity.clientAuthorized) {
        try {
          const { stripe } = require('../config/stripe');
          const piId = reservation.paymentSecurity.stripePaymentIntentId;
          const captured = await stripe.paymentIntents.capture(piId);
          // Marquer le paiement client comme effectué
          reservation.paymentSecurity.clientPaid = true;
          reservation.paymentSecurity.clientPaymentId = captured.id;
          reservation.paymentSecurity.clientPaymentDate = new Date();
          console.log('✅ PaymentIntent capturé:', captured.id);
        } catch (capErr) {
          console.error('❌ Erreur lors de la capture PaymentIntent:', capErr);
          // Si capture échoue, ne pas continuer au paiement du prestataire
          await reservation.save();
          throw new Error('Capture du paiement client échouée');
        }
      }

      await reservation.save();

      // Déclencher le paiement du prestataire
      await this.processProviderPayment(reservationId);

      return { success: true, message: 'Mission validée et paiement déclenché' };
    } catch (error) {
      console.error('❌ Erreur validation mission:', error);
      throw error;
    }
  }

  /**
   * 💰 Traite le paiement du prestataire après validation
   */
  static async processProviderPayment(reservationId) {
    try {
      const reservation = await Reservation.findById(reservationId)
        .populate('provider');

      if (!reservation.executionProof.validated) {
        throw new Error('Mission non validée - paiement bloqué');
      }

      if (reservation.paymentSecurity.providerPaid) {
        throw new Error('Prestataire déjà payé');
      }

      // Vérifier que le prestataire a un compte Stripe
      if (!reservation.provider.stripeAccountId) {
        throw new Error('Prestataire sans compte Stripe configuré');
      }

      // Calculer les montants
      const totalAmount = reservation.prixTotal * 100; // en centimes
      const commission = Math.round(totalAmount * 0.2); // 20% commission
      const providerAmount = totalAmount - commission;

      // Effectuer le transfert vers le prestataire
      const transfer = await stripe.transfers.create({
        amount: providerAmount,
        currency: 'usd',
        destination: reservation.provider.stripeAccountId,
        metadata: {
          reservationId: reservationId.toString(),
          type: 'service_payment'
        }
      });

      // Mettre à jour la réservation
      reservation.paymentSecurity.providerPaid = true;
      reservation.paymentSecurity.providerPaymentId = transfer.id;
      reservation.paymentSecurity.providerPaymentDate = new Date();
      reservation.paymentSecurity.commission = commission;
      reservation.paymentSecurity.commissionPaid = true;

      await reservation.save();

      // Journaliser le paiement
      await this.logPayment(reservationId, 'provider_payment', {
        transferId: transfer.id,
        amount: providerAmount,
        commission,
        providerId: reservation.provider._id
      });

      return { success: true, transferId: transfer.id };
    } catch (error) {
      console.error('❌ Erreur paiement prestataire:', error);
      throw error;
    }
  }

  /**
   * 🚨 Enregistre une tentative de contournement
   */
  static async logBypassAttempt(reservationId, type, details, ipAddress) {
    try {
      await Reservation.findByIdAndUpdate(reservationId, {
        $push: {
          'fraudDetection.bypassAttempts': {
            timestamp: new Date(),
            type,
            details,
            ipAddress
          }
        },
        'fraudDetection.suspiciousActivity': true
      });

      // Si plus de 3 tentatives, bloquer
      const reservation = await Reservation.findById(reservationId);
      if (reservation.fraudDetection.bypassAttempts.length >= 3) {
        await this.blockReservation(reservationId, 'Multiples tentatives de contournement');
      }
    } catch (error) {
      console.error('❌ Erreur log bypass:', error);
    }
  }

  /**
   * 🔒 Bloque une réservation suspecte
   */
  static async blockReservation(reservationId, reason) {
    try {
      await Reservation.findByIdAndUpdate(reservationId, {
        'fraudDetection.blocked': true,
        'fraudDetection.blockedReason': reason,
        status: 'annulée'
      });

      // Notifier les admins
      console.log(`🚨 ALERTE SÉCURITÉ: Réservation ${reservationId} bloquée - ${reason}`);
    } catch (error) {
      console.error('❌ Erreur blocage réservation:', error);
    }
  }

  /**
   * 📊 Journalise un paiement
   */
  static async logPayment(reservationId, type, data) {
    try {
      const PaymentLog = require('../models/PaymentLog');
      
      await PaymentLog.create({
        reservationId,
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Erreur log paiement:', error);
    }
  }

  /**
   * 🔍 Détecte les anomalies de paiement
   */
  static async detectPaymentAnomalies(reservationId) {
    try {
      const reservation = await Reservation.findById(reservationId);
      const anomalies = [];

      // Mission validée sans preuve
      if (reservation.executionProof.validated && !reservation.executionProof.proofData) {
        anomalies.push('Mission validée sans preuve');
      }

      // Paiement prestataire sans validation client
      if (reservation.paymentSecurity.providerPaid && !reservation.executionProof.validated) {
        anomalies.push('Prestataire payé sans validation mission');
      }

      // Réservation inhabituelle (prix très élevé, durée courte, etc.)
      if (reservation.prixTotal > 500) {
        anomalies.push('Prix anormalement élevé');
      }

      if (anomalies.length > 0) {
        console.log(`⚠️ ANOMALIES DÉTECTÉES pour réservation ${reservationId}:`, anomalies);
        
        // Marquer comme suspecte
        await Reservation.findByIdAndUpdate(reservationId, {
          'fraudDetection.suspiciousActivity': true
        });
      }

      return anomalies;
    } catch (error) {
      console.error('❌ Erreur détection anomalies:', error);
      return [];
    }
  }

  /**
   * 📈 Statistiques de sécurité
   */
  static async getSecurityStats() {
    try {
      const stats = await Reservation.aggregate([
        {
          $group: {
            _id: null,
            totalReservations: { $sum: 1 },
            suspiciousReservations: {
              $sum: { $cond: ['$fraudDetection.suspiciousActivity', 1, 0] }
            },
            blockedReservations: {
              $sum: { $cond: ['$fraudDetection.blocked', 1, 0] }
            },
            validatedMissions: {
              $sum: { $cond: ['$executionProof.validated', 1, 0] }
            },
            paidProviders: {
              $sum: { $cond: ['$paymentSecurity.providerPaid', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {};
    } catch (error) {
      console.error('❌ Erreur stats sécurité:', error);
      return {};
    }
  }
}

module.exports = PaymentSecurityService;