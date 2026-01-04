# ✅ PRE-DEPLOYMENT CHECKLIST - COMPLET & SANS PITIÉ

> **Règle d'or:** Si une case n'est pas cochée, le site ne déploie PAS.

---

## 🔒 SÉCURITÉ (Non-Négociable)

### HTTPS/TLS
- [ ] Certificat SSL valide obtenu (Let's Encrypt ou autre CA de confiance)
- [ ] `USE_HTTPS=true` dans `.env` production
- [ ] Redirection HTTP → HTTPS automatique (port 80 → 443)
- [ ] Certificat n'expire pas dans les 90 jours
- [ ] Test SSL Labs: score A ou mieux
- [ ] Pas de contenu mixte (HTTP dans page HTTPS)
- [ ] HSTS header: `max-age=31536000; includeSubDomains; preload`

### Secrets & Variables
- [ ] `.env` JAMAIS commité dans Git
- [ ] `.gitignore` contient `.env`, `node_modules`, `ssl/*`, `logs/*`
- [ ] Tous les secrets dans variables d'environnement
- [ ] `JWT_SECRET` min 32 caractères aléatoires
- [ ] `SESSION_SECRET` min 32 caractères aléatoires
- [ ] `MONGO_URI` avec authentification forte (pas d'user par défaut)
- [ ] Stripe keys: `sk_live_*` (PAS `sk_test_*`)
- [ ] Google OAuth credentials configurés pour domaine production
- [ ] API keys pas en dur dans le code (grep pour vérifier)

### Headers de Sécurité
- [ ] Helmet.js configuré avec CSP
- [ ] HSTS activé (min 6 mois, idéalement 1 an)
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### Validation & Injection
- [ ] Tous les inputs validés côté backend (Joi)
- [ ] Aucune requête SQL constructible (utiliser paramètres MongoDB)
- [ ] XSS protection: pas d'eval(), innerHTML direct, etc.
- [ ] CSRF tokens actifs sur toutes les actions POST/PUT/DELETE
- [ ] Rate limiting: login (5 tentatives/15min), API générale (100/15min)
- [ ] Password strength: min 8 chars, majuscule, minuscule, chiffre

### Authentification
- [ ] JWT expiration: max 24h
- [ ] Refresh tokens utilisés
- [ ] Passwords hashés (bcrypt, min 10 rounds)
- [ ] Sessions côté serveur invalidées à logout
- [ ] 2FA implémenté pour admin (optionnel mais recommandé)

### Logs & Monitoring
- [ ] Morgan logging en place (requêtes HTTP)
- [ ] Sentry DSN configuré et actif
- [ ] Erreurs critiques alertées (email ou Slack)
- [ ] Pas de console.log en production
- [ ] Logs contiennent: timestamp, level, message, contexte
- [ ] Logs pas accessibles publiquement

---

## ⚠️ ERREURS & GESTION DES BUGS

### Backend
- [ ] Global error handler en place
- [ ] Aucune erreur ne crash le serveur
- [ ] Erreurs ne révèlent PAS de détails sensibles au client
- [ ] 404: route non trouvée → JSON propre
- [ ] 500: erreur serveur → JSON standardisé
- [ ] Timeout configuré (30s API, 5s client)
- [ ] Pas de "undefined" ou "null" dans les réponses

### Frontend
- [ ] Zéro erreur en console (F12 → Console)
- [ ] Warnings minimaux (idéalement zéro)
- [ ] Error Boundary en place (React)
- [ ] Try-catch sur async/await
- [ ] Fallback UI pour erreurs réseau
- [ ] 404 page custom & jolie
- [ ] 500 page custom & informative
- [ ] Pas de "Lorem ipsum" ou texte test
- [ ] Messages d'erreur utilisateur-friendly

---

## 📱 COMPATIBILITÉ

### Navigateurs Desktop
- [ ] Chrome (stable)
- [ ] Firefox (stable)
- [ ] Edge (latest)
- [ ] Safari (latest)

### Mobile
- [ ] iOS Safari (iPhone/iPad)
- [ ] Chrome Android
- [ ] Samsung Internet

### Responsive
- [ ] Mobile (320px - 480px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1200px+)
- [ ] Viewport meta tag présent
- [ ] Aucun scroll horizontal sur mobile

### Interactions
- [ ] Boutons cliquables au doigt (min 48px)
- [ ] Inputs tactiles fonctionnels
- [ ] Pas d'hover sur mobile (utiliser active/focus)
- [ ] Orientation portrait et landscape

---

## ♿ ACCESSIBILITÉ

### Visuels
- [ ] Contrastes WCAG AA (4.5:1 normal, 3:1 grand texte)
- [ ] Pas de couleur seule pour indiquer info
- [ ] Pas de clignotement (< 3 Hz)
- [ ] Zoom jusqu'à 200% fonctionne

### Structure
- [ ] Une seule `<h1>` par page
- [ ] Hiérarchie h1 → h2 → h3 (pas sauter de niveau)
- [ ] Listes avec `<ul>/<ol>/<dl>`
- [ ] Navigation sémantique (`<nav>`)
- [ ] Main content dans `<main>`

### Formulaires
- [ ] Chaque input a un label associé
- [ ] Placeholder ≠ label
- [ ] Error messages visibles et clairs
- [ ] Required fields signalés (astérisque + texte)
- [ ] Focus visible sur tous les inputs

### Images
- [ ] Alt text pertinent (pas vide ni "image")
- [ ] Decorative images: alt=""
- [ ] SVG avec title/description si contenu

### Navigation Clavier
- [ ] Tab order logique
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Aucun élément bloqué au Tab
- [ ] Modals fermables (Escape)
- [ ] Shortcuts documentés (?)

---

## 🔍 SEO BASIQUE

### Pages
- [ ] Balise `<title>` unique par page (30-60 chars)
- [ ] Meta description unique (120-160 chars)
- [ ] Pas de noindex oublié
- [ ] Canonical tags si contenu dupliqué

### Structure
- [ ] Une seule h1 par page
- [ ] Structure HTML propre et sémantique
- [ ] URLs propres et stables (pas ?v=123)
- [ ] Breadcrumbs si pertinent

### Indexation
- [ ] `robots.txt` présent et correct
- [ ] `sitemap.xml` généré et listé dans robots.txt
- [ ] Google Search Console: 0 erreurs
- [ ] Pas de redirect chaînes (301 > 301 > 301)

### Contenu
- [ ] Pas de texte "test" ou "Lorem ipsum"
- [ ] Descriptions produits/services complètes
- [ ] Images compressées et avec src/sizes optimisés

---

## ⚡ PERFORMANCE

### JavaScript
- [ ] Pas de blocking JS au chargement initial
- [ ] Code-splitting: lazy load les routes
- [ ] Tree-shaking activé
- [ ] Minification + compression en prod

### Images
- [ ] Tous les formats modernes: WebP, AVIF
- [ ] Lazy loading (`loading="lazy"`)
- [ ] srcset pour responsive images
- [ ] Compression: 80% réduction vs original
- [ ] Aucune image > 1MB
- [ ] Pas de image de 4000px de large pour affichage 400px

### CSS
- [ ] Pas de CSS critiques en @import
- [ ] Tailwind/CSS purifiée (unused CSS removed)
- [ ] Media queries appropriées

### Réseau
- [ ] Cache HTTP: static (1 an), assets (1 mois), API (5 min)
- [ ] Compression Gzip/Brotli activée
- [ ] CDN pour assets statiques (optionnel mais recommandé)

### Lighthouse (Dev Tools)
- [ ] Performance: >= 80
- [ ] Accessibility: >= 90
- [ ] Best Practices: >= 90
- [ ] SEO: >= 90

### Tests Réels
- [ ] Chargement sur 3G simulée < 5s
- [ ] FCP (First Contentful Paint) < 1.8s
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1

---

## ⚙️ CONFIGURATION SERVEUR

### Variables d'Environnement
- [ ] Fichier .env.production créé et sécurisé
- [ ] NODE_ENV=production
- [ ] Toutes les clés nécessaires présentes
- [ ] Aucune valeur par défaut dangereuse
- [ ] Sensibles: min 32 caractères aléatoires

### Base de Données
- [ ] MongoDB authenticité required
- [ ] Connection pooling activé
- [ ] Indexes créés sur requêtes fréquentes
- [ ] Backups automatiques (quotidien minimum)
- [ ] Restore test réussi (important!)
- [ ] Timeout appropriés (30s connection)

### Redis (si utilisé)
- [ ] Redis accessible et sécurisé
- [ ] Password configuré
- [ ] TTL par défaut défini
- [ ] Monitoring en place

### Serveur HTTP
- [ ] Keep-alive activé
- [ ] Timeout: 30s read, 30s write
- [ ] Max request size limité (10MB)
- [ ] Max connexions configuré
- [ ] Pas de debug mode en prod

### Proxy/Reverse Proxy
- [ ] Nginx/Apache correctement configuré
- [ ] Headers X-Real-IP/X-Forwarded-For passés
- [ ] SSL/TLS au proxy level
- [ ] Caching headers respectés

---

## 📊 MONITORING & ALERTES

### Uptime
- [ ] Monitoring activé (Uptime Robot, DataDog, etc.)
- [ ] Alertes en cas de downtime
- [ ] Response time tracked

### Logs
- [ ] Logs centralisés (ELK Stack, CloudWatch, etc.)
- [ ] Alertes sur erreurs critiques
- [ ] Logs archivés (min 30 jours)

### Performance
- [ ] Temps réponse API en dessous de 500ms (p95)
- [ ] Erreur rate < 1%
- [ ] Mémoire serveur < 80% utilisation
- [ ] CPU < 80% utilisation

---

## 🚀 UX BASIQUE (Souvent Ignorée)

- [ ] Pas de lien mort
- [ ] Boutons sont clairement des boutons (style, feedback)
- [ ] Formulaires indiquent les erreurs (rouge + message)
- [ ] Actions donnent du feedback (loading spinner, confirmation)
- [ ] Pas de timeout silencieux (message affiché)
- [ ] Connexion au réseau perdue: message d'erreur
- [ ] Typos corrigés
- [ ] Grammaire/orthographe vérifiée
- [ ] Pas de placeholder en tant que label
- [ ] Bouton "Annuler" toujours disponible
- [ ] Formulaires pré-remplissent sur correction d'erreur
- [ ] Notifications claires (succès en vert, erreur en rouge)

---

## 🏭 DÉPLOIEMENT

### Avant Go-Live
- [ ] Code review complète
- [ ] Tests en environment "staging" identique à prod
- [ ] Rollback plan documenté
- [ ] Healthcheck endpoint opérationnel
- [ ] Monitoring alertes testées

### Déploiement
- [ ] Backup de base de données avant
- [ ] Deployment script testé (run 2x minimum)
- [ ] Migrations DB testées et reversibles
- [ ] Documentation du déploiement mise à jour
- [ ] Team contactable en cas de problème

### Post-Déploiement
- [ ] Smoke tests réussis (happy path)
- [ ] Logs monitoring pour erreurs
- [ ] Performance monitoring actif
- [ ] Vérification HTTPS/redirects
- [ ] Google Search Console: no crawl errors

---

## 📋 SCRIPT DE VÉRIFICATION

Avant de déployer, lancer:

```bash
# Vérification sécurité
node scripts/audit-security.js

# Vérification frontend
node scripts/audit-frontend.js

# Tests (si disponibles)
npm run test
npm run test:e2e

# Vérifier aucun erreur de build
npm run build
```

---

## 🎯 RÉSUMÉ (30 SECONDES)

| Aspect | Check |
|--------|-------|
| **HTTPS** | Certificat valide, pas de contenu mixte |
| **Secrets** | .env ignoré, clés en variables seulement |
| **Erreurs** | 0 console errors, pages 404/500 propres |
| **Mobile** | Responsive, tactile, iOS + Android |
| **Accessibilité** | Contrastes OK, navigation clavier, labels |
| **SEO** | Title/meta uniques, pas noindex, sitemap |
| **Performance** | Lighthouse 80+, images optimisées, < 3s chargement |
| **Backend** | Logs actifs, Sentry, timeout configurés |
| **UX** | Pas de lien mort, erreurs claires, feedback |

---

## ⚠️ SI VOUS DEVEZ CHOISIR

**Priorité absolue:**
1. HTTPS + certificat valide
2. Aucun secret exposé
3. 0 console error
4. Mobile responsive
5. Formulaires sécurisés (validation)

**Si jamais:** Tout le reste est bonus.

---

**Signé:** Code Review Sans Pitié™
