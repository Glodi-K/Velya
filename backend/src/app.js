// backend/src/app.js
require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

// ===== SENTRY - Initialiser AVANT tout le reste =====
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  console.log('✅ Sentry initialisé');
} else {
  console.warn('⚠️ SENTRY_DSN non configuré, monitoring désactivé');
}

const app = express();

// ===== TRUST PROXY (requis pour rate-limiter avec X-Forwarded-For) =====
app.set('trust proxy', 1); // Faire confiance au proxy (Nginx, Load Balancer, etc.)

// Middleware Sentry pour les erreurs
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ===== MIDDLEWARES DE SÉCURITÉ =====

// Helmet pour les headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
}));

// Compression des réponses
app.use(compression({
  threshold: 1024, // Compresser seulement les réponses > 1KB
  level: 6, // Compression level (1-9)
}));

// Morgan pour les logs
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : 'dev';
app.use(morgan(morganFormat));

// Rate limiting
const {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  signupLimiter,
} = require('./middleware/rateLimitMiddleware');

// ⚠️ En DEV: limiter agressif bloque les tests avec trop de requêtes
// COMPLÈTEMENT DÉSACTIVÉ EN DEV - utiliser NO-OP middleware
const noOpLimiter = (req, res, next) => next();
const limiterToUse = process.env.NODE_ENV === 'production' ? generalLimiter : noOpLimiter;
app.use('/api/', limiterToUse);

// ===== CACHE HEADERS MIDDLEWARE =====
const cacheHeadersMiddleware = require('./middleware/cacheHeadersMiddleware');
app.use(cacheHeadersMiddleware);

// ===== CORS - DOIT ÊTRE AVANT CSRF =====
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'X-CSRF-Token'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests AVANT CSRF
app.options('*', cors({ origin: true, credentials: true }));

// Middleware pour ignorer les preflight OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ===== CSRF PROTECTION =====
const cookieParser = require('cookie-parser');
const session = require('express-session');
const {
  csrfProtection,
  csrfTokenMiddleware,
  csrfIgnore,
  csrfTokenEndpoint,
} = require('./middleware/csrfMiddleware');

// Configuration de la session (requise pour CSRF)
app.use(cookieParser(process.env.SESSION_SECRET || 'session-secret'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only en production
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
  },
}));

// Ajouter la protection CSRF après les parsers
app.use(csrfIgnore);
app.use(csrfTokenMiddleware);

// ===== CACHE REDIS =====
// DÉSACTIVÉ: Redis n'est pas installé localement, cause des crashes à répétition
let cacheService = null;
let redisClient = null;

// Initialisation Redis commentée pour éviter les crashes
// (async () => {
//   try {
//     const cache = require('./services/cacheService');
//     redisClient = await cache.initializeRedis();
//     cacheService = cache;
//   } catch (error) {
//     console.warn('⚠️ Cache non disponible:', error.message);
//   }
// })();

// Headers personnalisés
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobile && req.url.includes('/api/')) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  next();
});

// Webhook Stripe - DOIT être avant les autres middlewares de parsing
app.use('/api/stripe/webhook', express.raw({type: 'application/json'}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport
const passport = require("passport");
require("./config/passportGoogle");

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== SURVEILLANCE DES PAIEMENTS =====
require('./cron/paymentCron');
console.log('✅ Surveillance automatique des paiements activée');

// ===== ROUTES =====
const authRoutes = require("./routes/authRoutes");
const signupVerificationRoutes = require("./routes/signupVerificationRoutes");
const userRoutes = require("./routes/userRoutes");
const reservationRoutes = require("./routes/reservationRoutes_fixed");
const finalReservationRoutes = require("./routes/finalReservationRoutes");
const providerRoutes = require("./routes/providerRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profilePhotoRoutes = require("./routes/profilePhotoRoutes");

// Appliquer rate limiting sur les routes sensibles
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", signupLimiter);
app.use("/api/stripe", paymentLimiter);
app.use("/api/payments", paymentLimiter);
app.use("/api/profile-photos", uploadLimiter);

// ===== REDIS CACHING POUR LES ENDPOINTS LENTS =====
// Cache les réponses GET pour les endpoints publics
if (cacheService) {
  // Providers - rarement modifiés, très accédés
  app.use("/api/providers/", cacheService.cacheMiddleware(600)); // 10 min cache
  
  // Disponibilités - rarement modifiées
  app.use("/api/availability/", cacheService.cacheMiddleware(300)); // 5 min cache
  
  // Utilisateurs publics - rarement modifiés
  app.use("/api/users/profile", cacheService.cacheMiddleware(600)); // 10 min cache
  
  // Ratings - données statiques
  app.use("/api/ratings/", cacheService.cacheMiddleware(1800)); // 30 min cache
  
  // Health check - ne change pas
  app.use("/api/health", cacheService.cacheMiddleware(60)); // 1 min cache
  
  console.log('✅ Redis caching activé pour endpoints critiques');
}

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/auth", signupVerificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/final-reservations", finalReservationRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/availability", availabilityRoutes);

const stripeWebhook = require('./routes/stripeWebhook');
app.post('/api/stripe/webhook', stripeWebhook);

app.use("/api/stripe", stripeRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/reservations", paymentRoutes);
app.use("/api/alerts", require('./routes/alertRoutes'));
app.use("/api/payment-fix", require('./routes/paymentFixRoutes'));
app.use("/api/profile-photos", profilePhotoRoutes);

// ===== CSRF TOKEN ENDPOINT =====
app.get("/api/csrf-token", csrfTokenEndpoint);

// ===== HEALTH CHECKS =====
const { getHealthStatus } = require('./services/healthService');
const { getCircuitBreakerStatus } = require('./services/retryService');

app.get("/api/health", async (req, res) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : (health.status === 'degraded' ? 503 : 500);
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

app.get("/api/health/breakers", (req, res) => {
  const status = getCircuitBreakerStatus();
  res.json({ circuitBreakers: status });
});

// ===== ERREURS & 404 =====
const {
  notFoundHandler,
  validationErrorHandler,
  errorHandler,
} = require('./middleware/errorHandler');

app.use(notFoundHandler);
app.use(validationErrorHandler);

// Sentry error handler (DOIT être après les autres handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(errorHandler);

// ===== GESTION DES REJETS NON GÉRÉS =====
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  process.exit(1);
});

module.exports = app;
