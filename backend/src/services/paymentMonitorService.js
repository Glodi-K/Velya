const Reservation = require('../models/Reservation');
const PaymentLog = require('../models/PaymentLog');
const PrestataireSimple = require('../models/PrestataireSimple');
const { calculateCommissionInEuros } = require('../utils/commissionCalculator');

class PaymentMonitorService {
  static async autoFixPayments() {
    try {
      // Corriger les réservations terminées non payées
      const unpaidCompleted = await Reservation.find({
        status: 'terminée',
        paid: false
      });

      for (const reservation of unpaidCompleted) {
        await this.processRetroactivePayment(reservation);
      }

      return { fixed: unpaidCompleted.length };
    } catch (error) {
      console.error('Erreur auto-correction paiements:', error);
      throw error;
    }
  }

  static async processRetroactivePayment(reservation) {
    const totalAmount = reservation.prixTotal;
    const { commission: applicationFee, providerAmount } = calculateCommissionInEuros(totalAmount);
    const paymentId = `auto_fix_${Date.now()}_${reservation._id}`;

    // Mettre à jour la réservation
    await Reservation.findByIdAndUpdate(reservation._id, {
      paid: true,
      paymentId,
      paymentDate: new Date(),
      paymentDetails: {
        totalAmount,
        applicationFee,
        providerAmount,
        currency: 'eur'
      }
    });

    // Créer le log
    await new PaymentLog({
      reservation: reservation._id,
      client: reservation.client,
      provider: reservation.provider,
      paymentIntentId: paymentId,
      totalAmount,
      applicationFee,
      providerAmount,
      currency: 'eur',
      status: 'completed',
      paymentMethod: 'stripe'
    }).save();

    // Mettre à jour les gains du prestataire
    if (reservation.provider) {
      await PrestataireSimple.findByIdAndUpdate(
        reservation.provider,
        { 
          $inc: { 
            totalEarnings: providerAmount,
            pendingEarnings: providerAmount
          }
        }
      );
    }

    // 💰 Créditer la commission de l'admin
    try {
      const Admin = require('../models/Admin');
      const adminUser = await Admin.findOne({ role: 'super-admin' });
      
      if (adminUser) {
        await Admin.findByIdAndUpdate(
          adminUser._id,
          { 
            $inc: { 
              totalCommissions: applicationFee,
              pendingCommissions: applicationFee
            }
          }
        );
        console.log(`✅ Commission admin créditée (paiement rétroactif): ${applicationFee}€`);
      }
    } catch (adminError) {
      console.error('❌ Erreur lors de l\'ajout de la commission admin (rétroactif):', adminError);
    }

    console.log(`✅ Paiement auto-corrigé: ${reservation._id} - ${providerAmount}€`);
  }

  static async checkPaymentHealth() {
    const issues = [];

    // Réservations terminées non payées
    const unpaidCompleted = await Reservation.countDocuments({
      status: 'terminée',
      paid: false
    });

    if (unpaidCompleted > 0) {
      issues.push({ type: 'unpaid_completed', count: unpaidCompleted });
    }

    // Réservations avec paymentId mais non payées
    const inconsistent = await Reservation.countDocuments({
      paymentId: { $exists: true, $ne: null },
      paid: false
    });

    if (inconsistent > 0) {
      issues.push({ type: 'inconsistent_payment', count: inconsistent });
    }

    return issues;
  }
}

module.exports = PaymentMonitorService;