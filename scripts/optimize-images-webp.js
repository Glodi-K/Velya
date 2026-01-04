#!/usr/bin/env node
/**
 * Script d'optimisation d'images - Conversion WebP + compression
 * Réduit le LCP en convertissant les images en WebP
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_DIR = path.join(__dirname, '../frontend/src/assets');
const OUTPUT_DIR = path.join(__dirname, '../frontend/public/optimized');

// Créer le dossier de sortie
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

async function optimizeImages() {
  console.log('🖼️  Démarrage de l\'optimisation d\'images...\n');
  
  // Scanner les répertoires d'assets
  const searchDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(file => {
      const filepath = path.join(dir, file);
      if (fs.statSync(filepath).isDirectory()) {
        searchDir(filepath, callback);
      } else {
        callback(filepath);
      }
    });
  };

  let optimizedCount = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  if (fs.existsSync(INPUT_DIR)) {
    await new Promise((resolve) => {
      searchDir(INPUT_DIR, async (filepath) => {
        const ext = path.extname(filepath).toLowerCase();
        
        if (SUPPORTED_FORMATS.includes(ext)) {
          try {
            const filename = path.basename(filepath, ext);
            const stats = fs.statSync(filepath);
            const beforeSize = stats.size;
            
            // Convertir en WebP
            const webpPath = path.join(OUTPUT_DIR, `${filename}.webp`);
            await sharp(filepath)
              .webp({ quality: 80 })
              .toFile(webpPath);
            
            const afterStats = fs.statSync(webpPath);
            const afterSize = afterStats.size;
            const reduction = ((1 - afterSize / beforeSize) * 100).toFixed(1);
            
            totalSizeBefore += beforeSize;
            totalSizeAfter += afterSize;
            optimizedCount++;
            
            console.log(`✅ ${filename}.webp`);
            console.log(`   Avant: ${(beforeSize / 1024).toFixed(1)} KB → Après: ${(afterSize / 1024).toFixed(1)} KB (-${reduction}%)\n`);
          } catch (err) {
            console.error(`❌ Erreur: ${filepath}`, err.message);
          }
        }
      });
      
      setTimeout(resolve, 100);
    });
  }

  console.log('\n📊 Résumé:');
  console.log(`✅ ${optimizedCount} images optimisées`);
  console.log(`📉 Total avant: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📈 Total après: ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🎯 Réduction: ${((1 - totalSizeAfter / totalSizeBefore) * 100).toFixed(1)}%\n`);
}

optimizeImages().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
