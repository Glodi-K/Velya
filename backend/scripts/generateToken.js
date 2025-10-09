const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");


dotenv.config();


// Assure-toi d'utiliser la clé secrète depuis ton .env
const SECRET_KEY = process.env.JWT_SECRET || "monSuperSecret123"; 

// Remplace cet ID par un ID réel de prestataire récupéré depuis ta base de données
const providerId = "67b958f8d5db2ce7b456368b"; 

// Génération du Token
const token = jwt.sign({ id: "1234567890" }, process.env.JWT_SECRET, { expiresIn: "7d" });

console.log("✅ Token généré :", token);

