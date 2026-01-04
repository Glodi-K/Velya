// CSRF Protection Middleware
const csrf = require('express-csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Configuration de CSRF avec stockage en tokens doubles
const csrfProtection = csrf({
  cookie: false, // Utiliser la session au lieu des cookies
});

// Middleware pour stocker le token CSRF dans la réponse
const csrfTokenMiddleware = (req, res, next) => {
  // Générer et envoyer le token CSRF au client
  const token = req.csrfToken ? req.csrfToken() : null;
  if (token) {
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Accessible au JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only en production
      sameSite: 'strict',
      maxAge: 3600000, // 1 heure
    });
    // Envoyer aussi dans la réponse pour les clients qui en auraient besoin
    res.set('X-CSRF-Token', token);
  }
  next();
};

// Middleware optionnel pour les endpoints qui ne nécessitent pas CSRF
const csrfIgnore = (req, res, next) => {
  // Les GET requests n'ont jamais besoin de CSRF (CSRF c'est pour les mutations)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Routes à ignorer pour CSRF (webhooks, health checks, etc.)
  const ignoredPaths = [
    '/api/health',
    '/api/stripe/webhook',
    '/api/stripe/create-checkout-session',
    '/api/stripe/create-payment-intent',
    '/api/stripe/create-account-link',
    '/api/external',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/register-prestataire',
    '/api/auth/signup-step1',
    '/api/auth/signup-step2',
    '/api/auth/resend-signup-code',
    '/api/auth/logout',
    '/api/auth/profile',
    '/api/notifications',
    '/api/profile-photos',
    '/api/reservations', // Désactiver CSRF pour les réservations (utiliser JWT à la place)
    '/api/users/admin', // Routes admin (utiliser JWT à la place)
    '/api/admin', // Routes admin login/logout (utiliser JWT à la place)
  ];
  

  if (ignoredPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  csrfProtection(req, res, next);
};

// Répondre avec le token CSRF (GET /api/csrf-token)
const csrfTokenEndpoint = (req, res) => {
  const token = req.csrfToken ? req.csrfToken() : null;
  if (!token) {
    return res.status(500).json({
      error: { message: 'Impossible de générer un token CSRF' }
    });
  }

  res.json({
    csrfToken: token,
    expiresIn: 3600, // 1 heure
  });
};

module.exports = {
  csrfProtection,
  csrfTokenMiddleware,
  csrfIgnore,
  csrfTokenEndpoint,
};
