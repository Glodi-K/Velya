const express = require("express");
const axios = require("axios");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();

console.log("✅ Le fichier predictionRoutes.js est bien chargé !");

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5001/predict";

async function getCoordinates(address) {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.error("❌ Clé API Google Maps non définie !");
      return null;
    }

    const formattedAddress = `${address}, France`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;

    console.log("📡 Requête Google Maps API pour :", formattedAddress);

    const response = await axios.get(url, {
      params: { address: formattedAddress, key: API_KEY },
    });

    if (response.data.status === "OK") {
      const { lat, lng } = response.data.results[0].geometry.location;
      console.log(`✅ Coordonnées : lat=${lat}, lng=${lng}`);
      return { lat, lng };
    } else {
      console.error(`❌ Erreur géocodage : ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur Google Maps API :", error.message);
    return null;
  }
}

router.post("/optimiser-trajet", async (req, res) => {
  try {
    const { adresse_depart, adresse_arrivee, distance_km } = req.body;

    if (!adresse_depart || !adresse_arrivee || !distance_km || isNaN(distance_km)) {
      return res.status(400).json({ success: false, message: "Données invalides ou manquantes" });
    }

    const startCoords = await getCoordinates(adresse_depart);
    const endCoords = await getCoordinates(adresse_arrivee);

    if (!startCoords || !endCoords) {
      return res.status(400).json({ success: false, message: "❌ Impossible de géocoder les adresses" });
    }

    const requestData = {
      start_lat: startCoords.lat,
      start_lng: startCoords.lng,
      end_lat: endCoords.lat,
      end_lng: endCoords.lng,
      distance_km,
    };

    const response = await axios.post(ML_API_URL, requestData);
    return res.json({ success: true, predicted_duration_min: response.data.predicted_duration_min });
  } catch (error) {
    console.error("❌ Erreur API ML :", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, message: "Erreur API ML", details: error.message });
  }
});

router.post("/save_prediction", async (req, res) => {
  try {
    const { start_lat, start_lng, end_lat, end_lng, distance_km, predicted_duration_min } = req.body;

    if (!start_lat || !start_lng || !end_lat || !end_lng || !distance_km || !predicted_duration_min) {
      return res.status(400).json({ message: "Données manquantes !" });
    }

    console.log("📡 Nouvelle prédiction reçue :", req.body);
    return res.status(201).json({ message: "✅ Prédiction enregistrée avec succès !" });
  } catch (error) {
    console.error("❌ Erreur enregistrement :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/predict", async (req, res) => {
  try {
    const { start_lat, start_lng, end_lat, end_lng, distance_km } = req.body;
    if (!start_lat || !start_lng || !end_lat || !end_lng || !distance_km) {
      return res.status(400).json({ success: false, message: "Données invalides ou manquantes" });
    }

    const response = await axios.post(ML_API_URL, req.body);
    return res.json({ success: true, predicted_duration_min: response.data.predicted_duration_min });
  } catch (error) {
    console.error("❌ Erreur API ML :", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, message: "Erreur API ML", details: error.message });
  }
});

router.post("/predict-duree", async (req, res) => {
  try {
    const inputData = req.body;
    console.log("📡 Données reçues pour /predict-duree :", inputData);

    const pythonProcess = spawn("python3", ["ml/predict_onnx.py", JSON.stringify(inputData)]);

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0 || pythonError.includes("Traceback")) {
        return res.status(500).json({ message: "Erreur script Python", details: pythonError });
      }

      try {
        const output = JSON.parse(pythonOutput);
        return res.json(output);
      } catch (err) {
        return res.status(500).json({ message: "Erreur parsing JSON", error: err.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
