#!/usr/bin/env node

/**
 * Script d'optimisation des images pour production
 * Génère WebP, JPEG en plusieurs résolutions, compressé
 * 
 * Installation:
 * npm install sharp
 * 
 * Utilisation:
 * node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../frontend/public/images');
const OUTPUT_DIR = path.join(__dirname, '../frontend/build/images');

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const IMAGE_SIZES = {
  small: { width: 640, height: 480, quality: 80 },
  medium: { width: 1024, height: 768, quality: 80 },
  large: { width: 1920, height: 1440, quality: 75 },
};

async function optimizeImage(inputPath, filename) {
  const baseName = path.parse(filename).name;

  console.log(`\n📸 Optimisation: ${filename}`);

  try {
    // Obtenir les infos de l'image
    const metadata = await sharp(inputPath).metadata();
    console.log(`   Taille originale: ${metadata.width}x${metadata.height}`);

    // Générer WebP principal
    const webpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
    await sharp(inputPath)
      .webp({ quality: 80, alphaQuality: 100 })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    console.log(`   ✅ WebP: ${(webpStats.size / 1024).toFixed(1)} KB`);

    // Générer JPEG et WebP pour chaque taille
    for (const [size, config] of Object.entries(IMAGE_SIZES)) {
      // JPEG
      const jpegPath = path.join(OUTPUT_DIR, `${baseName}-${size}.jpg`);
      await sharp(inputPath)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: config.quality, progressive: true })
        .toFile(jpegPath);

      const jpegStats = fs.statSync(jpegPath);
      console.log(`   ✅ JPEG ${size}: ${(jpegStats.size / 1024).toFixed(1)} KB (${config.width}x${config.height})`);

      // WebP
      const webpSizePath = path.join(OUTPUT_DIR, `${baseName}-${size}.webp`);
      await sharp(inputPath)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: config.quality })
        .toFile(webpSizePath);

      const webpSizeStats = fs.statSync(webpSizePath);
      const savings = ((1 - webpSizeStats.size / jpegStats.size) * 100).toFixed(1);
      console.log(`   ✅ WebP ${size}: ${(webpSizeStats.size / 1024).toFixed(1)} KB (économie: ${savings}%)`);
    }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
  }
}

async function optimizeAllImages() {
  console.log('🚀 Optimisation des images en cours...\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.warn('⚠️  Le dossier d\'images n\'existe pas:', IMAGES_DIR);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (files.length === 0) {
    console.log('ℹ️  Aucune image trouvée à optimiser');
    return;
  }

  console.log(`📁 ${files.length} image(s) à traiter\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const stats = fs.statSync(inputPath);
    totalOriginal += stats.size;

    await optimizeImage(inputPath, file);
  }

  // Calculer les économies
  const optimizedFiles = fs.readdirSync(OUTPUT_DIR);
  for (const file of optimizedFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = fs.statSync(filePath);
    totalOptimized += stats.size;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé');
  console.log('='.repeat(50));
  console.log(`Total original:   ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total optimisé:   ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Économies:        ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
  console.log('='.repeat(50) + '\n');

  console.log('✅ Optimisation terminée!\n');
  console.log('💡 Prochaines étapes:');
  console.log('   1. Vérifier les images dans ' + OUTPUT_DIR);
  console.log('   2. Utiliser OptimizedImage.jsx dans vos composants');
  console.log('   3. Exécuter Lighthouse pour vérifier les améliorations\n');
}

optimizeAllImages().catch(console.error);
