// config/cloudinaryUnsigned.js
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
}); // ❌ Ne pas inclure api_key / api_secret ici

module.exports = cloudinary;

