#!/usr/bin/env node
/**
 * 🔍 Extracteur détaillé d'issues d'accessibilité du rapport Lighthouse
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../docs/localhost_3000-20251231T035126.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║             🔍 ACCESSIBILITÉ - ISSUES DÉTAILLÉES                      ║
╚════════════════════════════════════════════════════════════════════════╝
`);

// Récupérer les audits de accessibilité
const accessibilityAudits = ['color-contrast', 'heading-order', 'empty-heading', 'link-in-text-block'];

accessibilityAudits.forEach(auditId => {
  const audit = report.audits[auditId];
  
  if (!audit) return;
  
  console.log(`\n${'='.repeat(76)}`);
  console.log(`📋 AUDIT: ${audit.title} (${auditId})`);
  console.log(`${'='.repeat(76)}`);
  console.log(`Score: ${audit.score || 'N/A'}`);
  console.log(`Status: ${audit.scoreDisplayMode}`);
  
  if (audit.details && audit.details.items) {
    console.log(`\n❌ Issues trouvées: ${audit.details.items.length}`);
    
    audit.details.items.slice(0, 5).forEach((issue, idx) => {
      console.log(`\n  Issue #${idx + 1}:`);
      
      if (issue.element) {
        console.log(`    Element: ${issue.element}`);
      }
      
      if (issue.description) {
        console.log(`    Description: ${issue.description.substring(0, 100)}...`);
      }
      
      if (issue.node && issue.node.selector) {
        console.log(`    Selector: ${issue.node.selector}`);
      }
      
      if (issue.impact) {
        console.log(`    Impact: ${issue.impact}`);
      }
      
      if (issue.target) {
        console.log(`    Target: ${issue.target[0]}`);
      }
    });
  }
});

console.log(`\n${'='.repeat(76)}`);
console.log(`\n📊 RÉSUMÉ DES ISSUES:\n`);

// Détails des issues spécifiques
const colorContrastAudit = report.audits['color-contrast'];
const headingOrderAudit = report.audits['heading-order'];

if (colorContrastAudit && colorContrastAudit.details && colorContrastAudit.details.items.length > 0) {
  const first = colorContrastAudit.details.items[0];
  console.log(`1️⃣  CONTRASTE COULEUR\n`);
  console.log(`   Nombre d'éléments: ${colorContrastAudit.details.items.length}`);
  console.log(`   Élément affecté: ${first.element || first.node?.selector || 'Unknown'}`);
  if (first.description) {
    console.log(`   Description: ${first.description}`);
  }
}

if (headingOrderAudit && headingOrderAudit.details && headingOrderAudit.details.items.length > 0) {
  const first = headingOrderAudit.details.items[0];
  console.log(`\n2️⃣  HIÉRARCHIE HEADING\n`);
  console.log(`   Nombre d'éléments: ${headingOrderAudit.details.items.length}`);
  console.log(`   Élément affecté: ${first.element || first.node?.selector || 'Unknown'}`);
  if (first.description) {
    console.log(`   Description: ${first.description}`);
  }
  
  // Afficher les details spécifiques des headings
  if (first.node && first.node.explanation) {
    console.log(`   Explication: ${first.node.explanation}`);
  }
}

console.log(`\n${'='.repeat(76)}\n`);
