// Rate limiting middleware pour protéger contre les brute-force et DDoS
const rateLimit = require('express-rate-limit');

// Limite générale pour toutes les requêtes API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Ne pas limiter les health checks
    return req.path === '/api/health';
  },
});

// Limite stricte pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Limite pour les paiements
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 requêtes de paiement par heure
  message: 'Limite de requêtes de paiement dépassée',
});

// Limite pour les uploads de fichiers
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 uploads par heure
  message: 'Limite d\'uploads dépassée',
});

// Limite pour les inscriptions
const signupLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 5, // 5 inscriptions par jour
  message: 'Limite d\'inscriptions dépassée',
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  signupLimiter,
};
