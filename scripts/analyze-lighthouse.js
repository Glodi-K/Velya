#!/usr/bin/env node
/**
 * 🔍 Analyse détaillée du rapport Lighthouse
 * Identifie les vrais problèmes de performance et accessibilité
 */

const fs = require('fs');
const path = require('path');

const reportPath = 'c:\\Dev\\Velya\\docs\\localhost_3000-20251231T035126.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🔍 ANALYSE LIGHTHOUSE DÉTAILLÉE                       ║
║                  31 Décembre 2025 - Rapport Complet                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// Analyser les catégories
const categories = report.categories;

console.log('📊 SCORES PAR CATÉGORIE:\n');

Object.entries(categories).forEach(([key, cat]) => {
  const score = (cat.score * 100).toFixed(0);
  const status = score >= 90 ? '✅' : score >= 50 ? '⚠️ ' : '❌';
  console.log(`  ${status} ${cat.title.padEnd(20)} ${score}%`);
});

console.log('\n═══════════════════════════════════════════════════════════════════════════\n');

// Analyser les métriques de performance
console.log('⏱️  MÉTRIQUES DE PERFORMANCE:\n');

const metrics = {
  'first-contentful-paint': 'FCP',
  'largest-contentful-paint': 'LCP',
  'speed-index': 'Speed Index',
  'total-blocking-time': 'Total Blocking Time',
  'cumulative-layout-shift': 'Cumulative Layout Shift',
  'interactive': 'Time to Interactive'
};

