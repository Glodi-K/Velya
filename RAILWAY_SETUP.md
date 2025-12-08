# 🚀 Déploiement Velya sur Railway - Guide Complet

## ✅ Étape 1 : Préparer le Repo

```bash
# Commit les changements
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

## 📋 Étape 2 : Créer le Projet Railway

1. Aller sur https://railway.app
2. Cliquer "New Project" → "Deploy from GitHub repo"
3. Sélectionner ton repo Velya
4. Autoriser Railway

## 🗄️ Étape 3 : Ajouter MongoDB

1. Dans le dashboard Railway, cliquer "+ Add"
2. Chercher "MongoDB" → Sélectionner
3. Railway crée une instance gratuite
4. Copier la `MONGODB_URI` fournie

## 🔧 Étape 4 : Configurer le Backend

### Variables d'Environnement Backend

Dans Railway Dashboard → Backend Service → Variables :

```
# Database (copier depuis MongoDB service)
MONGO_URI=mongodb+srv://...

# JWT (générer une clé sécurisée)
JWT_SECRET=your_super_secret_key_minimum_32_characters_here

# Stripe (clés de test pour commencer)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Mailgun (optionnel pour commencer)
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=sandbox-xxxxx.mailgun.org

# Google OAuth (optionnel pour commencer)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# Cloudinary (optionnel pour commencer)
CLOUDINARY_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# App
NODE_ENV=production
```

## 🎨 Étape 5 : Configurer le Frontend

### Variables d'Environnement Frontend

Dans Railway Dashboard → Frontend Service → Variables :

```
# Récupérer l'URL du backend depuis Railway
REACT_APP_API_URL=https://your-backend-service.railway.app
REACT_APP_WEBSOCKET_URL=https://your-backend-service.railway.app
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
CI=false
```

## 🚀 Étape 6 : Déployer

1. Railway détecte automatiquement les changements
2. Commence le build des services
3. Attendre ~10-15 minutes pour la compilation complète

## ✔️ Étape 7 : Vérifier le Déploiement

### Tester le Backend
```bash
curl https://your-backend-service.railway.app/api/health
```

### Tester le Frontend
Ouvrir https://your-frontend-service.railway.app dans le navigateur

## 🔗 Étape 8 : Configurer le Domaine (velya.ca)

1. Acheter le domaine velya.ca (si pas déjà fait)
2. Dans Railway Dashboard → Settings → Domains
3. Ajouter velya.ca
4. Configurer les DNS records chez ton registraire

## 📊 Monitoring

- Logs en temps réel : Railway Dashboard → Logs
- Metrics : CPU, mémoire, réseau
- Deployments : Historique des builds

## 🆘 Troubleshooting

### Backend crash au démarrage
- Vérifier MONGO_URI dans les variables
- Vérifier les logs : Railway Dashboard → Backend → Logs
- S'assurer que MongoDB est healthy

### Frontend ne charge pas
- Vérifier REACT_APP_API_URL
- Vérifier les logs du build
- Vérifier que le backend est accessible

### Erreur "Cannot GET /"
- Vérifier que le frontend Dockerfile est correct
- Vérifier que nginx.conf est présent
- Redéployer : git push

## 💡 Tips

- Redéploiement automatique : git push déclenche un nouveau build
- Logs en temps réel : `railway logs -f` (avec Railway CLI)
- Rollback : Railway garde l'historique des déploiements
- Scale : Augmenter les resources facilement depuis le dashboard

## 🎉 Succès !

Si tout est vert ✓ :
- ✅ Backend accessible
- ✅ Frontend accessible
- ✅ MongoDB connectée
- ✅ Prêt pour production !
