// Schémas de validation Joi pour les inputs critiques
const Joi = require('joi');

// ====== AUTHENTIFICATION ======
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email invalide',
      'any.required': 'Email requis',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit avoir au minimum 6 caractères',
      'any.required': 'Mot de passe requis',
    }),
});

const signupSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre',
      'string.min': 'Le mot de passe doit avoir au minimum 8 caractères',
    }),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]{10,}$/),
});

// ====== PAIEMENTS ======
const paymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Le montant doit être positif',
    }),
  reservationId: Joi.string()
    .required(),
  paymentMethodId: Joi.string()
    .required(),
});

const refundSchema = Joi.object({
  paymentId: Joi.string()
    .required(),
  amount: Joi.number()
    .positive()
    .optional(),
  reason: Joi.string()
    .max(500)
    .optional(),
});

// ====== RÉSERVATIONS ======
const reservationSchema = Joi.object({
  providerId: Joi.string()
    .required(),
  serviceType: Joi.string()
    .required()
    .valid('cleaning', 'repair', 'maintenance', 'other'),
  startDate: Joi.date()
    .required()
    .greater('now'),
  endDate: Joi.date()
    .required()
    .greater(Joi.ref('startDate')),
  description: Joi.string()
    .max(1000)
    .required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
});

// ====== PROFIL UTILISATEUR ======
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]{10,}$/),
  bio: Joi.string().max(500),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
  }),
});

// ====== UPLOADS DE FICHIERS ======
const fileUploadSchema = Joi.object({
  filename: Joi.string()
    .required()
    .pattern(/^[\w\-. ]+$/)
    .messages({
      'string.pattern.base': 'Nom de fichier invalide',
    }),
  size: Joi.number()
    .max(10 * 1024 * 1024) // 10MB max
    .required()
    .messages({
      'number.max': 'Le fichier dépasse la limite de 10MB',
    }),
  mimetype: Joi.string()
    .valid('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
    .required(),
});

// Middleware réutilisable pour valider les requêtes
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        type: d.type,
      }));
      return res.status(422).json({
        error: {
          message: 'Erreur de validation',
          code: 'VALIDATION_ERROR',
          details,
        },
      });
    }

    // Remplacer req.body par les données validées
    req.body = value;
    next();
  };
};

// Middleware pour valider les query params
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(422).json({
        error: {
          message: 'Erreur de validation des paramètres',
          code: 'QUERY_VALIDATION_ERROR',
          details,
        },
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  loginSchema,
  signupSchema,
  paymentSchema,
  refundSchema,
  reservationSchema,
  updateProfileSchema,
  fileUploadSchema,
  validateRequest,
  validateQuery,
};
