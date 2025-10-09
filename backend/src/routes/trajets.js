// routes/trajets.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const verifyToken = require('../middleware/verifyToken');

// Utiliser le script d'optimisation simplifié pour éviter les problèmes de dépendances
const OPTIMIZE_SCRIPT = path.join(__dirname, '../ml/simple_optimize.py');

/**
 * @route POST /api/trajets/optimize
 * @desc Optimise l'ordre des destinations pour un prestataire
 * @access Private
 */
router.post('/optimize', verifyToken, async (req, res) => {
  try {
    const { startLocation, destinations } = req.body;
    
    if (!startLocation || !destinations || !Array.isArray(destinations)) {
      return res.status(400).json({ message: "Données invalides pour l'optimisation" });
    }
    
    // Appeler le script Python pour l'optimisation
    const pythonProcess = spawn('python', [
      OPTIMIZE_SCRIPT
    ]);
    
    let result = '';
    let errorOutput = '';
    
    // Envoyer les données au script Python
    pythonProcess.stdin.write(JSON.stringify({ startLocation, destinations }));
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Erreur Python: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Erreur script Python (code ${code}):`, errorOutput);
        return res.status(500).json({ 
          message: "Erreur lors de l'optimisation du trajet",
          error: errorOutput
        });
      }
      
      try {
        const optimizedRoute = JSON.parse(result);
        res.status(200).json({ 
          message: "Trajet optimisé avec succès",
          optimizedRoute 
        });
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
        res.status(500).json({ 
          message: "Erreur lors du traitement des résultats",
          rawOutput: result
        });
      }
    });
  } catch (error) {
    console.error("❌ Erreur optimisation trajet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * @route GET /api/trajets/estimate
 * @desc Estime le temps de trajet entre deux points
 * @access Private
 */
router.get('/estimate', verifyToken, async (req, res) => {
  try {
    const { origin, destination, departureTime } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ message: "Origine et destination requises" });
    }
    
    // Préparer les arguments pour le script Python
    const args = [
      path.join(__dirname, '../ml/predict_travel_time.py'),
      origin,
      destination
    ];
    
    if (departureTime) {
      args.push(departureTime);
    }
    
    // Appeler le script Python pour l'estimation
    const pythonProcess = spawn('python', args);
    
    let result = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Erreur Python: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Erreur script Python (code ${code}):`, errorOutput);
        return res.status(500).json({ 
          message: "Erreur lors de l'estimation du temps de trajet",
          error: errorOutput
        });
      }
      
      try {
        const travelTime = parseFloat(result.trim());
        res.status(200).json({ 
          travelTimeMinutes: travelTime,
          travelTimeFormatted: `${Math.floor(travelTime / 60)}h ${Math.round(travelTime % 60)}min`
        });
      } catch (error) {
        console.error("Erreur parsing résultat:", error);
        res.status(500).json({ 
          message: "Erreur lors du traitement des résultats",
          rawOutput: result
        });
      }
    });
  } catch (error) {
    console.error("❌ Erreur estimation trajet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * @route POST /api/trajets/test-optimize
 * @desc Route de test pour l'optimisation des trajets (sans authentification)
 * @access Public
 */
router.post('/test-optimize', async (req, res) => {
  try {
    const { startLocation, destinations } = req.body;
    
    if (!startLocation || !destinations || !Array.isArray(destinations)) {
      return res.status(400).json({ message: "Données invalides pour l'optimisation" });
    }
    
    // Appeler le script Python pour l'optimisation
    const pythonProcess = spawn('python', [
      OPTIMIZE_SCRIPT
    ]);
    
    let result = '';
    let errorOutput = '';
    
    // Envoyer les données au script Python
    pythonProcess.stdin.write(JSON.stringify({ startLocation, destinations }));
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Erreur Python: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Erreur script Python (code ${code}):`, errorOutput);
        return res.status(500).json({ 
          message: "Erreur lors de l'optimisation du trajet",
          error: errorOutput
        });
      }
      
      try {
        const optimizedRoute = JSON.parse(result);
        res.status(200).json({ 
          message: "Trajet optimisé avec succès",
          optimizedRoute 
        });
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
        res.status(500).json({ 
          message: "Erreur lors du traitement des résultats",
          rawOutput: result
        });
      }
    });
  } catch (error) {
    console.error("❌ Erreur optimisation trajet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;