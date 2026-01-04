# 🔒 HTTPS/TLS & CSRF - Guide d'Implémentation

## ✅ Qu'est-ce qui a été ajouté

### 1. **HTTPS/TLS Support en Backend**

Fichier modifié: `backend/server.js`

```javascript
// Support automatique de HTTPS si les certificats existent
if (useHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(httpsOptions, app);
  console.log('✅ HTTPS activé');
}

// En production: redirection automatique HTTP → HTTPS
if (useHttps && process.env.NODE_ENV === 'production') {
  const httpServer = http.createServer((req, res) => {
    res.writeHead(301, { Location: 'https://' + req.headers.host + req.url });
    res.end();
  });
  httpServer.listen(80);
}
```

**Variables d'environnement pour HTTPS:**
```env
USE_HTTPS=true              # Activer HTTPS
NODE_ENV=production         # Activer la redirection HTTP → HTTPS
SSL_CERT_PATH=./ssl/velya.ca/fullchain.pem
SSL_KEY_PATH=./ssl/velya.ca/privkey.pem
```

### 2. **CSRF Protection Complète**

**Fichiers créés:**
- `backend/src/middleware/csrfMiddleware.js` - Middleware CSRF
- `frontend/src/services/csrfService.js` - Service CSRF pour React

**Dans app.js:**
- Session configurée (requise pour CSRF)
- Cookie parser ajouté
- Protection CSRF activée automatiquement
- Endpoint `/api/csrf-token` pour obtenir les tokens
- Headers CORS mis à jour avec X-CSRF-Token

**Packages ajoutés:**
- `cookie-parser` - Parser les cookies
- `express-session` - Gestion des sessions
- `express-csurf` - Protection CSRF
- (déjà présent: `express-session`)

---

## 🚀 Configuration Rapide

### Backend

#### Étape 1: Installer les packages
```bash
cd backend
npm install cookie-parser express-session express-csurf
```

#### Étape 2: Ajouter les variables .env
```env
# HTTPS
USE_HTTPS=true
SSL_CERT_PATH=./ssl/velya.ca/fullchain.pem
SSL_KEY_PATH=./ssl/velya.ca/privkey.pem

# CSRF
SESSION_SECRET=votre-secret-session-tres-long-et-aléatoire
CSRF_SECRET=votre-secret-csrf-tres-long-et-aléatoire
```

#### Étape 3: Générer les certificats SSL (optionnel pour dev)

**Avec OpenSSL (Windows, Mac, Linux):**
```bash
# Créer le répertoire
mkdir -p ssl/velya.ca

# Générer un certificat auto-signé (développement SEULEMENT)
openssl req -x509 -newkey rsa:4096 -keyout ssl/velya.ca/privkey.pem -out ssl/velya.ca/fullchain.pem -days 365 -nodes
```

**Ou utiliser certbot (recommandé pour production):**
```bash
certbot certonly --standalone -d api.velya.ca
# Copier les certificats:
cp /etc/letsencrypt/live/api.velya.ca/fullchain.pem ./ssl/velya.ca/
cp /etc/letsencrypt/live/api.velya.ca/privkey.pem ./ssl/velya.ca/
```

#### Étape 4: Tester en local
```bash
npm run dev
# Backend devrait démarrer avec ✅ HTTPS activé
# Ou ⚠️ Certificats SSL non trouvés, utilisant HTTP (si pas de certificats)
```

---

### Frontend

#### Étape 1: Importer le service CSRF
```javascript
// Dans App.jsx ou main App component
import { useCSRFToken } from './services/csrfService';

export function App() {
  // Initialiser le token CSRF au montage
  useCSRFToken();
  
  return <YourApp />;
}
```

#### Étape 2: Utiliser fetchWithCSRF pour les requêtes
```javascript
import { fetchWithCSRF } from './services/csrfService';

// Exemple: login
async function handleLogin(email, password) {
  const response = await fetchWithCSRF('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return data;
}
```

#### Étape 3: Si vous utilisez Axios
```javascript
// Voir le service csrfService.js pour la configuration Axios complète
// Les interceptors gèrent automatiquement le token CSRF
```

---

## 🔐 Comment ça Fonctionne

### CSRF (Cross-Site Request Forgery)

**Le problème:**
```
1. Attaquant crée un site malveillant
2. Utilisateur se connecte à votre app
3. Utilisateur visite le site malveillant
4. Le site malveillant envoie une requête à votre API
5. La requête est exécutée car l'utilisateur est déjà loggé
```

