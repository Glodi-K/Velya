const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateVerificationToken, sendVerificationEmail } = require('../services/emailVerificationService');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /api/auth/send-verification-email
 * Envoie un email de vérification à l'utilisateur
 * @body {string} email - Email de l'utilisateur
 */
router.post('/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'email est déjà vérifié
    if (user.emailVerified) {
      return res.status(200).json({ 
        message: 'Cet email est déjà vérifié',
        alreadyVerified: true 
      });
    }

    // Générer un nouveau token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Envoyer l'email
    await sendVerificationEmail(user.email, user.name, token);

    res.status(200).json({
      message: '✓ Email de vérification envoyé',
      success: true,
    });
  } catch (error) {
    console.error('Erreur send-verification-email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/verify-email
 * Vérifie l'email avec le token fourni
 * @body {string} token - Token de vérification
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Token invalide ou expiré',
        expired: true 
      });
    }

    // Marquer l'email comme vérifié
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      message: '✓ Email vérifié avec succès',
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Erreur verify-email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Route GET pour vérifier l'email (pour les liens des emails)
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Marquer comme vérifié
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Rediriger vers le frontend avec un message de succès
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/email-verified?success=true`);
  } catch (error) {
    console.error('Erreur verify-email GET:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/email-verified?success=false&error=server_error`);
  }
});

/**
 * POST /api/auth/resend-verification-email
 * Renvoie l'email de vérification (avec limite de débit)
 */
router.post('/resend-verification-email', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        message: 'Cet email est déjà vérifié',
        alreadyVerified: true,
      });
    }

    // Vérifier si on peut renvoyer l'email (anti-spam)
    if (user.emailVerificationExpires && user.emailVerificationExpires > Date.now() - 60000) {
      // Moins d'une minute s'est écoulée
      return res.status(429).json({
        message: 'Veuillez attendre avant de renvoyer l\'email',
        retryAfter: 60,
      });
    }

    // Générer un nouveau token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Envoyer l'email
    await sendVerificationEmail(user.email, user.name, token);

    res.status(200).json({
      message: '✓ Email de vérification renvoyé',
      success: true,
    });
  } catch (error) {
    console.error('Erreur resend-verification-email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/change-email
 * Demande le changement d'email (vérifie le nouveau)
 */
router.post('/change-email', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    // Vérifier que le nouvel email n'existe pas
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Générer un token pour le changement d'email
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    // Temporairement stocker le nouvel email
    user.pendingNewEmail = newEmail.toLowerCase();
    await user.save();

    // Envoyer l'email de confirmation au nouvel email
    const { sendEmailChangeVerification } = require('../services/emailVerificationService');
    await sendEmailChangeVerification(user.email, user.name, newEmail, token);

    res.status(200).json({
      message: '✓ Email de confirmation envoyé au nouvel email',
      success: true,
    });
  } catch (error) {
    console.error('Erreur change-email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/confirm-new-email
 * Confirme le changement d'email avec le token
 */
router.post('/confirm-new-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user || !user.pendingNewEmail) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Mettre à jour l'email
    user.email = user.pendingNewEmail;
    user.pendingNewEmail = null;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      message: '✓ Email changé avec succès',
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Erreur confirm-new-email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
