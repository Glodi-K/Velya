const Prestataire = require("../models/PrestataireSimple");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Removed multer and file upload related code as per user request

const registerPrestataire = async (req, res) => {
  try {
    let { nom, nomEntreprise, email, password, phone, address, service, location, availability, available /*, identityFilePath */ } = req.body;

    console.log("RegisterPrestataire payload:", { nom, nomEntreprise, email, phone, address, service, location, availability, available });

    if (!nom || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "Veuillez remplir les champs obligatoires" });
    }

    const existingPrestataire = await Prestataire.findOne({ email });
    if (existingPrestataire) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default availability and available if not provided
    if (!available) {
      available = true;
    }
    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      availability = [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)]; // today and tomorrow
    }

    if (!service) {
      console.warn("Warning: 'service' field is missing or empty");
    }
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      console.warn("Warning: 'location' field is missing or invalid");
    }

    const newPrestataire = new Prestataire({
      nom,
      nomEntreprise,
      email,
      password: hashedPassword,
      phone,
      address,
      service,
      location,
      availability,
      available,
      // identityFilePath: null, // Removed file upload, set to null
    });

    await newPrestataire.save();

    const token = jwt.sign(
      { id: newPrestataire._id, role: "prestataire", name: newPrestataire.nom },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Prestataire créé avec succès", token });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const loginPrestataire = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login prestataire attempt for email:", email);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const prestataire = await Prestataire.findOne({ email });
    console.log("Prestataire found:", prestataire ? true : false);

    if (!prestataire) {
      console.log("Prestataire not found");
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, prestataire.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // If you want to implement 2FA for prestataires, add here

    const token = jwt.sign(
      { id: prestataire._id, role: "prestataire", name: prestataire.nom },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      prestataire: {
        id: prestataire._id,
        nom: prestataire.nom,
        email: prestataire.email,
        role: "prestataire",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion prestataire :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getRandomAvailablePrestataires = async (req, res) => {
  try {
    const { service, lat, lng } = req.query;

    if (!service || !lat || !lng) {
      return res.status(400).json({ message: "Paramètres service, lat et lng requis" });
    }

    // Find available prestataires matching service and near location (within 50km radius)
    const availablePrestataires = await Prestataire.find({
      available: true,
      service: service,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 50000, // 50 km radius
        },
      },
    });

    if (!availablePrestataires || availablePrestataires.length === 0) {
      return res.status(404).json({ message: "Aucun prestataire disponible trouvé" });
    }

    // Shuffle and take up to 5 random prestataires
    const shuffled = availablePrestataires.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    res.status(200).json({ message: "Prestataires disponibles aléatoires", prestataires: selected });
  } catch (error) {
    console.error("Erreur serveur getRandomAvailablePrestataires:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  registerPrestataire,
  loginPrestataire,
  getRandomAvailablePrestataires,
};
