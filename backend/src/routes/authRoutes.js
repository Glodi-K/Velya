const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../config/jwt");
const User = require("../models/User");
const Prestataire = require("../models/Prestataire");
const { logout } = require("../controllers/logoutController");

// Route d'inscription utilisateur
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address, role = 'client' } = req.body;
    
    // Validation des champs requis
    if (!name || !email || !password) {
      return res.status(400).json({ message: "❌ Nom, email et mot de passe requis" });
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "❌ Format d'email invalide" });
    }
    
    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ message: "❌ Le mot de passe doit contenir au moins 6 caractères" });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ Email déjà utilisé" });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un code de parrainage unique
    const shortid = require('shortid');
    let codeUnique, existe = true;
    let attempts = 0;
    while (existe && attempts < 10) {
      codeUnique = shortid.generate();
      const codeCheck = await User.findOne({ referralCode: codeUnique });
      if (!codeCheck) existe = false;
      attempts++;
    }
    
    if (attempts >= 10) {
      return res.status(500).json({ message: "❌ Erreur génération code parrainage" });
    }

    // Créer l'utilisateur avec le rôle spécifié
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      role: role,
      referralCode: codeUnique,
    });

    await newUser.save();

    // Générer un token JWT avec durée adaptée au rôle
    const token = generateToken({
      id: newUser._id, 
      role: newUser.role,
      name: newUser.name
    });

    res.status(201).json({
      message: "✅ Utilisateur inscrit avec succès !",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      token
    });
  } catch (error) {
    console.error("🔥 Erreur serveur register:", error);
    
    // Gestion spécifique des erreurs MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ message: "❌ Email déjà utilisé" });
    }
    
    res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
  }
});

