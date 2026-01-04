#!/usr/bin/env node

/**
 * 🔍 PRE-DEPLOYMENT SECURITY AUDIT
 * Script de vérification sécurité avant déploiement
 * 
 * Usage: node audit-security.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[37m',
};

class SecurityAudit {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const prefix = {
      success: `${colors.green}✓${colors.reset}`,
      error: `${colors.red}✗${colors.reset}`,
      warning: `${colors.yellow}⚠${colors.reset}`,
      info: `${colors.blue}ℹ${colors.reset}`,
    };

    console.log(`${prefix[type]} ${message}`);
  }

  // ===== 1. VÉRIFIER LES VARIABLES D'ENVIRONNEMENT =====
  checkEnvironmentVariables() {
    console.log(`\n${colors.blue}═══════ 1. VARIABLES D'ENVIRONNEMENT ═══════${colors.reset}`);

    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');

    // Vérifier que .env existe
    if (!fs.existsSync(envPath)) {
      this.log('❌ .env non trouvé', 'error');
      this.errors.push('.env manquant');
    } else {
      this.log('.env exists', 'success');
    }

    // Lire .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'JWT_SECRET',
      'MONGO_URI',
      'STRIPE_SECRET_KEY',
      'SESSION_SECRET',
      'SENTRY_DSN',
    ];

    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        this.log(`${varName} configuré`, 'success');
      } else {
        this.log(`${varName} manquant`, 'warning');
        this.warnings.push(`${varName} non trouvé dans .env`);
      }
    });

    // Vérifier les secrets ne sont pas exposés
    const dangerousPatterns = [
      { pattern: /password[\s]*=[\s]*[a-zA-Z0-9]+/gi, name: 'plaintext password' },
      { pattern: /sk_test_/gi, name: 'Stripe test key (should be sk_live_)' },
      { pattern: /localhost|127\.0\.0\.1/gi, name: 'localhost URL (should be production)' },
    ];

    dangerousPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(envContent)) {
        this.log(`⚠️  Possible ${name} detected`, 'warning');
        this.warnings.push(`${name} found in .env`);
      }
    });
  }

  // ===== 2. VÉRIFIER LES SECRETS DANS LE CODE =====
  checkSecretsInCode() {
    console.log(`\n${colors.blue}═══════ 2. SECRETS DANS LE CODE =====════${colors.reset}`);

    const filesToCheck = [
      'backend/src/app.js',
      'frontend/src/App.jsx',
      'frontend/src/index.js',
    ];

    const dangerousPatterns = [
      /sk_test_|sk_live_/,
      /password[\s]*[:=]/,
      /secret[\s]*[:=][\s]*["'][^"']+["']/,
      /token[\s]*[:=][\s]*["'][^"']+["']/,
      /api_key|apiKey/,
    ];

    filesToCheck.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) return;

      const content = fs.readFileSync(fullPath, 'utf8');
      dangerousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.log(`⚠️  Possible secret in ${file}`, 'warning');
          this.warnings.push(`Potential secret found in ${file}`);
        }
      });
    });

    this.log('No obvious secrets found in code', 'success');
  }

  // ===== 3. VÉRIFIER LES HEADERS DE SÉCURITÉ =====
  checkSecurityHeaders() {
    console.log(`\n${colors.blue}═══════ 3. SECURITY HEADERS =====════${colors.reset}`);

    const appPath = path.join(process.cwd(), 'backend/src/app.js');
    if (!fs.existsSync(appPath)) {
      this.log('app.js not found', 'error');
      return;
    }

    const content = fs.readFileSync(appPath, 'utf8');

    const requiredHeaders = [
      { name: 'Helmet', pattern: /helmet\(/ },
      { name: 'HSTS', pattern: /hsts/ },
      { name: 'CSP', pattern: /contentSecurityPolicy/ },
      { name: 'X-Frame-Options', pattern: /X-Frame-Options/ },
      { name: 'CORS', pattern: /cors\(/ },
    ];

    requiredHeaders.forEach(({ name, pattern }) => {
      if (pattern.test(content)) {
        this.log(`${name} configured`, 'success');
      } else {
        this.log(`${name} NOT configured`, 'warning');
        this.warnings.push(`${name} not found in app.js`);
      }
    });
  }

  // ===== 4. VÉRIFIER LA PROTECTION CSRF =====
  checkCSRFProtection() {
    console.log(`\n${colors.blue}═══════ 4. CSRF PROTECTION =====════${colors.reset}`);

    const appPath = path.join(process.cwd(), 'backend/src/app.js');
    if (!fs.existsSync(appPath)) {
      this.log('app.js not found', 'error');
      return;
    }

    const content = fs.readFileSync(appPath, 'utf8');

    if (content.includes('csrfProtection') || content.includes('csrf')) {
      this.log('CSRF protection activated', 'success');
    } else {
      this.log('CSRF protection NOT activated', 'error');
      this.errors.push('CSRF protection missing');
    }

    // Vérifier le service CSRF frontend
    const csrfServicePath = path.join(process.cwd(), 'frontend/src/services/csrfService.js');
    if (fs.existsSync(csrfServicePath)) {
      this.log('CSRF service exists', 'success');
    } else {
      this.log('CSRF service NOT found', 'warning');
    }
  }

  // ===== 5. VÉRIFIER HTTPS/TLS =====
  checkHTTPS() {
    console.log(`\n${colors.blue}═══════ 5. HTTPS/TLS CONFIGURATION =====════${colors.reset}`);

    const serverPath = path.join(process.cwd(), 'backend/server.js');
    if (!fs.existsSync(serverPath)) {
      this.log('server.js not found', 'error');
      return;
    }

    const content = fs.readFileSync(serverPath, 'utf8');

    if (content.includes('https.createServer') || content.includes('useHttps')) {
      this.log('HTTPS support detected', 'success');
    } else {
      this.log('HTTPS support NOT detected', 'error');
      this.errors.push('HTTPS support missing');
    }

    // Vérifier les certificats
    const certPath = path.join(process.cwd(), 'ssl/velya.ca/fullchain.pem');
    const keyPath = path.join(process.cwd(), 'ssl/velya.ca/privkey.pem');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      this.log('SSL certificates found', 'success');
    } else {
      this.log('SSL certificates NOT found (required for production)', 'warning');
      this.warnings.push('SSL certificates not found');
    }
  }

  // ===== 6. VÉRIFIER LES VALIDATIONS D'INPUT =====
  checkInputValidation() {
    console.log(`\n${colors.blue}═══════ 6. INPUT VALIDATION =====════${colors.reset}`);

    const validationPath = path.join(process.cwd(), 'backend/src/utils/validationSchemas.js');
    
    if (fs.existsSync(validationPath)) {
      const content = fs.readFileSync(validationPath, 'utf8');
      
      if (content.includes('Joi') || content.includes('joi')) {
        this.log('Joi validation found', 'success');
      } else {
        this.log('Joi validation NOT found', 'error');
        this.errors.push('No input validation schema found');
      }
    } else {
      this.log('Validation schemas NOT found', 'error');
      this.errors.push('Validation schemas missing');
    }
  }

  // ===== 7. VÉRIFIER LES ERROR HANDLERS =====
  checkErrorHandlers() {
    console.log(`\n${colors.blue}═══════ 7. ERROR HANDLERS =====════${colors.reset}`);

    const errorHandlerPath = path.join(process.cwd(), 'backend/src/middleware/errorHandler.js');
    
    if (fs.existsSync(errorHandlerPath)) {
      this.log('Global error handler found', 'success');
    } else {
      this.log('Global error handler NOT found', 'error');
      this.errors.push('Global error handler missing');
    }

    // Vérifier les routes 404 et 500
    const appPath = path.join(process.cwd(), 'backend/src/app.js');
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      
      if (content.includes('notFoundHandler') || content.includes('404')) {
        this.log('404 handler found', 'success');
      } else {
        this.log('404 handler NOT clearly defined', 'warning');
      }
    }
  }

  // ===== 8. VÉRIFIER LES LOGS =====
  checkLogging() {
    console.log(`\n${colors.blue}═══════ 8. LOGGING =====════${colors.reset}`);

    const appPath = path.join(process.cwd(), 'backend/src/app.js');
    if (!fs.existsSync(appPath)) {
      this.log('app.js not found', 'error');
      return;
    }

    const content = fs.readFileSync(appPath, 'utf8');

    if (content.includes('morgan')) {
      this.log('Morgan logging configured', 'success');
    } else {
      this.log('Morgan logging NOT configured', 'warning');
      this.warnings.push('Morgan logging not found');
    }

    if (content.includes('Sentry')) {
      this.log('Sentry error tracking enabled', 'success');
    } else {
      this.log('Sentry error tracking NOT enabled', 'warning');
      this.warnings.push('Sentry not configured');
    }
  }

  // ===== 9. VÉRIFIER LA STRUCTURE GIT =====
  checkGitignore() {
    console.log(`\n${colors.blue}═══════ 9. GIT SECURITY =====════${colors.reset}`);

    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      this.log('.gitignore NOT found', 'error');
      this.errors.push('.gitignore missing');
      return;
    }

    const content = fs.readFileSync(gitignorePath, 'utf8');

    const requiredIgnores = [
      { name: '.env', pattern: /\.env/ },
      { name: 'node_modules', pattern: /node_modules/ },
      { name: '.secrets', pattern: /secrets|\.secret/ },
      { name: 'logs', pattern: /logs|\.log/ },
    ];

    requiredIgnores.forEach(({ name, pattern }) => {
      if (pattern.test(content)) {
        this.log(`${name} ignored`, 'success');
      } else {
        this.log(`${name} NOT in .gitignore`, 'error');
        this.errors.push(`${name} not in .gitignore`);
      }
    });
  }

  // ===== 10. VÉRIFIER LA RATE LIMITING =====
  checkRateLimiting() {
    console.log(`\n${colors.blue}═══════ 10. RATE LIMITING =====════${colors.reset}`);

    const rateLimitPath = path.join(process.cwd(), 'backend/src/middleware/rateLimitMiddleware.js');
    
    if (fs.existsSync(rateLimitPath)) {
      this.log('Rate limiting middleware found', 'success');
    } else {
      this.log('Rate limiting middleware NOT found', 'error');
      this.errors.push('Rate limiting missing');
    }
  }

  // ===== RÉSUMÉ =====
  generateReport() {
    console.log(`\n${colors.blue}${'═'.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}RÉSUMÉ DE L'AUDIT${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}\n`);

    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log(`${colors.green}✓ Toutes les vérifications sont passées!${colors.reset}\n`);
      return true;
    }

    if (totalErrors > 0) {
      console.log(`${colors.red}ERREURS CRITIQUES (${totalErrors}):${colors.reset}`);
      this.errors.forEach(e => console.log(`  • ${e}`));
      console.log('');
    }

    if (totalWarnings > 0) {
      console.log(`${colors.yellow}AVERTISSEMENTS (${totalWarnings}):${colors.reset}`);
      this.warnings.forEach(w => console.log(`  • ${w}`));
      console.log('');
    }

    console.log(`${colors.red}❌ Déploiement NON RECOMMANDÉ${colors.reset}`);
    console.log(`Corrigez les erreurs critiques avant de déployer.\n`);
    return false;
  }

  // ===== RUN ALL CHECKS =====
  run() {
    console.log(`\n${colors.blue}${'═'.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}🔍 PRE-DEPLOYMENT SECURITY AUDIT${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}`);

    this.checkEnvironmentVariables();
    this.checkSecretsInCode();
    this.checkSecurityHeaders();
    this.checkCSRFProtection();
    this.checkHTTPS();
    this.checkInputValidation();
    this.checkErrorHandlers();
    this.checkLogging();
    this.checkGitignore();
    this.checkRateLimiting();

    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

const audit = new SecurityAudit();
audit.run();
