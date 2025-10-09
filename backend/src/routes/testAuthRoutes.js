// routes/testAuthRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

/**
 * @route GET /api/test-auth
 * @desc Route de test pour vérifier l'authentification
 * @access Public
 */
router.get('/public', (req, res) => {
  res.status(200).json({ message: "Route publique accessible" });
});

/**
 * @route GET /api/test-auth/protected
 * @desc Route de test pour vérifier l'authentification
 * @access Private
 */
router.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({ 
    message: "Route protégée accessible", 
    user: req.user 
  });
});

/**
 * @route POST /api/test-auth/login
 * @desc Route de test pour simuler une connexion
 * @access Public
 */
router.post('/login', (req, res) => {
  const { JWT_SECRET } = require('../config/jwt');
  const jwt = require('jsonwebtoken');
  
  // Générer un token de test
  const token = jwt.sign(
    { 
      id: '60d0fe4f5311236168a109ca', 
      role: 'user',
      name: 'Utilisateur Test'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.status(200).json({ 
    message: "Connexion réussie (test)",
    token,
    user: {
      id: '60d0fe4f5311236168a109ca',
      role: 'user',
      name: 'Utilisateur Test'
    }
  });
});

module.exports = router;