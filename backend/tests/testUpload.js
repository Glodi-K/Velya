require("dotenv").config();
const cloudinary = require("../config/cloudinaryUnsigned");
const path = require("path");
const fs = require("fs");

const testUpload = async () => {
  const imagePath = path.join(__dirname, "test-image.jpg");

  // ✅ Affiche les variables pour vérification
  console.log("🌍 Vérif Cloudinary ENV :");
  console.log("CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API_KEY =", process.env.CLOUDINARY_API_KEY);
  console.log("API_SECRET =", process.env.CLOUDINARY_API_SECRET);

  // ✅ Vérifie si le fichier existe
  if (!fs.existsSync(imagePath)) {
    console.error("❌ Fichier introuvable :", imagePath);
    return;
  }

  try {
    console.log("📤 Upload en cours depuis :", imagePath);

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "tests",
      upload_preset: "unsigned_test", // ← 🔥 Ici on utilise ton preset sans signature
    });

    console.log("✅ Upload réussi :", {
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("❌ Erreur upload Cloudinary :", error.message || error);
  }
};

testUpload();