**La solution (Double Submit Cookie):**
```
1. Client obtient un token CSRF de l'API (/api/csrf-token)
2. Token stocké dans un cookie HTTP-only
3. Token aussi envoyé dans le header X-CSRF-Token
4. Pour chaque requête POST/PUT/DELETE:
   - Serveur vérifie que le token est présent
   - Serveur vérifie que le token est valide
   - Attaquant ne peut pas accéder au token (HTTP-only cookie)
```

### HTTPS/TLS

**Le problème:**
```
Les requêtes HTTP sont en clair (lisibles par n'importe qui en MITM)
```

**La solution:**
```
HTTPS chiffre toutes les communications
- Certificat signé par une CA de confiance
- Redirection automatique HTTP → HTTPS
- Headers HSTS forcent HTTPS
```

---

## 📋 Checklist de Configuration

### Avant Déploiement

- [ ] Certificats SSL obtenus (Let's Encrypt recommandé)
- [ ] `USE_HTTPS=true` dans .env
- [ ] `SESSION_SECRET` configuré (min 32 caractères)
- [ ] `CSRF_SECRET` configuré
- [ ] Frontend importe `useCSRFToken()`
- [ ] Toutes les requêtes POST/PUT/DELETE utilisent `fetchWithCSRF()`
- [ ] HSTS headers activé (voir Helmet dans app.js)
- [ ] Tester avec SSL Labs (https://www.ssllabs.com/ssltest/)

### En Production

- [ ] HTTPS forcé (redirection HTTP → HTTPS)
- [ ] Certificats renouvelés automatiquement
- [ ] HSTS activé (max-age: 1 an, includeSubDomains)
- [ ] CSRF tokens expirés après 1 heure
- [ ] Logs d'erreurs CSRF pour monitoring
- [ ] Cookies avec `sameSite: 'strict'`

---

## 🧪 Tests

### Tester CSRF en local

```bash
# GET /api/csrf-token - Doit retourner un token
curl http://localhost:5001/api/csrf-token

# POST sans token - Doit être rejeté (403)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'
# → 403 Forbidden

# POST avec token - Doit être accepté
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
  -H "Cookie: connect.sid=SESSION_ID" \
  -d '{"email":"test@test.com","password":"pass"}'
# → 200 ou 401 (selon les credentials)
```

### Tester HTTPS en local

```bash
# HTTPS avec certificat auto-signé (accepter les avertissements)
curl -k https://localhost:5001/api/health

# Vérifier que HTTP redirige vers HTTPS (en production)
curl -i http://localhost:5001/api/health
# → 301 Location: https://localhost:5001/api/health
```

---

## 🚨 Erreurs Courantes

### "EBADCSRFTOKEN"
**Cause:** Token CSRF manquant ou invalide
**Solution:** 
- Vérifier que `useCSRFToken()` est appelé
- Vérifier que `fetchWithCSRF()` est utilisé pour POST/PUT/DELETE
- Vérifier que `credentials: 'include'` est présent

### "Certificats SSL non trouvés"
**Cause:** Chemin incorrect ou fichiers manquants
**Solution:**
- Vérifier `SSL_CERT_PATH` et `SSL_KEY_PATH` dans .env
- Générer les certificats avec OpenSSL ou Certbot
- Placer les fichiers au bon endroit

### "Maximum call stack size exceeded"
**Cause:** Retry infini du token CSRF
**Solution:**
- Vérifier que le serveur retourne le token correctement
- Vérifier que `/api/csrf-token` est accessible

### "Mixed Content"
**Cause:** Page HTTPS appelle API HTTP
**Solution:**
- Configurer HTTPS côté backend
- S'assurer que l'URL du backend utilise https://

---

## 📚 Documentations de Référence

- [OWASP CSRF](https://owasp.org/www-community/attacks/csrf)
- [Express-CSRF](https://github.com/expressjs/csurf)
- [HTTPS Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🎯 Résumé

### Sécurité Ajoutée:
- ✅ HTTPS/TLS chiffrage complet
- ✅ CSRF protection (tokens + sessions)
- ✅ Redirection HTTP → HTTPS
- ✅ Headers HSTS
- ✅ Cookies HTTP-only

### Performance:
- ✅ HTTPS moderne (TLS 1.2+)
- ✅ Compression gzip (déjà implémenté)
- ✅ Session caching

### Facilité d'Utilisation:
- ✅ Service CSRF automatisé
- ✅ Retry automatique sur erreur CSRF
- ✅ Support Axios et Fetch
- ✅ Tokens expirés et renouvelés automatiquement

**Vous êtes maintenant protégés contre les attaques CSRF et HTTPS! 🔒**
