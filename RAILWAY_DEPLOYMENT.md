# Guide de Déploiement Velya sur Railway.app

## ✅ Prérequis
- Compte GitHub (avec ton repo Velya)
- Compte Railway.app (gratuit, créé avec GitHub)
- Clés API : Stripe, Mailgun, Google OAuth, Cloudinary

## 📋 Étape 1 : Créer le Projet Railway

### 1.1 Aller sur railway.app
```
https://railway.app
```

### 1.2 S'authentifier avec GitHub
- Cliquer "Sign Up" → "Continue with GitHub"
- Autoriser Railway à accéder tes repos

### 1.3 Créer un nouveau projet
- Cliquer "New Project" → "Deploy from GitHub repo"
- Sélectionner `cleaningApp-frontend` repo
- Autoriser Railway à accéder ton repo

### 1.4 Railway va détecter les services
Railway devrait trouver :
- Backend (Node.js)
- Frontend (React)
- MongoDB (depuis docker-compose.prod.yml)

---

## 🗄️ Étape 2 : Configurer MongoDB

### 2.1 Ajouter le service MongoDB
Dans le dashboard Railway :
1. Cliquer "+ Add" → "Add from Marketplace"
2. Chercher "MongoDB" → Sélectionner
3. Railway crée une instance MongoDB gratuite

### 2.2 Récupérer la connection string
1. Aller dans le service MongoDB
2. Cliquer l'onglet "Connect"
3. Copier la `MONGO_URL` fournie par Railway

---

## 🔐 Étape 3 : Configurer les Variables d'Environnement

### 3.1 Pour le Backend
Dans le service Backend sur Railway Dashboard :
1. Aller à l'onglet "Variables"
2. Ajouter ces variables (remplacer les valeurs) :

```
# Database (Railway fournit automatiquement)
MONGODB_URI=<copiée depuis MongoDB service>

# JWT
JWT_SECRET=your_super_secret_key_minimum_32_characters

# Stripe (Test Keys)
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Mailgun
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=sandbox-xxxxx.mailgun.org

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REFRESH_TOKEN=xxxxx

# Cloudinary
CLOUDINARY_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# App
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@velya.com
```

### 3.2 Pour le Frontend
Dans le service Frontend sur Railway Dashboard :
1. Aller à l'onglet "Variables"
2. Ajouter ces variables :

```
# API URLs (remplacer par ton URL Railway backend)
REACT_APP_API_URL=https://your-backend-service.railway.app/api
REACT_APP_SOCKET_URL=https://your-backend-service.railway.app

# Stripe Public Key (MÊME QUE BACKEND)
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx

# Build
REACT_APP_ENV=production
CI=false
```

---

## 🚀 Étape 4 : Déployer

### 4.1 Push ton code sur GitHub
```powershell
git add .
git commit -m "Railway deployment files"
git push origin rename-cleaningapp-to-velya
```

### 4.2 Railway détecte le changement
- Railway voit le push automatiquement
- Commence le build des Dockerfiles
- Status : visible dans Railway Dashboard

### 4.3 Attendre la compilation
- Backend build : ~3-5 minutes
- Frontend build : ~5-7 minutes
- MongoDB initialisation : ~2 minutes
- **Temps total : ~10-15 minutes**

### 4.4 Vérifier les logs
Dans Railway Dashboard :
- Cliquer chaque service
- Onglet "Deployments"
- Voir les logs en temps réel
- Chercher des erreurs

---

## ✔️ Étape 5 : Tester le Déploiement

### 5.1 Récupérer les URLs publiques
Dans Railway Dashboard :
```
Backend: https://your-backend-xxxxx.railway.app
Frontend: https://your-frontend-xxxxx.railway.app
```

### 5.2 Tester le Frontend
```
Ouvre https://your-frontend-xxxxx.railway.app dans le navigateur
```

### 5.3 Tester les APIs
```powershell
Invoke-RestMethod `
  -Uri "https://your-backend-xxxxx.railway.app/api/health" `
  -Method GET
```

### 5.4 Vérifier MongoDB
```powershell
# Via Railway CLI (optionnel)
railway shell
mongo $MONGODB_URI
```

---

## 🔧 Configuration Dockerfiles pour Railway

### backend/Dockerfile (Déjà correct ✓)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### frontend/Dockerfile (Déjà correct ✓)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📊 Monitoring après Déploiement

### Via Railway Dashboard
- **Logs** : Voir les erreurs en temps réel
- **Metrics** : CPU, mémoire, réseau
- **Deployments** : Historique des builds
- **Environment** : Variables d'environnement

### Via Endpoints
```powershell
# Health check backend
Invoke-RestMethod https://your-backend.railway.app/api/health

# Frontend disponible
Start-Process https://your-frontend.railway.app
```

---

## 🆘 Résolution de Problèmes

### Erreur 1 : "npm install failed"
**Cause** : Package mal configuré
**Solution** :
```
Aller backend/package.json → S'assurer "main": "server.js"
Vérifier package-lock.json présent
```

### Erreur 2 : "Cannot connect to MongoDB"
**Cause** : MONGODB_URI incorrect
**Solution** :
```
1. Aller service MongoDB sur Railway
2. Copier l'URL exacte
3. Ajouter dans Backend Variables
4. Redéployer (git push)
```

### Erreur 3 : "Build timeout (30 minutes)"
**Cause** : npm install trop long
**Solution** :
```
Ajouter à backend/Dockerfile :
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retries 10
```

### Erreur 4 : "Frontend build failed"
**Cause** : Variables d'environnement manquantes
**Solution** :
```
Vérifier toutes les REACT_APP_* variables dans Frontend
Redéployer après ajouter les variables
```

---

## 📱 Test Complet

Après déploiement réussi :

1. **Inscription** : Créer compte utilisateur
2. **Login** : Se connecter
3. **Payment** : Tester avec Stripe test card
   - Number: 4242 4242 4242 4242
   - Date: 12/25
   - CVC: 123
4. **Réservation** : Créer une réservation
5. **Messages** : Tester chat en temps réel

---

## 💡 Tips

- **Redéploiement** : Faire git push, Railway rebuild automatiquement
- **Logs en temps réel** : `railway logs -f`
- **Environnement local** : Utiliser `.env.local` pour tests avant Railway
- **Scale** : Railway permet facile augmentation de resources si besoin

---

## 🎉 Succès !

Si tout est vert ✓ sur Railway Dashboard :
- ✅ Velya est accessible publiquement
- ✅ Base de données fonctionne
- ✅ APIs répondent correctement
- ✅ Prêt pour production !

**Prochaine étape** : Déployer en production sur Ubuntu/DigitalOcean avec SSL Let's Encrypt

---

**Support** : Besoin d'aide ? Décrire l'erreur exacte du Dashboard Railway
