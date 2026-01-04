#!/usr/bin/env node

/**
 * ===== VÉRIFICATION FINALE PRÉ-DÉPLOIEMENT =====
 * Checklist exhaustive avant mise en ligne
 * Usage: node scripts/final-deployment-check.js
 */

const fs = require('fs');
const path = require('path');

// Couleurs simples
const OK = '✅';
const ERROR = '❌';
const WARNING = '⚠️';

let passed = 0;
let failed = 0;
let warnings = 0;

console.log('\n' + '='.repeat(60));
console.log('  CHECK-UP SANS PITIÉ - VÉRIFICATION PRÉ-DÉPLOIEMENT');
console.log('='.repeat(60) + '\n');

function checkFile(filepath, description) {
  if (fs.existsSync(filepath)) {
    console.log(`${OK} ${description}`);
    passed++;
    return true;
  } else {
    console.log(`${ERROR} ${description} - FILE NOT FOUND`);
    failed++;
    return false;
  }
}

function checkContent(filepath, pattern, description) {
  if (!fs.existsSync(filepath)) {
    console.log(`${ERROR} ${description} - FILE NOT FOUND`);
    failed++;
    return false;
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  if (typeof pattern === 'string') {
    if (content.includes(pattern)) {
      console.log(`${OK} ${description}`);
      passed++;
      return true;
    }
  } else if (pattern instanceof RegExp) {
    if (pattern.test(content)) {
      console.log(`${OK} ${description}`);
      passed++;
      return true;
    }
  }
  
  console.log(`${ERROR} ${description} - NOT FOUND IN FILE`);
  failed++;
  return false;
}

// ========================== SÉCURITÉ ==========================
console.log('\n🔒 SÉCURITÉ\n');

checkContent(path.join(__dirname, '../.gitignore'), '.env', 
  '.env files ignored in git');

checkContent(path.join(__dirname, '../backend/src/app.js'), 'helmet',
  'Helmet security headers configured');

checkContent(path.join(__dirname, '../backend/src/app.js'), /csrf|CSRF/,
  'CSRF protection implemented');

checkFile(path.join(__dirname, '../backend/utils/validationSchemas.js'),
  'Joi validation schemas exist');

checkContent(path.join(__dirname, '../backend/src/app.js'), /errorHandler|catch/,
  'Global error handler configured');

checkFile(path.join(__dirname, '../backend/middleware/rateLimitMiddleware.js'),
  'Rate limiting middleware exists');

checkContent(path.join(__dirname, '../backend/src/app.js'), /Sentry|sentry/,
  'Sentry error tracking configured');

// ========================== HTTPS ==========================
console.log('\n🔐 HTTPS/TLS\n');

checkContent(path.join(__dirname, '../backend/server.js'), /https|USE_HTTPS/,
  'HTTPS support configured');

console.log(`${WARNING} SSL certificates must be valid (Let\'s Encrypt recommended)`);
warnings++;

console.log(`${WARNING} USE_HTTPS=true must be set in .env.production`);
warnings++;

// ========================== ERREURS ==========================
console.log('\n📝 ERREURS & LOGS\n');

checkFile(path.join(__dirname, '../frontend/src/pages/NotFound.jsx'),
  '404 error page component exists');

checkFile(path.join(__dirname, '../frontend/src/pages/ServerError.jsx'),
  '500 error page component exists');

checkContent(path.join(__dirname, '../backend/src/app.js'), 'morgan',
  'HTTP logging (Morgan) configured');

// ========================== CONFIGURATION ==========================
console.log('\n⚙️ CONFIGURATION\n');

const backendPkg = path.join(__dirname, '../backend/package.json');
if (fs.existsSync(backendPkg)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(backendPkg, 'utf8'));
    const criticalDeps = [
      'express', 'mongoose', 'helmet', 'bcryptjs', 
      'jsonwebtoken', 'express-rate-limit'
    ];
    
    const missing = criticalDeps.filter(dep => 
      !pkg.dependencies[dep] && !pkg.devDependencies[dep]
    );
    
    if (missing.length === 0) {
      console.log(`${OK} All critical backend dependencies in package.json`);
      passed++;
    } else {
      console.log(`${ERROR} Missing dependencies: ${missing.join(', ')}`);
      failed++;
    }
  } catch (e) {
    console.log(`${ERROR} Cannot parse backend/package.json`);
    failed++;
  }
} else {
  console.log(`${ERROR} backend/package.json not found`);
  failed++;
}

checkContent(path.join(__dirname, '../frontend/public/index.html'), 'viewport',
  'Viewport meta tag present for mobile');

// ========================== ROUTES & ENDPOINTS ==========================
console.log('\n🌐 ROUTES & ENDPOINTS\n');

checkContent(path.join(__dirname, '../backend/src/app.js'), '/api/health',
  'Health check endpoint configured');

checkContent(path.join(__dirname, '../backend/src/app.js'), '/api/csrf-token',
  'CSRF token endpoint configured');

// ========================== FRONTEND ==========================
console.log('\n⚛️ FRONTEND\n');

checkFile(path.join(__dirname, '../frontend/package.json'),
  'Frontend package.json exists');

checkFile(path.join(__dirname, '../frontend/tailwind.config.js'),
  'Tailwind CSS configured');

checkFile(path.join(__dirname, '../frontend/src/services/csrfService.js'),
  'Frontend CSRF service exists');

// ========================== DOCUMENTATION ==========================
console.log('\n📚 DOCUMENTATION\n');

checkFile(path.join(__dirname, '../PRODUCTION_CONFIG.md'),
  'Production configuration guide exists');

checkFile(path.join(__dirname, '../PRE_DEPLOYMENT_CHECKLIST.md'),
  'Pre-deployment checklist exists');

checkFile(path.join(__dirname, '../SECURITY_AND_PERFORMANCE.md'),
  'Security & performance documentation exists');

// ========================== SCRIPTS ==========================
console.log('\n🛠️ SCRIPTS\n');

checkFile(path.join(__dirname, '../scripts/backup-mongodb.sh'),
  'MongoDB backup script exists');

checkFile(path.join(__dirname, '../scripts/health-check.sh'),
  'Health check script exists');

// ========================== RÉSUMÉ ==========================
console.log('\n' + '='.repeat(60));

const total = passed + failed;
const score = total > 0 ? Math.round((passed / total) * 100) : 0;

console.log(`\n✅ RÉUSSI: ${passed}`);
console.log(`❌ ÉCHOUÉ: ${failed}`);
console.log(`⚠️  AVERTISSEMENTS: ${warnings}`);
console.log(`\n📊 SCORE: ${score}% (${passed}/${total})`);

if (failed === 0 && score >= 80) {
  console.log('\n' + '✅'.repeat(30));
  console.log('PRÊT POUR LA PRODUCTION!');
  console.log('✅'.repeat(30));
  console.log('\nÉtapes suivantes:');
  console.log('1. Créer .env.production avec secrets réels');
  console.log('2. Générer/configurer certificats SSL');
  console.log('3. npm install dans backend/');
  console.log('4. Exécuter tests: npm test');
  console.log('5. Exécuter audits: node scripts/audit-security.js');
  console.log('6. Tests manuels (navigateurs, mobile, accessibilité)');
  console.log('7. Déployer avec docker-compose.prod.yml');
} else {
  console.log('\n❌ PROBLÈMES À CORRIGER AVANT DÉPLOIEMENT');
  console.log('\nProblèmes critiques trouvés. À résoudre d\'urgence.');
}

console.log('\n' + '='.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