// Route d'inscription prestataire
router.post("/register-prestataire", async (req, res) => {
  console.log("📝 Données reçues:", req.body);
  const { typePrestataire, nom, prenom, raisonSociale, siret, representantLegal, email, password, phone, address } = req.body;
  
  if (!typePrestataire || !email || !password || !phone || !address) {
    return res.status(400).json({ message: "❌ Champs requis manquants" });
  }

  if (typePrestataire === 'independant' && (!nom || !prenom)) {
    return res.status(400).json({ message: "❌ Nom et prénom requis pour un indépendant" });
  }

  if (typePrestataire === 'entreprise' && (!raisonSociale || !siret)) {
    return res.status(400).json({ message: "❌ Raison sociale et SIRET requis pour une entreprise" });
  }
  
  try {
    const existingPrestataire = await Prestataire.findOne({ email });
    if (existingPrestataire) {
      return res.status(400).json({ message: "❌ Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const prestataireData = {
      typePrestataire,
      email,
      password: hashedPassword,
      phone,
      address,
    };

    if (typePrestataire === 'independant') {
      prestataireData.nom = nom;
      prestataireData.prenom = prenom;
    } else {
      prestataireData.raisonSociale = raisonSociale;
      prestataireData.siret = siret;
      prestataireData.representantLegal = representantLegal;
    }

    const newPrestataire = new Prestataire(prestataireData);

    console.log("💾 Tentative de sauvegarde prestataire...");
    await newPrestataire.save();
    console.log("✅ Prestataire sauvegardé avec succès");

    const token = generateToken({
      id: newPrestataire._id, 
      role: 'prestataire',
      name: typePrestataire === 'independant' ? `${prenom} ${nom}` : raisonSociale
    });

    res.status(201).json({
      message: "✅ Prestataire inscrit avec succès !",
      user: { 
        id: newPrestataire._id, 
        name: typePrestataire === 'independant' ? `${prenom} ${nom}` : raisonSociale, 
        email: newPrestataire.email, 
        role: 'prestataire' 
      },
      token
    });
  } catch (error) {
    console.error("🔥 Erreur détaillée:", error.message);
    console.error("🔥 Stack trace:", error.stack);
    res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
  }
});

// Route de connexion unique
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN] Tentative de connexion avec email:', email);
    
    // Validation des champs requis
    if (!email || !password) {
      console.log('[LOGIN] Email ou password manquant');
      return res.status(400).json({ message: "❌ Email et mot de passe requis" });
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "❌ Format d'email invalide" });
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier d'abord dans Prestataire
    const prestataire = await Prestataire.findOne({ email: normalizedEmail });
    if (prestataire && prestataire.password) {
      const isValidPassword = await bcrypt.compare(password, prestataire.password);
      if (isValidPassword) {
        console.log('[LOGIN PRESTATAIRE] id utilisé pour le token :', prestataire._id);
        console.log('[LOGIN PRESTATAIRE] rôle utilisé pour le token :', 'prestataire');
        
        const token = generateToken({
          id: prestataire._id, 
          role: 'prestataire',
          name: prestataire.nom || prestataire.name || 'Prestataire'
        });
        
        console.log('[LOGIN PRESTATAIRE] token généré :', !!token);
        
        return res.json({
          token,
          user: { 
            id: prestataire._id, 
            name: prestataire.nom || prestataire.name || 'Prestataire', 
            email: prestataire.email, 
            role: 'prestataire' 
          },
          redirectTo: '/dashboard-prestataire'
        });
      }
    }

    // Sinon vérifier dans User
    const user = await User.findOne({ email: normalizedEmail });
    if (user && user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (isValidPassword) {
        const token = generateToken({
          id: user._id, 
          role: user.role || 'client',
          name: user.name || 'Utilisateur'
        });
        
        return res.json({
          token,
          user: { 
            id: user._id, 
            name: user.name || 'Utilisateur', 
            email: user.email, 
            role: user.role || 'client' 
          },
          redirectTo: '/dashboard-client'
        });
      }
    }

    console.log('[LOGIN] Email ou mot de passe incorrect');
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
  } catch (err) {
    console.error('🔥 Erreur login:', err.message);
    console.error('🔥 Stack:', err.stack);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Routes de profil simplifiées
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token manquant ou format invalide" });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token invalide" });
    }
    
    let user;
    
    console.log("[profile] Rôle décodé:", decoded.role);
    
    if (decoded.role === 'prestataire') {
      console.log("[profile] Recherche dans Prestataire avec ID:", decoded.id);
      user = await Prestataire.findById(decoded.id).select("-password");
      console.log("[profile] Prestataire trouvé:", !!user);
      
      if (user) {
        try {
          // Calculer les statistiques réelles du prestataire
          const Reservation = require('../models/Reservation');
          
          // Note moyenne réelle
          const reservationsWithRating = await Reservation.find({
            provider: decoded.id,
            rating: { $exists: true, $ne: null }
          });
          
          const averageRating = reservationsWithRating.length > 0 
            ? (reservationsWithRating.reduce((sum, res) => sum + (res.rating || 0), 0) / reservationsWithRating.length).toFixed(1)
            : null;
          
          // Missions terminées
          const completedMissions = await Reservation.countDocuments({
            provider: decoded.id,
            status: { $in: ['terminée', 'completed'] }
          });
          
          // Revenus totaux
          const completedReservations = await Reservation.find({
            provider: decoded.id,
            status: { $in: ['terminée', 'completed'] },
            paid: true
          });
          
          const totalEarnings = completedReservations.reduce((sum, res) => sum + (res.partPrestataire || 0), 0);
          
          // Heures travaillées (estimation basée sur les missions)
          const totalHours = completedMissions * 3; // Estimation moyenne de 3h par mission
          
          // Ajouter les statistiques à l'objet user
          user = user.toObject();
          user.averageRating = averageRating;
          user.completedMissions = completedMissions;
          user.totalEarnings = totalEarnings;
          user.totalHours = totalHours;
        } catch (statsError) {
          console.warn('Erreur calcul statistiques prestataire:', statsError);
          // Continuer sans les stats si erreur
        }
      }
    } else {
      console.log("[profile] Recherche dans User avec ID:", decoded.id);
      user = await User.findById(decoded.id).select("-password");
      console.log("[profile] User trouvé:", !!user);
    }
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    // Ajouter le rôle à la réponse
    const userObj = user.toObject ? user.toObject() : user;
    userObj.role = decoded.role;
    
    // Convertir le chemin de photo en URL
    if (userObj.profilePhoto) {
      if (decoded.role === 'prestataire') {
        userObj.profilePhoto = `/api/profile-photos/provider/${decoded.id}/file`;
      } else {
        userObj.profilePhoto = `/api/profile-photos/client/${decoded.id}/file`;
      }
    }
    
    res.json(userObj);
  } catch (error) {
    console.error("Erreur profil:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

router.get("/provider-profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = await Prestataire.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }
    
    // Calculer les statistiques réelles du prestataire
    const Reservation = require('../models/Reservation');
    
    // Note moyenne réelle
    const reservationsWithRating = await Reservation.find({
      provider: decoded.id,
      rating: { $exists: true, $ne: null }
    });
    
    const averageRating = reservationsWithRating.length > 0 
      ? (reservationsWithRating.reduce((sum, res) => sum + res.rating, 0) / reservationsWithRating.length).toFixed(1)
      : null;
    
    // Missions terminées
    const completedMissions = await Reservation.countDocuments({
      provider: decoded.id,
      status: { $in: ['terminée', 'completed'] }
    });
    
    // Revenus totaux
    const completedReservations = await Reservation.find({
      provider: decoded.id,
      status: { $in: ['terminée', 'completed'] },
      paid: true
    });
    
    const totalEarnings = completedReservations.reduce((sum, res) => sum + (res.partPrestataire || 0), 0);
    
    // Heures travaillées
    const totalHours = completedMissions * 3;
    
    // Ajouter les statistiques à l'objet user
    user = user.toObject();
    user.averageRating = averageRating;
    user.completedMissions = completedMissions;
    user.totalEarnings = totalEarnings;
    user.totalHours = totalHours;
    
    res.json(user);
  } catch (error) {
    console.error("Erreur provider-profile:", error);
    res.status(401).json({ message: "Token invalide", error: error.message });
  }
});

// Route de mise à jour du profil
router.put("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, phone, address } = req.body;

    let user;
    if (decoded.role === 'prestataire') {
      user = await Prestataire.findByIdAndUpdate(
        decoded.id,
        { nom: name, phone, address },
        { new: true }
      ).select("-password");
    } else {
      user = await User.findByIdAndUpdate(
        decoded.id,
        { name, phone, address },
        { new: true }
      ).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route de profil LÉGER (ultra-rapide) - pour LCP initial
router.get("/profile/quick", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token manquant ou format invalide" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token invalide" });
    }
    
    // Retourner SEULEMENT ID + rôle (pas de DB queries)
    res.json({
      _id: decoded.id,
      role: decoded.role,
      name: decoded.name || 'Utilisateur'
    });
  } catch (error) {
    console.error("Erreur profil quick:", error);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

// ===== ENDPOINT VÉRIFICATION TOKEN (pour auto-cleanup au boot) =====
router.get("/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false });
    }
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true });
  } catch (error) {
    console.warn('⚠️ Token invalide:', error.message);
    res.json({ valid: false });
  }
});

// Route de déconnexion
router.post("/logout", logout);

module.exports = router;
