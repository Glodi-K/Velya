// models/ActivityLog.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["login", "logout", "password_change", "profile_update", "register"],
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, { timestamps: true }); // ajoute createdAt et updatedAt automatiquement

module.exports = mongoose.model("ActivityLog", activityLogSchema);