Object.entries(metrics).forEach(([id, name]) => {
  const audit = report.audits[id];
  if (audit && audit.score !== null && audit.score !== undefined) {
    const score = (audit.score * 100).toFixed(0);
    const status = score >= 80 ? '✅' : score >= 50 ? '⚠️ ' : '❌';
    const value = audit.displayValue || 'N/A';
    console.log(`  ${status} ${name.padEnd(30)} ${value.padEnd(10)} (Score: ${score}%)`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════════════════\n');

// Problèmes d'accessibilité
console.log('♿ PROBLÈMES D\'ACCESSIBILITÉ:\n');

const a11yAudits = Object.entries(report.audits).filter(([, audit]) => 
  audit.id && (
    audit.id.includes('a11y') || 
    audit.id.includes('color') || 
    audit.id.includes('aria') ||
    audit.id.includes('label') ||
    audit.id.includes('image-alt') ||
    audit.id.includes('heading') ||
    audit.id.includes('contrast')
  )
).filter(([, audit]) => audit.score !== null && audit.score !== undefined && audit.score < 1);

if (a11yAudits.length === 0) {
  console.log('  ✅ Pas de problèmes d\'accessibilité détectés\n');
} else {
  a11yAudits.forEach(([id, audit]) => {
    const failing = audit.details?.items?.length || 0;
    console.log(`  ⚠️ ${audit.title}`);
    console.log(`     Score: ${(audit.score * 100).toFixed(0)}%`);
    if (failing > 0) {
      console.log(`     Éléments problématiques: ${failing}`);
    }
    console.log();
  });
}

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Opportunités (low hanging fruit)
console.log('💡 OPPORTUNITÉS À CORRIGER (Low Hanging Fruit):\n');

const opportunities = Object.entries(report.audits)
  .filter(([, audit]) => audit.details?.type === 'opportunity' && audit.details?.items?.length > 0)
  .sort((a, b) => (b[1].details?.items?.[0]?.savings || 0) - (a[1].details?.items?.[0]?.savings || 0))
  .slice(0, 10);

opportunities.forEach(([, audit], idx) => {
  const savings = audit.details?.items?.[0]?.savings || 0;
  const items = audit.details?.items?.length || 0;
  console.log(`  ${idx + 1}. ${audit.title}`);
  console.log(`     Gain potentiel: ${(savings / 1000).toFixed(2)}s`);
  console.log(`     Éléments: ${items}`);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Diagnostiques critiques
console.log('🔴 PROBLÈMES CRITIQUES:\n');

const diagnostics = Object.entries(report.audits)
  .filter(([, audit]) => audit.details?.type === 'diagnostic' && audit.details?.items?.length > 0)
  .filter(([, audit]) => {
    // Filtrer les vrais problèmes critiques
    const items = audit.details?.items || [];
    return items.some(item => item.duration > 100 || item.transferSize > 50000 || item.wastedMs > 100);
  })
  .slice(0, 5);

if (diagnostics.length === 0) {
  console.log('  ✅ Pas de diagnostiques critiques\n');
} else {
  diagnostics.forEach(([, audit]) => {
    console.log(`  ❌ ${audit.title}`);
    console.log(`     Détails: ${audit.details?.items?.length || 0} éléments`);
    console.log();
  });
}

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Résumé des problèmes principaux
console.log('📈 ANALYSE SYNTHÉTIQUE:\n');

const perfScore = categories.performance?.score || 0;
const a11yScore = categories.accessibility?.score || 0;
const bestScore = categories['best-practices']?.score || 0;
const seoScore = categories.seo?.score || 0;

const lcpScore = report.audits['largest-contentful-paint']?.score || 0;
const tbtScore = report.audits['total-blocking-time']?.score || 0;
const clsScore = report.audits['cumulative-layout-shift']?.score || 0;

console.log(`  Performance Score:   ${(perfScore * 100).toFixed(0)}/100`);
console.log(`  Accessibility Score: ${(a11yScore * 100).toFixed(0)}/100`);
console.log(`  Best Practices:      ${(bestScore * 100).toFixed(0)}/100`);
console.log(`  SEO Score:           ${(seoScore * 100).toFixed(0)}/100\n`);

console.log(`  LCP (25% weight):    ${(lcpScore * 100).toFixed(0)}/100 ← CRITIQUE!`);
console.log(`  TBT (30% weight):    ${(tbtScore * 100).toFixed(0)}/100 ← CRITIQUE!`);
console.log(`  CLS (25% weight):    ${(clsScore * 100).toFixed(0)}/100\n`);

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Recommandations
console.log('🎯 RECOMMANDATIONS PRIORITAIRES:\n');

if (lcpScore < 0.5) {
  console.log('  1. ❌ LCP CRITIQUE (score: ' + (lcpScore * 100).toFixed(0) + '%)');
  console.log('     → Problème: Largest Contentful Paint > 2.5s');
  console.log('     → Solution: Réduire taille bundle, optimiser images, améliorer API response');
  console.log('     → Impact: +25% du score performance');
  console.log();
}

if (tbtScore < 0.5) {
  console.log('  2. ❌ TBT CRITIQUE (score: ' + (tbtScore * 100).toFixed(0) + '%)');
  console.log('     → Problème: Total Blocking Time > 300ms');
  console.log('     → Solution: Code splitting, worker threads, optimiser JS');
  console.log('     → Impact: +30% du score performance');
  console.log();
}

if (a11yScore < 0.8) {
  console.log('  3. ⚠️  ACCESSIBILITÉ FAIBLE (score: ' + (a11yScore * 100).toFixed(0) + '%)');
  console.log('     → Problèmes détectés: Voir section ♿');
  console.log('     → Impact: ' + ((1 - a11yScore) * 100).toFixed(0) + '% du score');
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════════════════\n');

console.log('💻 FICHIERS À INSPECTER:');
console.log(`
  Performance:
  • frontend/src/App.js (JavaScript bottleneck?)
  • frontend/src/AnimatedRoutes.jsx (bundle size?)
  • backend/src/app.js (API response time?)

  Accessibilité:
  • frontend/src/components/ (ARIA labels?)
  • frontend/public/index.html (heading structure?)
  • Pages principales (color contrast?)
`);

console.log('═══════════════════════════════════════════════════════════════════════════\n');
