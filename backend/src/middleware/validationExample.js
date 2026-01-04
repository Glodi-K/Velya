// Exemples d'intégration des validations Joi dans les routes
// À appliquer dans vos fichiers de routes

const express = require('express');
const router = express.Router();
const { validateRequest } = require('../utils/validationSchemas');
const { loginSchema, signupSchema } = require('../utils/validationSchemas');

// EXEMPLE : Route de login avec validation
// Dans authRoutes.js, modifier la route login ainsi:
/*
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    // req.body est maintenant validé et nettoyé
    const { email, password } = req.body;
    
    // ... votre logique de login
    
  } catch (error) {
    next(error); // Passer au global error handler
  }
});
*/

// EXEMPLE : Route de signup avec validation
/*
router.post('/signup', validateRequest(signupSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // ... votre logique d'inscription
    
  } catch (error) {
    next(error);
  }
});
*/

module.exports = {
  // Les middlewares seront importés directement dans les routes
};
