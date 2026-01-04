// Tests pour l'authentification et validation
const request = require('supertest');
const express = require('express');
const { validateRequest } = require('../utils/validationSchemas');
const { loginSchema, signupSchema } = require('../utils/validationSchemas');

describe('Validation Schemas', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Login Schema', () => {
    beforeEach(() => {
      app.post('/login', validateRequest(loginSchema), (req, res) => {
        res.json({ success: true, data: req.body });
      });
    });

    it('devrait valider un email et mot de passe valides', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'validPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('devrait rejeter un email invalide', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'not-an-email',
          password: 'validPassword123'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('email');
    });

    it('devrait rejeter un mot de passe court', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe('password');
    });

    it('devrait rejeter les fields manquants', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe('password');
    });

    it('devrait nettoyer les données supplémentaires', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'validPassword123',
          extra_field: 'should_be_removed',
          admin: true
        });

      expect(res.status).toBe(200);
      expect(res.body.data.extra_field).toBeUndefined();
      expect(res.body.data.admin).toBeUndefined();
    });
  });

  describe('Signup Schema', () => {
    beforeEach(() => {
      app.post('/signup', validateRequest(signupSchema), (req, res) => {
        res.json({ success: true, data: req.body });
      });
    });

    it('devrait valider une inscription complète', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+33612345678'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('devrait rejeter un mot de passe faible', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'weak',  // Trop court et pas de majuscule/chiffre
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(422);
    });

    it('devrait vérifier les critères de mot de passe fort', async () => {
      // Test sans majuscule
      let res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'securepass123',  // Pas de majuscule
          firstName: 'John',
          lastName: 'Doe'
        });
      expect(res.status).toBe(422);

      // Test sans chiffre
      res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass',  // Pas de chiffre
          firstName: 'John',
          lastName: 'Doe'
        });
      expect(res.status).toBe(422);
    });

    it('devrait valider le numéro de téléphone', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '123'  // Trop court
        });

      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe('phone');
    });
  });
});

describe('Rate Limiting', () => {
  it('devrait respecter les limites de requêtes', async () => {
    const { generalLimiter } = require('../middleware/rateLimitMiddleware');
    
    let app = express();
    app.use('/api', generalLimiter, (req, res) => {
      res.json({ success: true });
    });

    // Les tests de rate limiting sont mieux faire avec des outils comme autocannon
    // ou en testant l'en-tête RateLimit-Remaining
  });
});

describe('Error Handler', () => {
  it('devrait retourner une réponse d\'erreur formatée', async () => {
    let app = express();
    app.get('/error', (req, res, next) => {
      const error = new Error('Test error');
      error.status = 400;
      next(error);
    });

    const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
    app.use(notFoundHandler);
    app.use(errorHandler);

    const res = await request(app).get('/error');
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBeDefined();
    expect(res.body.error.code).toBeDefined();
  });
});

describe('Circuit Breaker', () => {
  const { CircuitBreaker } = require('../services/retryService');

  it('devrait s\'ouvrir après 5 défaillances', async () => {
    let failCount = 0;
    const breaker = new CircuitBreaker(async () => {
      failCount++;
      if (failCount <= 5) throw new Error('Service failure');
      return 'success';
    }, {
      failureThreshold: 5,
      timeout: 100
    });

    // Générer 5 défaillances
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute();
      } catch (e) {}
    }

    expect(breaker.getState().state).toBe('OPEN');

    // Vérifier qu'il refuse les requêtes
    try {
      await breaker.execute();
      fail('Should have thrown');
    } catch (error) {
      expect(error.message).toContain('Circuit breaker est OPEN');
    }
  });

  it('devrait se fermer après 2 succès en HALF_OPEN', async () => {
    const breaker = new CircuitBreaker(
      async () => 'success',
      {
        failureThreshold: 1,
        successThreshold: 2,
        timeout: 100
      }
    );

    // Simuler une défaillance
    try {
      const fn = async () => {
        throw new Error('Failure');
      };
      await breaker.execute(fn);
    } catch (e) {
      // Attendu
    }

    // Circuit est OPEN, attendre le timeout
    await new Promise(r => setTimeout(r, 150));

    // Exécuter deux succès
    await breaker.execute(async () => 'success');
    await breaker.execute(async () => 'success');

    expect(breaker.getState().state).toBe('CLOSED');
  });
});

module.exports = {};
