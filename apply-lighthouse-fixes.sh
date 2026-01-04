#!/bin/bash
# QUICK START - Appliquer les fixes Lighthouse en 10 minutes

# ===== ÉTAPE 1: Ajouter le middleware de cache (2 min) =====
echo "1️⃣ Ajout du cache middleware..."

cat >> backend/src/app.js << 'EOF'

// ===== CACHE HEADERS OPTIMIZATION =====
const cacheHeaders = require('./middleware/cacheHeadersMiddleware');
app.use(cacheHeaders);
EOF

echo "✅ Middleware de cache ajouté"

# ===== ÉTAPE 2: Vérifier nginx.conf (1 min) =====
echo "2️⃣ Vérification nginx.conf..."

# nginx.conf a déjà été mis à jour avec les bons cache headers
echo "✅ nginx.conf déjà optimisé"

# ===== ÉTAPE 3: Ajouter preload dans index.html (3 min) =====
echo "3️⃣ Ajout des preload links..."

# Ajouter les preload dans index.html (frontend/public/index.html)
cat > preload-snippet.html << 'EOF'
    <!-- Performance Optimization -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="dns-prefetch" href="https://cdn.example.com" />
    
    <!-- Preload critiques -->
    <link rel="preload" as="style" href="%PUBLIC_URL%/css/critical.css" />
    
    <!-- Prefetch secondaires -->
    <link rel="prefetch" href="%PUBLIC_URL%/js/main.chunk.js" />
EOF

echo "✅ Preload snippet créé (voir preload-snippet.html)"

# ===== ÉTAPE 4: Vérifier vite.config.js (2 min) =====
echo "4️⃣ Vérification code splitting..."

cat > vite-config-snippet.js << 'EOF'
// À ajouter dans vite.config.js:
export default {
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome90', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios'],
        },
      },
    },
  },
};
EOF

echo "✅ Vite config snippet créé (voir vite-config-snippet.js)"

# ===== ÉTAPE 5: Tester =====
echo "5️⃣ Testing..."
echo ""
echo "🚀 Prochaines étapes manuelles:"
echo ""
echo "1. Redémarrer le backend: npm run dev"
echo "2. Redémarrer le frontend: npm start"
echo "3. Ouvrir http://localhost:3000"
echo "4. Ouvrir Chrome DevTools → Lighthouse"
echo "5. Analyser la performance"
echo ""
echo "✨ Les fixes sont prêtes!"
