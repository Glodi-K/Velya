// services/reportService.js
const Reservation = require('../models/Reservation');

const generateReport = async () => {
  const totalReservations = await Reservation.countDocuments();
  const totalRevenue = await Reservation.aggregate([
    { $group: { _id: null, total: { $sum: "$prixFinal" } } }
  ]);

  return {
    totalReservations,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
};

module.exports = { generateReport };

