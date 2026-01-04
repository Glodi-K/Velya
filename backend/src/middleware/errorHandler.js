// Global error handler middleware
// À placer APRÈS tous les autres middlewares et routes

const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  // Enregistrer l'erreur
  console.error('❌ Erreur:', {
    message: err.message,
    code: err.code,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Capturer avec Sentry si disponible
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      contexts: {
        http: {
          url: req.originalUrl,
          method: req.method,
          status_code: err.status || 500,
        },
      },
    });
  }

  // Déterminer le code de statut
  const statusCode = err.status || err.statusCode || 500;
  
  // Réponse d'erreur sécurisée
  const isProduction = process.env.NODE_ENV === 'production';
  const response = {
    error: {
      message: isProduction ? 'Une erreur est survenue' : err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { details: err.stack }),
    },
  };

  // Ne pas exposer les détails en production
  if (statusCode === 500 && isProduction) {
    response.error.message = 'Une erreur serveur s\'est produite. Contactez le support.';
  }

  res.status(statusCode).json(response);
};

// Middleware pour les routes non trouvées
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Middleware pour valider les erreurs Joi
const validationErrorHandler = (err, req, res, next) => {
  if (err.isJoi) {
    const statusCode = err.status === 400 ? 400 : 422;
    const response = {
      error: {
        message: 'Erreur de validation',
        code: 'VALIDATION_ERROR',
        details: err.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          type: d.type,
        })),
      },
    };
    return res.status(statusCode).json(response);
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
};
