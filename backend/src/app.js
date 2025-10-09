// backend/src/app.js
require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// CORS simple
app.use(cors());

// Gestion explicite des OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const passport = require("passport");
require("./config/passportGoogle");

// Sentry désactivé temporairement

// Middlewares
const helmet = require("helmet");
const morgan = require("morgan");



// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));





// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const reservationRoutes = require("./routes/reservationRoutes_fixed");
const finalReservationRoutes = require("./routes/finalReservationRoutes");
const providerRoutes = require("./routes/providerRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const testRoutes = require("./routes/testRoutes");
const verificationRoutes = require("./routes/verificationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/final-reservations", finalReservationRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/test", testRoutes);
app.use("/api/verification", verificationRoutes);

// Route de santé
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Backend Velya opérationnel",
    timestamp: new Date().toISOString()
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable" });
});

// Sentry désactivé

module.exports = app;