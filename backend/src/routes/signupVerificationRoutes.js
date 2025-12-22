const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Prestataire = require('../models/Prestataire');
const { generateVerificationCode, sendSignupVerificationCode } = require('../services/emailVerificationService');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configuration multer pour les photos de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/profile-photos'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images uniquement : JPEG, PNG, GIF'));
    }
  },
});

/**
 * POST /api/auth/signup-step1
 * Étape 1 : Envoi du code de vérification
 */
router.post('/signup-step1', async (req, res) => {
  try {
    const { email, name, password, role, prestataireData } = req.body;

    console.log('📝 signup-step1 reçu:');
    console.log('   - email:', email);
    console.log('   - name:', name);
    console.log('   - role:', role);
    console.log('   - prestataireData:', prestataireData);

    // Validation basique
    if (!email || !name || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier que l'email n'existe pas déjà (ni dans User ni dans Prestataire)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingPrestataire = await Prestataire.findOne({ email: email.toLowerCase() });
    if (existingUser || existingPrestataire) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Générer le code de vérification
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Stocker temporairement les données en session/cache
    // Pour une vraie app, utiliser Redis. Ici on stocke dans un objet en mémoire temporaire.
    if (!global.signupPendingData) {
      global.signupPendingData = {};
    }

    global.signupPendingData[email.toLowerCase()] = {
      email: email.toLowerCase(),
      name,
      password,
      role,
      prestataireData: prestataireData || null,
      verificationCode,
      codeExpires,
      createdAt: Date.now(),
    };

    // Nettoyer les données expirées après 30 minutes
    setTimeout(() => {
      delete global.signupPendingData[email.toLowerCase()];
    }, 30 * 60 * 1000);

    // Envoyer le code
    await sendSignupVerificationCode(email, name, verificationCode);

    res.status(200).json({
      message: '✓ Code de vérification envoyé par email',
      success: true,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Erreur signup-step1:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/signup-step2
 * Étape 2 : Vérifier le code et créer le compte
 */
router.post('/signup-step2', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { email, verificationCode, prestataireData } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ message: 'Email et code requis' });
    }

    // Récupérer les données temporaires
    const pendingData = global.signupPendingData?.[email.toLowerCase()];

    if (!pendingData) {
      return res.status(400).json({ message: 'Session d\'inscription expirée. Recommencez.' });
    }

    // Vérifier l'expiration
    if (new Date() > pendingData.codeExpires) {
      delete global.signupPendingData[email.toLowerCase()];
      return res.status(400).json({ message: 'Code expiré. Veuillez recommencer.' });
    }

    // Vérifier le code
    if (verificationCode !== pendingData.verificationCode) {
      return res.status(400).json({ message: 'Code de vérification incorrect' });
    }

    console.log('📋 signup-step2 - pendingData.role:', pendingData.role);
    console.log('📋 signup-step2 - prestataireData (body):', prestataireData);
    console.log('📋 signup-step2 - pendingData.prestataireData:', pendingData.prestataireData);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(pendingData.password, 10);

    // Essayer de récupérer les données depuis pendingData ou du body
    const prestataireDatFromBackend = pendingData.prestataireData;
    const prestataireDataFromBody = prestataireData ? JSON.parse(prestataireData) : null;
    const finalPrestataireData = prestataireDataFromBody || prestataireDatFromBackend;

    let newAccount;

    if (pendingData.role === 'provider' && finalPrestataireData) {
      // 🟢 Créer un compte PRESTATAIRE
      console.log('🟢 Création d\'un compte Prestataire...');
      
      const prestatairePayload = {
        typePrestataire: finalPrestataireData.typePrestataire, // 'independant' ou 'entreprise'
        email: pendingData.email,
        password: hashedPassword,
        phone: finalPrestataireData.phone,
        address: finalPrestataireData.address,
        profilePhoto: req.file ? `/uploads/profile-photos/${req.file.filename}` : null,
      };

      if (finalPrestataireData.typePrestataire === 'independant') {
        prestatairePayload.nom = finalPrestataireData.nom;
        prestatairePayload.prenom = finalPrestataireData.prenom;
      } else if (finalPrestataireData.typePrestataire === 'entreprise') {
        prestatairePayload.raisonSociale = finalPrestataireData.raisonSociale;
        prestatairePayload.siret = finalPrestataireData.siret;
        prestatairePayload.representantLegal = {
          nom: finalPrestataireData.representantNom,
          prenom: finalPrestataireData.representantPrenom,
        };
      }

      newAccount = new Prestataire(prestatairePayload);
      await newAccount.save();
      console.log('✅ Prestataire créé:', newAccount._id);
    } else {
      // 🔵 Créer un compte CLIENT
      console.log('🔵 Création d\'un compte Client...');
      
      newAccount = new User({
        name: pendingData.name,
        email: pendingData.email,
        password: hashedPassword,
        role: pendingData.role || 'client',
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
        profilePhoto: req.file ? `/uploads/profile-photos/${req.file.filename}` : null,
      });

      await newAccount.save();
      console.log('✅ Client créé:', newAccount._id);
    }

    // Générer le JWT
    const token = jwt.sign(
      { userId: newAccount._id, role: newAccount.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    // Nettoyer les données temporaires
    delete global.signupPendingData[email.toLowerCase()];

    res.status(201).json({
      message: '✓ Compte créé avec succès !',
      success: true,
      token,
      user: {
        id: newAccount._id,
        name: newAccount.name || `${newAccount.prenom} ${newAccount.nom}` || newAccount.raisonSociale,
        email: newAccount.email,
        role: newAccount.role,
        typePrestataire: newAccount.typePrestataire,
        profilePhoto: newAccount.profilePhoto,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Erreur signup-step2:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/resend-signup-code
 * Renvoyer le code de vérification
 */
router.post('/resend-signup-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    // Initialiser si nécessaire
    if (!global.signupPendingData) {
      global.signupPendingData = {};
    }

    const pendingData = global.signupPendingData[email.toLowerCase()];

    if (!pendingData) {
      console.log('Données en attente non trouvées pour:', email.toLowerCase());
      console.log('Clés disponibles:', Object.keys(global.signupPendingData || {}));
      return res.status(400).json({ message: 'Aucune inscription en attente pour cet email' });
    }

    // Vérifier qu'on attend pas trop longtemps
    if (new Date() > pendingData.codeExpires) {
      delete global.signupPendingData[email.toLowerCase()];
      return res.status(400).json({ message: 'Session expirée. Veuillez recommencer.' });
    }

    // Générer un nouveau code
    const newCode = generateVerificationCode();
    pendingData.verificationCode = newCode;
    pendingData.codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Envoyer le code
    await sendSignupVerificationCode(email, pendingData.name, newCode);

    console.log('✅ Code renvoyé pour:', email);
    res.status(200).json({
      message: '✓ Nouveau code envoyé par email',
      success: true,
    });
  } catch (error) {
    console.error('Erreur resend-signup-code:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
});

module.exports = router;
