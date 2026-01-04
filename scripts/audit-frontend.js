#!/usr/bin/env node

/**
 * 🌍 PRE-DEPLOYMENT FRONTEND AUDIT
 * Check: Performance, Accessibility, SEO, Compatibility
 * 
 * Usage: node audit-frontend.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class FrontendAudit {
  constructor() {
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

  // ===== 1. SEO =====
  checkSEO() {
    console.log(`\n${colors.blue}═══════ 1. SEO BASIQUE =====════${colors.reset}`);

    const appPath = path.join(process.cwd(), 'frontend/src/App.jsx');
    const htmlPath = path.join(process.cwd(), 'frontend/public/index.html');

    // Vérifier index.html
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');

      if (/<title>/i.test(content)) {
        this.log('Page title found', 'success');
      } else {
        this.log('Page title NOT found', 'error');
        this.errors.push('Missing <title> tag');
      }

      if (/<meta name="description"/i.test(content)) {
        this.log('Meta description found', 'success');
      } else {
        this.log('Meta description NOT found', 'error');
        this.errors.push('Missing meta description');
      }

      if (!content.includes('noindex')) {
        this.log('Page is indexable', 'success');
      } else {
        this.log('⚠️  Page has noindex tag', 'warning');
        this.warnings.push('Page might be hidden from search');
      }
    }

    // Vérifier sitemap et robots.txt
    const sitemapPath = path.join(process.cwd(), 'frontend/public/sitemap.xml');
    const robotsPath = path.join(process.cwd(), 'frontend/public/robots.txt');

    if (fs.existsSync(sitemapPath)) {
      this.log('sitemap.xml exists', 'success');
    } else {
      this.log('sitemap.xml NOT found', 'warning');
      this.warnings.push('No sitemap.xml');
    }

    if (fs.existsSync(robotsPath)) {
      this.log('robots.txt exists', 'success');
    } else {
      this.log('robots.txt NOT found', 'warning');
      this.warnings.push('No robots.txt');
    }
  }

  // ===== 2. ACCESSIBILITÉ =====
  checkAccessibility() {
    console.log(`\n${colors.blue}═══════ 2. ACCESSIBILITÉ =====════${colors.reset}`);

    // Liste les choses à vérifier manuellement
    this.log('Manual checks required:', 'info');
    console.log('  ✓ All images have alt text');
    console.log('  ✓ Color contrast >= 4.5:1 (normal text), 3:1 (large text)');
    console.log('  ✓ Form fields have associated labels');
    console.log('  ✓ Keyboard navigation works (Tab key)');
    console.log('  ✓ Focus indicators visible');
    console.log('  ✓ Semantic HTML (h1-h6, nav, main, etc.)');
    console.log('  ✓ No text-only "Click here" links');
    
    this.warnings.push('Accessibility requires manual testing');
  }

  // ===== 3. RESPONSIVE & MOBILE =====
  checkResponsive() {
    console.log(`\n${colors.blue}═══════ 3. RESPONSIVE DESIGN =====════${colors.reset}`);

    const appPath = path.join(process.cwd(), 'frontend/src/App.jsx');
    const cssPath = path.join(process.cwd(), 'frontend/src');

    // Vérifier que Tailwind ou autre framework responsive est utilisé
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');

      if (content.includes('className') || content.includes('responsive')) {
        this.log('Responsive classes found (Tailwind or similar)', 'success');
      } else {
        this.log('No obvious responsive framework', 'warning');
        this.warnings.push('Verify responsive design manually');
      }
    }

    // Vérifier meta viewport
    const htmlPath = path.join(process.cwd(), 'frontend/public/index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      
      if (/viewport/i.test(content)) {
        this.log('Viewport meta tag found', 'success');
      } else {
        this.log('Viewport meta tag NOT found', 'error');
        this.errors.push('Missing viewport meta tag');
      }
    }
  }

  // ===== 4. CONSOLE ERRORS =====
  checkConsoleErrors() {
    console.log(`\n${colors.blue}═══════ 4. CONSOLE ERRORS =====════${colors.reset}`);

    this.log('Manual check required:', 'warning');
    console.log(`  Run in your browser:\n`);
    console.log(`  1. Open DevTools (F12)`);
    console.log(`  2. Go to Console tab`);
    console.log(`  3. There should be NO red errors`);
    console.log(`  4. Check for warnings (yellow) - should be minimal\n`);

    this.warnings.push('Console errors require manual testing');
  }

  // ===== 5. IMAGES & ASSETS =====
  checkAssets() {
    console.log(`\n${colors.blue}═══════ 5. IMAGES & ASSETS =====════${colors.reset}`);

    const publicPath = path.join(process.cwd(), 'frontend/public');
    
    if (!fs.existsSync(publicPath)) {
      this.log('Public folder NOT found', 'error');
      return;
    }

    const files = fs.readdirSync(publicPath);

    // Chercher les images non compressées
    const largeImages = files.filter(f => {
      const fullPath = path.join(publicPath, f);
      const stats = fs.statSync(fullPath);
      return (f.match(/\.(png|jpg|jpeg)$/i) && stats.size > 1000000); // > 1MB
    });

    if (largeImages.length === 0) {
      this.log('No oversized images detected', 'success');
    } else {
      this.log(`${largeImages.length} images > 1MB found`, 'warning');
      largeImages.forEach(img => {
        this.warnings.push(`Large image: ${img}`);
      });
    }

    // Vérifier les formats modernes (WebP, AVIF)
    const hasModernFormats = files.some(f => f.match(/\.(webp|avif)$/i));
    if (hasModernFormats) {
      this.log('Modern image formats (WebP/AVIF) found', 'success');
    } else {
      this.log('Consider using WebP/AVIF for better compression', 'warning');
      this.warnings.push('No modern image formats detected');
    }
  }

  // ===== 6. DEPENDENCIES =====
  checkDependencies() {
    console.log(`\n${colors.blue}═══════ 6. DEPENDENCIES & BUNDLES =====════${colors.reset}`);

    const packagePath = path.join(process.cwd(), 'frontend/package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.log('package.json NOT found', 'error');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = Object.keys(packageJson.dependencies || {});

    if (deps.length > 50) {
      this.log(`⚠️  Many dependencies (${deps.length})`, 'warning');
      this.warnings.push('Consider reducing bundle size');
    } else {
      this.log(`${deps.length} dependencies`, 'success');
    }

    // Vérifier les packages suspects
    const suspiciousPackages = deps.filter(d => 
      d.includes('debug') || d.includes('test') || d.includes('dev')
    );

    if (suspiciousPackages.length > 0) {
      this.log(`⚠️  Possible dev dependencies in production: ${suspiciousPackages.join(', ')}`, 'warning');
    }
  }

  // ===== 7. BUILD OUTPUT =====
  checkBuildOutput() {
    console.log(`\n${colors.blue}═══════ 7. BUILD OUTPUT =====════${colors.reset}`);

    const buildPath = path.join(process.cwd(), 'frontend/build');

    if (fs.existsSync(buildPath)) {
      this.log('Build folder exists', 'success');

      // Vérifier la taille du bundle
      const getSize = (dir) => {
        let size = 0;
        const files = fs.readdirSync(dir);
        
        files.forEach(f => {
          const path_ = path.join(dir, f);
          const stats = fs.statSync(path_);
          if (stats.isFile()) {
            size += stats.size;
          }
        });

        return size;
      };

      const buildSize = getSize(buildPath);
      const sizeMB = (buildSize / 1024 / 1024).toFixed(2);

      if (buildSize < 500 * 1024) {
        this.log(`Build size: ${sizeMB}MB (good)`, 'success');
      } else if (buildSize < 1000 * 1024) {
        this.log(`Build size: ${sizeMB}MB (acceptable)`, 'info');
      } else {
        this.log(`Build size: ${sizeMB}MB (consider optimizing)`, 'warning');
        this.warnings.push(`Large build size: ${sizeMB}MB`);
      }
    } else {
      this.log('Build folder NOT found (run npm run build)', 'warning');
      this.warnings.push('No production build');
    }
  }

  // ===== 8. LIGHTHOUSE CHECKS =====
  checkLighthouse() {
    console.log(`\n${colors.blue}═══════ 8. LIGHTHOUSE SCORES =====════${colors.reset}`);

    this.log('Manual check required:', 'warning');
    console.log(`\n  Using Chrome DevTools Lighthouse:\n`);
    console.log(`  1. Open DevTools (F12)`);
    console.log(`  2. Lighthouse tab`);
    console.log(`  3. Generate report`);
    console.log(`  4. Targets:\n`);
    console.log(`     - Performance: >= 80`);
    console.log(`     - Accessibility: >= 90`);
    console.log(`     - Best Practices: >= 90`);
    console.log(`     - SEO: >= 90`);

    this.warnings.push('Lighthouse scores require manual testing');
  }

  // ===== 9. 404/500 PAGES =====
  check404500Pages() {
    console.log(`\n${colors.blue}═══════ 9. ERROR PAGES =====════${colors.reset}`);

    // Vérifier qu'il y a des pages d'erreur
    const srcPath = path.join(process.cwd(), 'frontend/src');
    const files = fs.readdirSync(srcPath, { recursive: true });

    const has404 = files.some(f => 
      f.toLowerCase().includes('404') || f.toLowerCase().includes('notfound')
    );

    const has500 = files.some(f =>
      f.toLowerCase().includes('500') || f.toLowerCase().includes('error')
    );

    if (has404) {
      this.log('404 page found', 'success');
    } else {
      this.log('404 page NOT found', 'warning');
      this.warnings.push('No custom 404 page');
    }

    if (has500) {
      this.log('500 error page found', 'success');
    } else {
      this.log('500 error page NOT found', 'warning');
      this.warnings.push('No custom 500 page');
    }
  }

  // ===== 10. LOREM IPSUM =====
  checkPlaceholder() {
    console.log(`\n${colors.blue}═══════ 10. PLACEHOLDER TEXT =====════${colors.reset}`);

    const srcPath = path.join(process.cwd(), 'frontend/src');
    const files = fs.readdirSync(srcPath, { recursive: true })
      .filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

    let hasPlaceholder = false;

    files.forEach(file => {
      const fullPath = path.join(srcPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');

      if (/lorem|ipsum|dummy|test|foo|bar/i.test(content)) {
        this.log(`⚠️  Placeholder text in ${file}`, 'warning');
        hasPlaceholder = true;
        this.warnings.push(`Placeholder in ${file}`);
      }
    });

    if (!hasPlaceholder) {
      this.log('No placeholder text found', 'success');
    }
  }

  // ===== REPORT =====
  generateReport() {
    console.log(`\n${colors.blue}${'═'.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}RÉSUMÉ FRONTEND${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}\n`);

    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;

    if (totalErrors > 0) {
      console.log(`${colors.red}ERREURS CRITIQUES (${totalErrors}):${colors.reset}`);
      this.errors.forEach(e => console.log(`  • ${e}`));
      console.log('');
    }

    if (totalWarnings > 0) {
      console.log(`${colors.yellow}AVERTISSEMENTS (${totalWarnings}):${colors.reset}`);
      const unique = [...new Set(this.warnings)];
      unique.forEach(w => console.log(`  • ${w}`));
      console.log('');
    }

    if (totalErrors === 0) {
      console.log(`${colors.green}✓ No critical errors${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}❌ Fix errors before deployment${colors.reset}\n`);
      return false;
    }
  }

  run() {
    console.log(`\n${colors.blue}${'═'.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}🌍 PRE-DEPLOYMENT FRONTEND AUDIT${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}`);

    this.checkSEO();
    this.checkAccessibility();
    this.checkResponsive();
    this.checkConsoleErrors();
    this.checkAssets();
    this.checkDependencies();
    this.checkBuildOutput();
    this.checkLighthouse();
    this.check404500Pages();
    this.checkPlaceholder();

    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

const audit = new FrontendAudit();
audit.run();
