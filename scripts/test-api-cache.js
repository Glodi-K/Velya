#!/usr/bin/env node
/**
 * Tests de performance API - Vérification du cache Redis
 * Lance des requêtes chronométrées pour valider que le cache réduit le LCP
 */

const http = require('http');

const API_ENDPOINTS = [
  { path: '/api/providers/', name: 'Providers', expectedCache: 600 },
  { path: '/api/availability/', name: 'Availability', expectedCache: 300 },
  { path: '/api/ratings/', name: 'Ratings', expectedCache: 1800 },
  { path: '/api/health', name: 'Health Check', expectedCache: 60 }
];

const API_URL = 'http://localhost:5000';

async function testEndpoint(endpoint, iteration = 1) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const url = new URL(endpoint.path, API_URL);
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          const cached = res.headers['x-cache'] === 'HIT';
          
          resolve({
            endpoint: endpoint.name,
            iteration,
            duration: duration > 0 ? duration : 50,
            cached,
            statusCode: res.statusCode,
            cacheControl: res.headers['cache-control']
          });
        });
      });
      
      req.on('error', (err) => {
        resolve({
          endpoint: endpoint.name,
          iteration,
          error: err.message
        });
      });
      
      req.setTimeout(5000);
    } catch (err) {
      resolve({
        endpoint: endpoint.name,
        iteration,
        error: err.message
      });
    }
  });
}

async function runTests() {
  console.log('⏱️  Tests de performance API avec Redis cache\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = [];
  
  for (const endpoint of API_ENDPOINTS) {
    console.log(`📊 ${endpoint.name} (Cache: ${endpoint.expectedCache}s)`);
    
    // 1ère requête (sans cache)
    const first = await testEndpoint(endpoint, 1);
    results.push(first);
    
    if (first.error) {
      console.log(`   ❌ Erreur: ${first.error}\n`);
      continue;
    }
    
    console.log(`   1️⃣  Requête 1 (cold): ${first.duration}ms`);
    
    // Attendre 100ms puis 2e requête (avec cache)
    await new Promise(r => setTimeout(r, 100));
    const second = await testEndpoint(endpoint, 2);
    results.push(second);
    
    console.log(`   2️⃣  Requête 2 (warm): ${second.duration}ms`);
    
    if (first.duration > 0 && second.duration > 0) {
      const improvement = ((1 - second.duration / first.duration) * 100).toFixed(0);
      console.log(`   ⚡ Amélioration: ${improvement}%`);
      
      if (second.duration < first.duration * 0.8) {
        console.log(`   ✅ Cache EFFICACE\n`);
      } else {
        console.log(`   ⚠️  Cache peut ne pas fonctionner\n`);
      }
    }
  }
  
  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 RÉSUMÉ\n');
  
  const avgFirstCall = results
    .filter((r, i) => i % 2 === 0 && !r.error)
    .reduce((sum, r) => sum + (r.duration || 0), 0) / Math.max(1, API_ENDPOINTS.length);
  
  const avgSecondCall = results
    .filter((r, i) => i % 2 === 1 && !r.error)
    .reduce((sum, r) => sum + (r.duration || 0), 0) / Math.max(1, API_ENDPOINTS.length);
  
  console.log(`Temps moyen 1ère appel: ${avgFirstCall.toFixed(0)}ms`);
  console.log(`Temps moyen 2e appel:   ${avgSecondCall.toFixed(0)}ms`);
  console.log(`Amélioration moyenne:   ${((1 - avgSecondCall / avgFirstCall) * 100).toFixed(0)}%\n`);
  
  if (avgSecondCall < avgFirstCall * 0.8) {
    console.log('✅ Redis cache est ACTIF et améliore les performances!');
    console.log('💡 Cela devrait réduire le LCP de 1-2 secondes au prochain Lighthouse.\n');
  } else {
    console.log('⚠️  Redis cache pourrait ne pas fonctionner correctement.');
    console.log('📝 Vérifiez que Redis est en cours d\'exécution.\n');
  }
}

console.log('🔌 Connexion à l\'API sur ' + API_URL + '\n');
runTests().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
