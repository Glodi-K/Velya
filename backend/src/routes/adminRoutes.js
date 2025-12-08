const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require("../config/jwt");
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");
const Admin = require("../models/Admin");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const Prestataire = require("../models/Prestataire");
const AbuseReport = require("../models/AbuseReport");
const PaymentLog = require("../models/PaymentLog");

// 🔐 Connexion admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    
    // Mise à jour dernière connexion
    admin.lastLogin = new Date();
    await admin.save();
    
    const token = generateToken({
      id: admin._id, 
      role: 'admin', 
      permissions: admin.permissions
    });
    
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error("❌ Erreur connexion admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 👤 Profil admin
router.get("/profile", verifyToken, isAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✏️ Mise à jour profil admin
router.put("/profile", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);
    
    if (newPassword) {
      const isValidPassword = await admin.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }
      admin.password = newPassword;
    }
    
    if (name) admin.name = name;
    if (email) admin.email = email;
    
    await admin.save();
    
    res.json({ message: "Profil mis à jour", admin: { name: admin.name, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📊 Dashboard Analytics - Indicateurs clés
router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Statistiques générales
    const totalReservations = await Reservation.countDocuments();
    const totalUsers = await User.countDocuments({ role: "client" });
    const totalProviders = await Prestataire.countDocuments();
    const activeProviders = await Prestataire.countDocuments({ isApproved: true });
    const pendingProviders = await Prestataire.countDocuments({ isApproved: false });

    // Réservations ce mois
    const monthlyReservations = await Reservation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Revenus et commissions
    const totalRevenue = await PaymentLog.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const monthlyRevenue = await PaymentLog.aggregate([
      { 
        $match: { 
          status: "completed",
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Commissions de la plateforme (20%)
    const totalCommissions = totalRevenue[0]?.total * 0.2 || 0;
    const monthlyCommissions = monthlyRevenue[0]?.total * 0.2 || 0;

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
      { $lookup: { from: "prestataires", localField: "_id", foreignField: "_id", as: "provider" } },
      { $unwind: "$provider" },
      { $project: { name: "$provider.name", count: 1 } }
    ]);

    // Rapports d'abus récents
    const recentReports = await AbuseReport.countDocuments({
      createdAt: { $gte: startOfWeek },
      status: "pending"
    });

    res.json({
      overview: {
        totalReservations,
        totalUsers,
        totalProviders,
        activeProviders,
        pendingProviders,
        monthlyReservations,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalCommissions,
        monthlyCommissions,
        cancellationRate: parseFloat(cancellationRate),
        recentReports
      },
      statusDistribution,
      topProviders
    });
  } catch (error) {
    console.error("❌ Erreur dashboard:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🏢 Gestion des prestataires
router.get("/providers", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let filter = { isDeleted: { $ne: true } }; // Exclure les prestataires supprimés
    
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;
    if (status === 'suspended') filter.isSuspended = true;
    
    const providers = await Prestataire.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Prestataire.countDocuments(filter);

    res.json({
      providers,
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

// ✅ Approuver/Rejeter prestataire
router.patch("/providers/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { approved, reason } = req.body;
    
    const provider = await Prestataire.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: approved,
        approvalDate: approved ? new Date() : null,
        rejectionReason: approved ? null : reason
      },
      { new: true }
    );

    res.json({ 
      message: approved ? "Prestataire approuvé" : "Prestataire rejeté", 
      provider 
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🚫 Suspendre/Réactiver prestataire
router.patch("/providers/:id/suspend", verifyToken, isAdmin, async (req, res) => {
  try {
    const { suspended, reason } = req.body;
    
    const provider = await Prestataire.findByIdAndUpdate(
      req.params.id,
      { 
        isSuspended: suspended,
        suspensionReason: suspended ? reason : null,
        suspensionDate: suspended ? new Date() : null
      },
      { new: true }
    );

    res.json({ 
      message: suspended ? "Prestataire suspendu" : "Prestataire réactivé", 
      provider 
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Gestion des rapports d'abus
router.get("/reports", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const reports = await AbuseReport.find({ status })
      .populate('reporter', 'name email')
      .populate('reported', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AbuseReport.countDocuments({ status });

    res.json({
      reports,
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

// ⚖️ Traiter rapport d'abus
router.patch("/reports/:id/resolve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { action, adminNotes } = req.body;
    
    const report = await AbuseReport.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'resolved',
        adminAction: action,
        adminNotes,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      },
      { new: true }
    );

    // Actions automatiques selon la décision
    if (action === 'suspend_user') {
      await User.findByIdAndUpdate(report.reported, { isSuspended: true });
    } else if (action === 'suspend_provider') {
      await Prestataire.findByIdAndUpdate(report.reported, { isSuspended: true });
    }

    res.json({ message: "Rapport traité", report });
  } catch (error) {
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
    const revenueTrend = await PaymentLog.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: "completed"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" }
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

// 🗑️ Supprimer (marquer comme supprimé) un prestataire
router.delete("/providers/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const provider = await Prestataire.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: req.user.id
      },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    res.json({ 
      message: "Prestataire supprimé avec succès", 
      provider 
    });
  } catch (error) {
    console.error("❌ Erreur suppression prestataire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 💰 Rapports financiers
router.get("/financial-reports", verifyToken, isAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const payments = await PaymentLog.find({ 
      createdAt: { $gte: startDate },
      status: 'completed' 
    })
      .populate('reservation', 'client provider service')
      .sort({ createdAt: -1 });

    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalCommissions = totalRevenue * 0.2;

    res.json({
      payments,
      summary: {
        totalRevenue,
        totalCommissions,
        paymentCount: payments.length,
        isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false
      }
    });
  } catch (error) {
    console.error('❌ Erreur rapports financiers:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;