const Reservation = require('../models/Reservation');
const User = require('../models/User');
const { generateReport } = require('../services/reportService');

// 📊 Statistiques générales admin
exports.getStats = async (req, res) => {
  try {
    const totalReservations = await Reservation.countDocuments();
    const totalUsers = await User.countDocuments();

    const completedReservations = await Reservation.find({ status: 'completed' });
    const cancelledReservations = await Reservation.find({ status: 'cancelled' });

    const totalRevenue = completedReservations.reduce(
      (acc, res) => acc + (res.amountPaid || 0), 0
    );

    const cancellationRate =
      totalReservations === 0
        ? 0
        : (cancelledReservations.length / totalReservations) * 100;

    res.status(200).json({
      totalReservations,
      totalUsers,
      totalRevenue,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
    });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des stats admin :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📈 Revenu mensuel pour graphique
exports.getRevenue = async (req, res) => {
  try {
    const completedReservations = await Reservation.find({ status: 'completed' });

    const revenueByMonth = {};

    completedReservations.forEach(reservation => {
      const date = new Date(reservation.createdAt);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (reservation.amountPaid || 0);
    });

    const sortedData = Object.entries(revenueByMonth)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, revenue]) => ({ month, revenue }));

    res.json(sortedData);

  } catch (err) {
    console.error("❌ Erreur lors du calcul des revenus :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🧹 Top 5 des prestataires les plus actifs
exports.getTopProviders = async (req, res) => {
  try {
    const pipeline = [
      { $match: { status: 'completed' } },
      { $group: { _id: "$provider", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "provider"
        }
      },
      { $unwind: "$provider" },
      {
        $project: {
          _id: 0,
          name: "$provider.name",
          email: "$provider.email",
          totalReservations: "$count"
        }
      }
    ];

    const topProviders = await Reservation.aggregate(pipeline);
    res.status(200).json(topProviders);

  } catch (error) {
    console.error("❌ Erreur lors du classement des prestataires :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📄 Rapport complet admin (via reportService)
exports.getAdminReport = async (req, res) => {
  try {
    const report = await generateReport(); // Appel du service de rapport
    res.status(200).json(report); // Renvoi du rapport au frontend
  } catch (err) {
    console.error("❌ Erreur lors de la génération du rapport admin :", err);
    res.status(500).json({ message: "Erreur lors de la génération du rapport" });
  }
};
