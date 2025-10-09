const mongoose = require("mongoose");

const abuseReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["comportement", "arnaque", "non-respect", "autre"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["en attente", "en cours", "traité"],
      default: "en attente",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ou "Client"
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prestataire",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AbuseReport", abuseReportSchema);

