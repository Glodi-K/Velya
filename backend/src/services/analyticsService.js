const Reservation = require("../models/Reservation");
const User = require("../models/User");

class AnalyticsService {
  // 📊 Tracking des événements
  static async trackEvent(eventType, userId, metadata = {}) {
    try {
      console.log(`📈 Event: ${eventType}`, { userId, ...metadata });
      // Ici on pourrait intégrer Google Analytics ou Plausible
    } catch (error) {
      console.error("❌ Erreur tracking:", error);
    }
  }

  // 📈 Métriques business
  static async getBusinessMetrics(period = "month") {
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const metrics = await Promise.all([
      Reservation.countDocuments({ createdAt: { $gte: startDate } }),
      Reservation.countDocuments({ createdAt: { $gte: startDate }, status: "terminée" }),
      Reservation.countDocuments({ createdAt: { $gte: startDate }, status: "annulée" }),
      User.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    return {
      newReservations: metrics[0],
      completedReservations: metrics[1],
      cancelledReservations: metrics[2],
      newUsers: metrics[3],
      completionRate: metrics[0] > 0 ? (metrics[1] / metrics[0] * 100).toFixed(2) : 0,
      cancellationRate: metrics[0] > 0 ? (metrics[2] / metrics[0] * 100).toFixed(2) : 0
    };
  }

  // 💰 Calcul des revenus
  static async getRevenueMetrics(period = "month") {
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const revenue = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "terminée",
          finalPrice: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalPrice" },
          avgOrderValue: { $avg: "$finalPrice" },
          count: { $sum: 1 }
        }
      }
    ]);

    return revenue[0] || { totalRevenue: 0, avgOrderValue: 0, count: 0 };
  }
}

module.exports = AnalyticsService;