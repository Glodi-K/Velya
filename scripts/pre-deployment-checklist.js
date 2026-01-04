#!/usr/bin/env node

/**
 * ===== PRE-DEPLOYMENT CHECKLIST =====
 * Vérification exhaustive avant mise en ligne
 * Usage: node scripts/pre-deployment-checklist.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;
let warningCount = 0;

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function section(title) {
  console.log(`\n${COLORS.cyan}╔══════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.cyan}║ ${title.padEnd(40)} ║${COLORS.reset}`);
  console.log(`${COLORS.cyan}╚══════════════════════════════════════════╝${COLORS.reset}\n`);
}

function pass(message) {
  log(`  ✅ ${message}`, COLORS.green);
  passCount++;
}

function fail(message, details = '') {
  log(`  ❌ ${message}`, COLORS.red);
  if (details) log(`     ${details}`, COLORS.red);
  failCount++;
}

function warning(message, details = '') {
  log(`  ⚠️  ${message}`, COLORS.yellow);
  if (details) log(`     ${details}`, COLORS.yellow);
  warningCount++;
}

function check(condition, successMsg, failMsg, details = '') {
  if (condition) {
    pass(successMsg);
  } else {
    fail(failMsg, details);
  }
}

// ========================== SÉCURITÉ ==========================
section('🔒 SÉCURITÉ');

// 1. Vérifier que .env existe et contient les clés
const envPath = path.join(__dirname, '../.env');
const envProdPath = path.join(__dirname, '../.env.production');
const envExamplePath = path.join(__dirname, '../.env.example');

check(fs.existsSync(envProdPath), 
  '.env.production exists', 
  '.env.production NOT found',
  'Créer: cp .env.example .env.production && éditer avec vrais secrets');

// 2. Vérifier que .env n'est pas committé
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  check(gitignoreContent.includes('.env'), 
    '.env is ignored in git', 
    '.env NOT in .gitignore - RISK OF SECRET EXPOSURE',
    'Ajouter à .gitignore: .env\n     .env.*.local\n     .env.production');
} else {
  warning('.gitignore not found');
}

// 3. Vérifier HTTPS
const serverPath = path.join(__dirname, '../backend/src/app.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const hasHTTPS = serverContent.includes('USE_HTTPS') || serverContent.includes('https');
  const hasHSTS = serverContent.includes('hsts') || serverContent.includes('Strict-Transport-Security');
  
  check(hasHTTPS, 
    'HTTPS support configured', 
    'HTTPS NOT configured - CRITICAL',
    'Implémenter HTTPS dans server.js');
  
  check(hasHSTS, 
    'HSTS header configured', 
    'HSTS NOT configured',
    'Ajouter à Helmet: hsts: { maxAge: 31536000 }');
}

// 4. Vérifier CSRF
const appPath = path.join(__dirname, '../backend/src/app.js');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasCSRF = appContent.includes('csrf') || appContent.includes('CSRF');
  
  check(hasCSRF, 
    'CSRF protection implemented', 
    'CSRF NOT found',
    'Implémenter express-csurf ou protection similaire');
}

// 5. Vérifier validation
const validationPath = path.join(__dirname, '../backend/utils/validationSchemas.js');
check(fs.existsSync(validationPath), 
  'Input validation schemas exist', 
  'Validation schemas NOT found',
  'Créer backend/utils/validationSchemas.js avec Joi');

// 6. Vérifier error handler
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasErrorHandler = appContent.includes('errorHandler') || appContent.includes('catch');
  
  check(hasErrorHandler, 
    'Global error handler implemented', 
    'Global error handler NOT found',
    'Implémenter middleware global de gestion d\'erreurs');
}

// 7. Vérifier rate limiting
const rateLimitPath = path.join(__dirname, '../backend/middleware/rateLimitMiddleware.js');
check(fs.existsSync(rateLimitPath), 
  'Rate limiting configured', 
  'Rate limiting NOT found',
  'Créer backend/middleware/rateLimitMiddleware.js avec express-rate-limit');

// 8. Vérifier Sentry
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasSentry = appContent.includes('Sentry') || appContent.includes('sentry');
  
  check(hasSentry, 
    'Sentry error tracking enabled', 
    'Sentry NOT configured',
    'Implémenter @sentry/node pour le monitoring d\'erreurs');
}

// ========================== ERRORS & LOGS ==========================
section('📝 ERREURS & LOGS');

// 1. Vérifier pages d'erreur
const errorPagePath404 = path.join(__dirname, '../frontend/src/pages/NotFound.jsx');
const errorPagePath500 = path.join(__dirname, '../frontend/src/pages/ServerError.jsx');

check(fs.existsSync(errorPagePath404), 
  '404 error page exists', 
  '404 page NOT found',
  'Créer frontend/src/pages/NotFound.jsx');

check(fs.existsSync(errorPagePath500), 
  '500 error page exists', 
  '500 page NOT found',
  'Créer frontend/src/pages/ServerError.jsx');

// 2. Vérifier logging
const hasLogging = fs.existsSync(appPath) && 
  fs.readFileSync(appPath, 'utf8').includes('morgan');

check(hasLogging, 
  'HTTP logging (Morgan) configured', 
  'Morgan logging NOT found',
  'Ajouter: const morgan = require("morgan"); app.use(morgan("combined"));');

// 3. Vérifier logs folder
const logsPath = path.join(__dirname, '../backend/src/logs');
const logsExist = fs.existsSync(logsPath);

if (logsExist) {
  pass('Logs directory exists');
} else {
  warning('Logs directory NOT found - créer backend/src/logs/');
}

// 4. Vérifier .gitignore pour logs
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const hasLogs = gitignoreContent.includes('logs') || gitignoreContent.includes('*.log');
  
  check(hasLogs, 
    'Log files ignored in git', 
    'Logs NOT ignored - risk of exposure',
    'Ajouter à .gitignore: logs/\n     *.log');
}

// ========================== COMPATIBILITÉ ==========================
section('🌐 COMPATIBILITÉ');

// 1. Vérifier responsive design
const tailwindPath = path.join(__dirname, '../frontend/tailwind.config.js');
check(fs.existsSync(tailwindPath), 
  'Tailwind CSS configured for responsive design', 
  'Tailwind NOT found',
  'Configurer ou vérifier tailwind.config.js');

// 2. Vérifier viewport meta tag
const publicPath = path.join(__dirname, '../frontend/public/index.html');
if (fs.existsSync(publicPath)) {
  const indexContent = fs.readFileSync(publicPath, 'utf8');
  const hasViewport = indexContent.includes('viewport');
  
  check(hasViewport, 
    'Viewport meta tag present', 
    'Viewport meta tag NOT found - mobile may not work',
    'Ajouter: <meta name="viewport" content="width=device-width, initial-scale=1.0">');
}

warning('Manual testing required for:',
  '  • Chrome, Firefox, Edge, Safari\n     ' +
  '• iOS Safari, Android Chrome\n     ' +
  '• Widths: 320px, 768px, 1024px, 1920px+');

// ========================== ACCESSIBILITÉ ==========================
section('♿ ACCESSIBILITÉ');

warning('Manual accessibility testing required:',
  '  • Tab navigation: Can you tab through the entire app?\n     ' +
  '• Labels: Do all form inputs have proper labels?\n     ' +
  '• Contrast: Text readable on all backgrounds (WCAG AA)?\n     ' +
  '• Images: Do images have alt text?\n     ' +
  '• Colors: Do not rely on color alone to convey info?\n     ' +
  '• Screen reader: Test with NVDA/JAWS/VoiceOver');

// ========================== SEO ==========================
section('🔍 SEO');

let seoIssues = [];

if (fs.existsSync(publicPath)) {
  const indexContent = fs.readFileSync(publicPath, 'utf8');
  
  if (indexContent.includes('<title>') && !indexContent.includes('Velya')) {
    pass('Page title present');
  } else {
    seoIssues.push('Page title missing or generic');
  }
  
  if (indexContent.includes('meta') && indexContent.includes('description')) {
    pass('Meta description present');
  } else {
    seoIssues.push('Meta description missing');
  }
}

const sitemapPath = path.join(__dirname, '../frontend/public/sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  pass('sitemap.xml present');
} else {
  seoIssues.push('sitemap.xml missing - important for SEO');
}

const robotsPath = path.join(__dirname, '../frontend/public/robots.txt');
if (fs.existsSync(robotsPath)) {
  pass('robots.txt present');
} else {
  seoIssues.push('robots.txt missing');
}

if (seoIssues.length === 0) {
  pass('Basic SEO elements present');
} else {
  seoIssues.forEach(issue => {
    warning(issue);
  });
}

// ========================== PERFORMANCE ==========================
section('⚡ PERFORMANCE');

// 1. Vérifier Redis/Cache
const cacheServicePath = path.join(__dirname, '../backend/services/cacheService.js');
check(fs.existsSync(cacheServicePath), 
  'Redis caching service configured', 
  'Redis cache NOT found',
  'Implémenter backend/services/cacheService.js');

// 2. Vérifier compression
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasCompression = appContent.includes('compression');
  
  check(hasCompression, 
    'Gzip compression enabled', 
    'Compression NOT configured',
    'Ajouter: app.use(compression());');
}

// 3. Vérifier circuit breaker
const retryServicePath = path.join(__dirname, '../backend/services/retryService.js');
check(fs.existsSync(retryServicePath), 
  'Circuit breaker for external services', 
  'Circuit breaker NOT found',
  'Implémenter backend/services/retryService.js');

warning('Performance optimization items (manual):',
  '  • Images: Using modern formats (WebP) with fallbacks?\n     ' +
  '• Code splitting: Large bundles split?\n     ' +
  '• Lazy loading: Heavy components loaded on demand?\n     ' +
  '• Run Lighthouse: target 80+ performance');

// ========================== CONFIG SERVER ==========================
section('⚙️ CONFIGURATION SERVEUR');

// 1. Vérifier package.json
const backendPackagePath = path.join(__dirname, '../backend/package.json');
if (fs.existsSync(backendPackagePath)) {
  const pkg = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  
  // Vérifier dépendances critiques
  const required = ['express', 'mongoose', 'helmet', 'express-rate-limit', 'jsonwebtoken'];
  const missing = required.filter(dep => !pkg.dependencies[dep] && !pkg.devDependencies[dep]);
  
  if (missing.length === 0) {
    pass('All required backend dependencies installed');
  } else {
    fail(`Missing dependencies: ${missing.join(', ')}`);
  }
}

// 2. Vérifier NODE_ENV
warning('NODE_ENV must be "production" in .env.production',
  'Verify: NODE_ENV=production (no debug mode)');

// 3. Vérifier timeouts DB
warning('Database connection timeout configured (30-60s)?',
  'Check: MONGO_TIMEOUT in environment');

// ========================== DONNÉES ==========================
section('💾 DONNÉES');

// 1. Vérifier backup
const backupScript = path.join(__dirname, '../scripts/backup-mongodb.sh');
check(fs.existsSync(backupScript), 
  'Backup script exists', 
  'Backup script NOT found',
  'Créer: scripts/backup-mongodb.sh et configurer cron');

warning('Automated backups configured?',
  'Setup: crontab -e\n     ' +
  'Add: 0 2 * * * /path/to/scripts/backup-mongodb.sh\n     ' +
  '(Daily backup at 2 AM)');

// ========================== POST-DÉPLOIEMENT ==========================
section('🚀 SMOKE TESTS (POST-DÉPLOIEMENT)');

log('Exécuter après déploiement:');
log('  1. curl https://api.velya.ca/api/health', COLORS.yellow);
log('  2. curl https://velya.ca', COLORS.yellow);
log('  3. Test signup form', COLORS.yellow);
log('  4. Test login', COLORS.yellow);
log('  5. Test Stripe payment (montant test)', COLORS.yellow);
log('  6. Check Sentry for errors', COLORS.yellow);
log('  7. Check logs: docker-compose logs -f backend', COLORS.yellow);

// ========================== RÉSUMÉ ==========================
section('📊 RÉSUMÉ');

const total = passCount + failCount + warningCount;
const percentage = total > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0;

console.log(`\n${COLORS.green}✅ Validations réussies: ${passCount}${COLORS.reset}`);
console.log(`${COLORS.red}❌ Validations échouées: ${failCount}${COLORS.reset}`);
console.log(`${COLORS.yellow}⚠️  Avertissements: ${warningCount}${COLORS.reset}`);
console.log(`\n${COLORS.blue}Score de préparation: ${percentage}%${COLORS.reset}\n`);

if (failCount === 0) {
  log('✅ PRÊT POUR LA PRODUCTION! Mais vérifier les avertissements.', COLORS.green);
} else {
  log('❌ PROBLÈMES CRITIQUES À RÉSOUDRE AVANT DÉPLOIEMENT', COLORS.red);
  process.exit(1);
}
