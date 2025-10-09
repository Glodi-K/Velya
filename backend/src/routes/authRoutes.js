const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prestataire = require("../models/PrestataireSimple");

// Route d'inscription utilisateur
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address, role = 'client' } = req.body;
  try {
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
    while (existe) {
      codeUnique = shortid.generate();
      const codeCheck = await User.findOne({ referralCode: codeUnique });
      if (!codeCheck) existe = false;
    }

    // Créer l'utilisateur avec le rôle spécifié
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: role, // Utiliser le rôle envoyé par le frontend
      referralCode: codeUnique, // Ajouter le code de parrainage unique
    });

    await newUser.save();

    // Générer un token JWT comme pour le login
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "✅ Utilisateur inscrit avec succès !",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      token
    });
  } catch (error) {
    console.error("🔥 Erreur serveur:", error);
    res.status(500).json({ message: "❌ Erreur serveur", error });
  }
});

// Route d'inscription prestataire
router.post("/register-prestataire", async (req, res) => {
  console.log("📝 Données reçues:", req.body);
  const { name, email, password, phone, address, location } = req.body;
  
  if (!name || !email || !password || !phone || !address) {
    return res.status(400).json({ message: "❌ Tous les champs sont requis" });
  }
  
  try {
    // Vérifier si l'email existe déjà
    const existingPrestataire = await Prestataire.findOne({ email });
    if (existingPrestataire) {
      return res.status(400).json({ message: "❌ Email déjà utilisé" });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le prestataire
    const newPrestataire = new Prestataire({
      nom: name,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    console.log("💾 Tentative de sauvegarde prestataire...");
    await newPrestataire.save();
    console.log("✅ Prestataire sauvegardé avec succès");

    // Générer un token JWT
    const token = jwt.sign(
      { id: newPrestataire._id, role: 'prestataire' },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "✅ Prestataire inscrit avec succès !",
      user: { id: newPrestataire._id, name: newPrestataire.nom, email: newPrestataire.email, role: 'prestataire' },
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
  const { email, password } = req.body;

  try {
    // Vérifier d'abord dans Prestataire
    const prestataire = await Prestataire.findOne({ email });
    if (prestataire && (await bcrypt.compare(password, prestataire.password))) {
      console.log('[LOGIN PRESTATAIRE] id utilisé pour le token :', prestataire._id);
      console.log('[LOGIN PRESTATAIRE] rôle utilisé pour le token :', 'prestataire');
      const token = jwt.sign(
        { id: prestataire._id, role: 'prestataire' },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      console.log('[LOGIN PRESTATAIRE] token généré :', token);
      return res.json({
        token,
        user: { id: prestataire._id, name: prestataire.name, email: prestataire.email, role: 'prestataire' },
        redirectTo: '/dashboard-prestataire'
      });
    }

    // Sinon vérifier dans User
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        redirectTo: '/dashboard-client'
      });
    }

    res.status(401).json({ message: "Email ou mot de passe incorrect" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Routes de profil simplifiées
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    
    console.log("[profile] Rôle décodé:", decoded.role);
    if (decoded.role === 'prestataire') {
      console.log("[profile] Recherche dans Prestataire avec ID:", decoded.id);
      user = await Prestataire.findById(decoded.id).select("-password");
      console.log("[profile] Prestataire trouvé:", !!user);
    } else {
      console.log("[profile] Recherche dans User avec ID:", decoded.id);
      user = await User.findById(decoded.id).select("-password");
      console.log("[profile] User trouvé:", !!user);
    }
    
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
});

router.get("/provider-profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("[provider-profile] Token reçu (50 premiers chars):", token?.substring(0, 50));
  console.log("[provider-profile] Headers complets:", req.headers.authorization);
  
  if (!token) {
    console.log("[provider-profile] ❌ Token manquant");
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    console.log("[provider-profile] 🔓 Tentative de décodage du token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[provider-profile] ✅ Token décodé:", decoded);
    
    console.log("[provider-profile] 🔍 Recherche prestataire avec ID:", decoded.id);
    console.log("[provider-profile] 🔍 Rôle dans le token:", decoded.role);
    
    const user = await Prestataire.findById(decoded.id).select("-password");
    console.log("[provider-profile] 📋 Résultat recherche:", user ? 'TROUVÉ' : 'NON TROUVÉ');
    
    if (user) {
      console.log("[provider-profile] 👤 Prestataire:", {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role
      });
    }
    
    if (!user) {
      console.log("[provider-profile] ❌ Prestataire non trouvé pour id:", decoded.id);
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }
    
    console.log("[provider-profile] ✅ Envoi de la réponse");
    res.json(user);
  } catch (error) {
    console.log("[provider-profile] ❌ Erreur lors de la vérification du token:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0]
    });
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

module.exports = router;