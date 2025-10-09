const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");
const Reservation = require("../models/Reservation");
const User = require("../models/User");

// 📊 Dashboard Analytics - Indicateurs clés
router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Statistiques générales
    const totalReservations = await Reservation.countDocuments();
    const totalUsers = await User.countDocuments({ role: "client" });
    const totalProviders = await User.countDocuments({ role: "prestataire" });

    // Réservations ce mois
    const monthlyReservations = await Reservation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Revenus totaux et mensuels
    const totalRevenue = await Reservation.aggregate([
      { $match: { status: "terminée", finalPrice: { $exists: true } } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const monthlyRevenue = await Reservation.aggregate([
      { 
        $match: { 
          status: "terminée", 
          finalPrice: { $exists: true },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    // Taux d'annulation
    const cancelledReservations = await Reservation.countDocuments({ status: "annulée" });
    const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations * 100).toFixed(2) : 0;

    // Répartition par statut
    const statusDistribution = await Reservation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Top prestataires
    const topProviders = await Reservation.aggregate([
      { $match: { status: "terminée" } },
      { $group: { _id: "$provider", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "provider" } },
      { $unwind: "$provider" },
      { $project: { name: "$provider.name", count: 1 } }
    ]);

    res.json({
      overview: {
        totalReservations,
        totalUsers,
        totalProviders,
        monthlyReservations,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        cancellationRate: parseFloat(cancellationRate)
      },
      statusDistribution,
      topProviders
    });
  } catch (error) {
    console.error("❌ Erreur dashboard:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📈 Analytics détaillées par période
router.get("/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const { period = "month" } = req.query;
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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Évolution des réservations
    const reservationTrend = await Reservation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Évolution des revenus
    const revenueTrend = await Reservation.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: "terminée",
          finalPrice: { $exists: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$finalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period,
      reservationTrend,
      revenueTrend
    });
  } catch (error) {
    console.error("❌ Erreur analytics:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 👥 Gestion centralisée des utilisateurs
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔧 Actions admin sur utilisateurs
router.patch("/users/:id/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: status === "active" },
      { new: true }
    ).select("-password");

    res.json({ message: "Statut utilisateur mis à jour", user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Gestion centralisée des réservations
router.get("/reservations", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    
    const reservations = await Reservation.find(filter)
      .populate("client", "name email")
      .populate("provider", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;