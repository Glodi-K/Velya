// models/Availability.js
const mongoose = require("mongoose");

const AvailabilitySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prestataire",
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    required: true,
  },
  startTime: {
    type: String, // Exemple : "09:00"
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{2}:\d{2}$/.test(v);
      },
      message: props => `${props.value} n'est pas un format d'heure valide (HH:mm).`
    }
  },
  endTime: {
    type: String, // Exemple : "17:00"
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{2}:\d{2}$/.test(v);
      },
      message: props => `${props.value} n'est pas un format d'heure valide (HH:mm).`
    }
  },
}, { timestamps: true });

module.exports = mongoose.model("Availability", AvailabilitySchema);

