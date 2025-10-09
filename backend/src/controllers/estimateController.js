const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 🔐 Vérification automatique du dossier d'uploads
const estimatesDir = path.join(__dirname, "../uploads/estimates");
if (!fs.existsSync(estimatesDir)) {
  fs.mkdirSync(estimatesDir, { recursive: true });
}

const analyzePhotos = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Aucune photo reçue." });
    }

    const model = await cocoSsd.load();
    let estimatedSurface = 0;
    const detectionLog = [];

    for (const file of files) {
      const imagePath = path.join(__dirname, "..", file.path);
      const img = await loadImage(imagePath);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
     // const tensor = tf.browser.fromPixels(canvas);

     // const predictions = await model.detect(tensor);

      const containsBed = predictions.some(p => p.class === "bed");
      const containsSofa = predictions.some(p => p.class === "couch");
      const containsTable = predictions.some(p => p.class === "dining table" || p.class === "chair");

      let surface = 0;
      if (containsBed) surface += 12;
      if (containsSofa) surface += 10;
      if (containsTable) surface += 8;

      if (surface === 0) surface = 6;

      estimatedSurface += surface;

      detectionLog.push({
        file: file.originalname,
        detected: predictions.map(p => p.class),
        surfaceEstimee: surface
      });
    }

    const minPrice = (estimatedSurface * 1.59).toFixed(2);
    const maxPrice = (estimatedSurface * 2.29).toFixed(2);

    res.status(200).json({
      message: "Estimation IA réussie",
      estimatedSurface,
      priceRange: { min: minPrice, max: maxPrice },
      detectionLog,
    });
  } catch (err) {
    console.error("❌ Erreur IA estimation :", err);
    res.status(500).json({ message: "Erreur serveur pendant l’analyse." });
  }
};

module.exports = { analyzePhotos };

