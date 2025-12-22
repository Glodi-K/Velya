#!/usr/bin/env node

/**
 * Script de test pour le système d'inscription avec vérification par code
 * Usage: node test-signup-code.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSignupFlow() {
  logSection('🧪 Test d\'Inscription avec Vérification par Code');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';
  let verificationCode = '';

  try {
    // === ÉTAPE 1: Envoyer le code ===
    logSection('1️⃣ ÉTAPE 1: Envoi du code de vérification');
    
    log(`Email de test: ${testEmail}`, 'blue');
    
    const step1Response = await axios.post(`${API_URL}/signup-step1`, {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      role: 'client',
    });

    if (step1Response.data.success) {
      log('✓ Code envoyé avec succès !', 'green');
      log(`Message: ${step1Response.data.message}`, 'green');
      log(`Email retourné: ${step1Response.data.email}`, 'yellow');
    } else {
      throw new Error('Étape 1 échouée');
    }

    // === Attendre et afficher instructions ===
    logSection('📧 Instructions Manuelles Requises');
    log('⚠️  IMPORTANT: Vous devez effectuer cette partie manuellement :', 'yellow');
    log('   1. Accédez à Mailgun ou votre client email', 'yellow');
    log(`   2. Cherchez l'email reçu par ${testEmail}`, 'yellow');
    log('   3. Copiez le code de vérification à 5 chiffres', 'yellow');
    log('   4. Exécutez le script avec: node test-signup-code.js [CODE]', 'yellow');
    log('', 'yellow');

    // Récupérer le code en ligne de commande
    const args = process.argv.slice(2);
    if (args.length === 0) {
      log('Attendez... (pas de code fourni en argument)', 'yellow');
      log(`Pour continuer: node test-signup-code.js 12345`, 'yellow');
      process.exit(0);
    }

    verificationCode = args[0];
    if (!/^\d{5}$/.test(verificationCode)) {
      throw new Error('Code invalide: doit être exactement 5 chiffres');
    }

    log(`Code fourni: ${verificationCode}`, 'blue');

    // === ÉTAPE 2: Vérifier le code ===
    logSection('2️⃣ ÉTAPE 2: Vérification du code');

    const step2Response = await axios.post(`${API_URL}/signup-step2`, {
      email: testEmail,
      verificationCode: verificationCode,
    });

    if (step2Response.data.success) {
      log('✓ Code vérifié avec succès !', 'green');
      log(`Message: ${step2Response.data.message}`, 'green');
      
      // Afficher les informations utilisateur
      logSection('👤 Informations Utilisateur');
      log(`ID: ${step2Response.data.user.id}`, 'blue');
      log(`Nom: ${step2Response.data.user.name}`, 'blue');
      log(`Email: ${step2Response.data.user.email}`, 'blue');
      log(`Rôle: ${step2Response.data.user.role}`, 'blue');
      log(`Email Vérifié: ${step2Response.data.user.emailVerified}`, 'blue');

      // Afficher le token
      logSection('🔐 Token JWT');
      log(`Token (premiers 50 caractères): ${step2Response.data.token.substring(0, 50)}...`, 'blue');

      // === Afficher le résumé ===
      logSection('✅ TEST RÉUSSI !');
      log('L\'inscription complète avec vérification par code fonctionne correctement.', 'green');

      // Afficher la structure de réponse
      logSection('📊 Structure de Réponse');
      console.log(JSON.stringify(step2Response.data, null, 2));

    } else {
      throw new Error('Étape 2 échouée');
    }

  } catch (error) {
    logSection('❌ ERREUR');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data.message || error.message}`, 'red');
      log(`Détails complets:`, 'red');
      console.log(error.response.data);
    } else {
      log(`Erreur: ${error.message}`, 'red');
    }
    process.exit(1);
  }
}

// === Tests Unitaires ===
async function testValidations() {
  logSection('🔍 Tests de Validations');

  const tests = [
    {
      name: 'Email déjà utilisé',
      endpoint: '/signup-step1',
      data: {
        name: 'Test',
        email: 'admin@test.com', // Email existant
        password: 'Test123456',
        role: 'client',
      },
      shouldFail: true,
    },
    {
      name: 'Mot de passe trop court',
      endpoint: '/signup-step1',
      data: {
        name: 'Test',
        email: `test-${Date.now()}@example.com`,
        password: 'abc', // < 6 caractères
        role: 'client',
      },
      shouldFail: true,
    },
    {
      name: 'Champs manquants',
      endpoint: '/signup-step1',
      data: {
        name: 'Test',
        email: `test-${Date.now()}@example.com`,
        // password manquant
        role: 'client',
      },
      shouldFail: true,
    },
  ];

  for (const test of tests) {
    try {
      const response = await axios.post(`${API_URL}${test.endpoint}`, test.data);
      
      if (test.shouldFail) {
        log(`❌ ${test.name}: Devrait échouer mais a réussi`, 'red');
      } else {
        log(`✓ ${test.name}: Succès`, 'green');
      }
    } catch (error) {
      if (test.shouldFail) {
        log(`✓ ${test.name}: Erreur attendue - ${error.response?.data?.message}`, 'green');
      } else {
        log(`❌ ${test.name}: Erreur inattendue - ${error.message}`, 'red');
      }
    }
  }
}

// === Afficher l'utilisation ===
function showUsage() {
  logSection('ℹ️  Utilisation du Script de Test');
  log(`
node test-signup-code.js                    # Étape 1 uniquement (envoie le code)
node test-signup-code.js [CODE]             # Complet (les 2 étapes)

Exemple:
  node test-signup-code.js 12345            # Vérifie avec le code 12345

Le script va:
  1. Envoyer un code de vérification par email
  2. Afficher les instructions pour recevoir le code
  3. Vérifier le code fourni en argument
  4. Créer l'utilisateur
  5. Afficher le JWT token reçu
  `, 'cyan');
}

// === Programme Principal ===
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }

  if (args.includes('--validate')) {
    await testValidations();
    return;
  }

  await testSignupFlow();
}

main().catch(error => {
  log(`Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});
