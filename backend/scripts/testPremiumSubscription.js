// scripts/testPremiumSubscription.js
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Fonction pour générer un token de test
const generateTestToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Configuration de l'API
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test des plans d'abonnement
const testGetPlans = async () => {
  try {
    console.log('Test: Récupération des plans d\'abonnement...');
    const response = await api.get('/premium/plans');
    console.log('✅ Plans récupérés avec succès:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des plans:', error.response?.data || error.message);
    throw error;
  }
};

// Test de vérification du statut Premium
const testCheckPremiumStatus = async (userId, role) => {
  try {
    const token = generateTestToken(userId, role);
    console.log(`Test: Vérification du statut Premium pour l'utilisateur ${userId} (${role})...`);
    
    const response = await api.get('/premium/check', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Statut Premium récupéré avec succès:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut Premium:', error.response?.data || error.message);
    throw error;
  }
};

// Exécution des tests
const runTests = async () => {
  try {
    // Test des plans d'abonnement
    await testGetPlans();
    
    // Test de vérification du statut Premium
    // Remplacez ces valeurs par des IDs valides de votre base de données
    const testUserId = '60d0fe4f5311236168a109ca'; // ID utilisateur de test
    const testUserRole = 'user'; // Rôle utilisateur de test
    
    await testCheckPremiumStatus(testUserId, testUserRole);
    
    console.log('✅ Tous les tests ont été exécutés avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  }
};

// Exécuter les tests
runTests();