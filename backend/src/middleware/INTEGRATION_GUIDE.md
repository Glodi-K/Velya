// Guide d'intégration: Comment appliquer les validations aux routes existantes
// Copier et adapter ce template pour chaque fichier de route

const express = require('express');
const router = express.Router();

// ===== IMPORTS =====
const { verifyToken } = require('../middleware/authMiddleware');
const { validateRequest, validateQuery } = require('../utils/validationSchemas');
const {
  loginSchema,
  signupSchema,
  paymentSchema,
  reservationSchema,
  updateProfileSchema,
  fileUploadSchema,
} = require('../utils/validationSchemas');

const {
  authLimiter,
  paymentLimiter,
  uploadLimiter,
} = require('../middleware/rateLimitMiddleware');

const { cacheMiddleware, invalidateCacheAfterUpdate } = require('../services/cacheService');
const { executeWithCircuitBreaker } = require('../services/retryService');

// ===== EXEMPLE 1: Route d'authentification avec validation =====
// Dans authRoutes.js:

// AVANT (non sécurisé):
/*
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // ... logique sans validation
});
*/

// APRÈS (sécurisé):
router.post(
  '/login',
  authLimiter,  // Rate limiting
  validateRequest(loginSchema),  // Validation des inputs
  async (req, res, next) => {
    try {
      const { email, password } = req.body; // Données validées
      
      // Votre logique de login ici
      
      res.json({ success: true, token: 'jwt_token' });
    } catch (error) {
      next(error); // Passer au global error handler
    }
  }
);

// ===== EXEMPLE 2: Route de paiement avec circuit breaker =====
// Dans stripeRoutes.js:

router.post(
  '/create-payment',
  verifyToken,  // Authentification
  paymentLimiter,  // Rate limiting pour les paiements
  validateRequest(paymentSchema),  // Validation
  async (req, res, next) => {
    try {
      const { amount, reservationId } = req.body;

      // Utiliser le circuit breaker pour les appels Stripe
      const result = await executeWithCircuitBreaker('stripe', async () => {
        // Votre logique Stripe
        return await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: 'cad',
        });
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ===== EXEMPLE 3: Route GET avec caching =====
// Dans providerRoutes.js:

router.get(
  '/list',
  cacheMiddleware(600),  // Cache 10 minutes
  async (req, res, next) => {
    try {
      // Cette réponse sera cachée automatiquement
      const providers = await Provider.find();
      res.json(providers);
    } catch (error) {
      next(error);
    }
  }
);

// ===== EXEMPLE 4: Route POST avec invalidation de cache =====
// Dans providerRoutes.js:

router.post(
  '/:id',
  verifyToken,
  validateRequest(updateProfileSchema),
  invalidateCacheAfterUpdate(['cache:/api/providers/*']),  // Invalider le cache
  async (req, res, next) => {
    try {
      const provider = await Provider.findByIdAndUpdate(req.params.id, req.body);
      res.json({ success: true, data: provider });
    } catch (error) {
      next(error);
    }
  }
);

// ===== EXEMPLE 5: Route avec query params validés =====
// À ajouter dans vos routes:

const paginationSchema = require('joi').object({
  page: require('joi').number().positive().optional().default(1),
  limit: require('joi').number().max(100).optional().default(10),
  sort: require('joi').string().optional(),
});

router.get(
  '/search',
  validateQuery(paginationSchema),  // Valide les query params
  cacheMiddleware(300),
  async (req, res, next) => {
    try {
      const { page, limit, sort } = req.query;

      const providers = await Provider.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .sort(sort || { createdAt: -1 });

      res.json({
        success: true,
        data: providers,
        pagination: { page, limit },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== EXEMPLE 6: Upload de fichiers sécurisé =====
// Dans profilePhotoRoutes.js:

const multer = require('multer');
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
});

router.post(
  '/upload',
  verifyToken,
  uploadLimiter,  // Rate limiting
  upload.single('photo'),
  validateRequest(fileUploadSchema),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: { message: 'Aucun fichier fourni' }
        });
      }

      // Uploader le fichier (Cloudinary, S3, etc.)
      const url = await uploadToCloudinary(req.file);

      res.json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }
);

// ===== EXEMPLE 7: Gestion des erreurs dans les middlewares existants =====
// Ne PAS faire:
/*
router.get('/data', (req, res) => {
  const data = JSON.parse(req.query.data);  // ❌ Peut crash
  res.json(data);
});
*/

// Faire plutôt:
router.get('/data', (req, res, next) => {
  try {
    const data = JSON.parse(req.query.data);
    res.json(data);
  } catch (error) {
    next(error);  // ✅ Global error handler le capture
  }
});

// ===== BEST PRACTICES =====

// ✅ TOUJOURS utiliser try-catch et next(error)
// ✅ TOUJOURS valider les inputs critiques
// ✅ TOUJOURS utiliser rate limiting sur les actions sensibles
// ✅ TOUJOURS utiliser le circuit breaker pour les services externes
// ✅ TOUJOURS utiliser le cache pour les requêtes en lecture fréquentes
// ✅ TOUJOURS invalider le cache après les modifications

// ❌ NE JAMAIS ignorer les erreurs
// ❌ NE JAMAIS exposer les détails des erreurs au client en production
// ❌ NE JAMAIS faire confiance aux inputs utilisateur
// ❌ NE JAMAIS oublier d'invalider le cache

module.exports = router;

/*
===== MIGRATION PLAN =====

Phase 1 (Cette semaine):
- [ ] Appliquer validation à /api/auth/* (login, signup)
- [ ] Appliquer rate limiting à /api/stripe/*
- [ ] Appliquer caching à /api/providers/*

Phase 2 (Prochaine semaine):
- [ ] Appliquer validation à /api/reservations/*
- [ ] Appliquer caching à /api/availability/*
- [ ] Tester tous les endpoints

Phase 3 (Avant déploiement):
- [ ] Vérifier que tous les endpoints gèrent les erreurs
- [ ] Tester les limites de rate limiting
- [ ] Vérifier que le cache fonctionne

===== TESTING =====

Pour tester une route:

const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login', () => {
  it('devrait valider les inputs', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email',
        password: 'short'
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('devrait respecter le rate limiting', async () => {
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'validPassword'
        });

      if (i < 5) {
        expect(res.status).not.toBe(429);
      } else {
        expect(res.status).toBe(429);
      }
    }
  });
});
*/
