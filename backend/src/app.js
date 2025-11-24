// backend/src/app.js
require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// CORS: reflect the request origin and allow credentials (required when frontend uses withCredentials)
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    // In development we accept any origin; for production replace this with a whitelist check.
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Ensure preflight requests are handled by the cors middleware as well
app.options('*', cors({ origin: true, credentials: true }));

// Add Vary: Origin header so caches handle responses per-origin
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

// Webhook Stripe - DOIT être avant les autres middlewares de parsing
app.use('/api/stripe/webhook', express.raw({type: 'application/json'}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const passport = require("passport");
require("./config/passportGoogle");

// Sentry désactivé temporairement

// Middlewares
const helmet = require("helmet");
const morgan = require("morgan");
const { mobileMiddleware, mobileErrorHandler } = require('./middleware/mobileMiddleware');

// Middleware mobile (avant les routes)
app.use(mobileMiddleware);



// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));





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
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/final-reservations", finalReservationRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/availability", availabilityRoutes);
// Webhook Stripe avec raw body
const stripeWebhook = require('./routes/stripeWebhook');
app.post('/api/stripe/webhook', stripeWebhook);

app.use("/api/stripe", stripeRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/test", testRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/reservations", paymentRoutes);
app.use("/api/alerts", require('./routes/alertRoutes'));

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

// Middleware de gestion d'erreurs mobile (avant le global)
app.use(mobileErrorHandler);

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Ne pas exposer les détails de l'erreur en production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur interne',
    ...(isDev && { stack: err.stack })
  });
});

// Gestion des rejets de promesses non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Gestion des exceptions non capturées
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Sentry désactivé

module.exports = app;