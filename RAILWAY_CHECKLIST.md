# ✅ CHECKLIST DÉPLOIEMENT RAILWAY - VELYA

## 🔧 Avant de Commencer

- [ ] Compte GitHub créé et repo Velya pushé
- [ ] Compte Railway.app créé (https://railway.app)
- [ ] Domaine velya.ca acheté (ou en cours)
- [ ] Clés Stripe obtenues (test keys pour commencer)

## 📝 Étape 1 : Préparer le Code

```bash
# Vérifier que tout est commité
git status

# Commit les changements de configuration
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

- [ ] Code pushé sur GitHub
- [ ] railway.json corrigé ✓
- [ ] Dockerfiles présents ✓
- [ ] .env.railway.example créé ✓

## 🚀 Étape 2 : Créer le Projet Railway

1. Aller sur https://railway.app
2. Cliquer "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Choisir ton repo Velya
5. Autoriser Railway

- [ ] Projet Railway créé
- [ ] Repo GitHub connecté

## 🗄️ Étape 3 : Ajouter MongoDB

1. Dans Railway Dashboard, cliquer "+ Add"
2. Chercher "MongoDB"
3. Sélectionner et créer
4. Copier la `MONGODB_URI`

- [ ] MongoDB ajouté
- [ ] MONGODB_URI copié

## 🔧 Étape 4 : Configurer le Backend

### 4.1 Ajouter les Variables

Dans Railway Dashboard → Backend Service → Variables :

```
MONGO_URI=<copier depuis MongoDB service>
JWT_SECRET=<générer une clé sécurisée>
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NODE_ENV=production
```

- [ ] MONGO_URI configurée
- [ ] JWT_SECRET configurée
- [ ] STRIPE_SECRET_KEY configurée
- [ ] NODE_ENV=production

### 4.2 Vérifier le Build

- [ ] Backend build réussi (vérifier les logs)
- [ ] Backend health check répond (/api/health)

## 🎨 Étape 5 : Configurer le Frontend

### 5.1 Récupérer l'URL du Backend

1. Dans Railway Dashboard → Backend Service
2. Copier l'URL publique (ex: https://velya-backend-xxxxx.railway.app)

### 5.2 Ajouter les Variables

Dans Railway Dashboard → Frontend Service → Variables :

```
REACT_APP_API_URL=https://velya-backend-xxxxx.railway.app
REACT_APP_WEBSOCKET_URL=https://velya-backend-xxxxx.railway.app
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
CI=false
```

- [ ] REACT_APP_API_URL configurée
- [ ] REACT_APP_WEBSOCKET_URL configurée
- [ ] REACT_APP_STRIPE_PUBLIC_KEY configurée
- [ ] CI=false configurée

### 5.3 Vérifier le Build

- [ ] Frontend build réussi (vérifier les logs)
- [ ] Frontend accessible via l'URL publique

## 🔗 Étape 6 : Configurer le Domaine

### 6.1 Dans Railway

1. Railway Dashboard → Settings → Domains
2. Ajouter velya.ca
3. Copier les DNS records fournis par Railway

### 6.2 Chez ton Registraire

1. Aller chez ton registraire (GoDaddy, Namecheap, etc.)
2. Configurer les DNS records fournis par Railway
3. Attendre la propagation (5-30 minutes)

- [ ] Domaine configuré dans Railway
- [ ] DNS records mis à jour chez le registraire
- [ ] Domaine accessible (velya.ca)

## ✔️ Étape 7 : Tests Finaux

### 7.1 Backend

```bash
# Tester l'endpoint health
curl https://velya-backend-xxxxx.railway.app/api/health

# Devrait retourner:
# {"status":"OK","message":"Backend Velya opérationnel","timestamp":"..."}
```

- [ ] Backend health check répond
- [ ] Logs backend sans erreurs

### 7.2 Frontend

1. Ouvrir https://velya.ca (ou l'URL Railway)
2. Vérifier que la page charge
3. Ouvrir la console (F12)
4. Vérifier qu'il n'y a pas d'erreurs CORS

- [ ] Frontend charge correctement
- [ ] Pas d'erreurs CORS
- [ ] Pas d'erreurs de connexion API

### 7.3 Fonctionnalités

- [ ] Inscription utilisateur fonctionne
- [ ] Login fonctionne
- [ ] Paiement Stripe (test card: 4242 4242 4242 4242)
- [ ] Upload de photos fonctionne
- [ ] Chat/Messages fonctionne

## 📊 Étape 8 : Monitoring

### 8.1 Configurer les Alertes

1. Railway Dashboard → Settings → Alerts
2. Ajouter des alertes pour:
   - CPU > 80%
   - Mémoire > 80%
   - Erreurs de déploiement

- [ ] Alertes configurées

### 8.2 Vérifier les Logs

1. Railway Dashboard → Backend → Logs
2. Railway Dashboard → Frontend → Logs
3. Vérifier qu'il n'y a pas d'erreurs

- [ ] Logs vérifiés
- [ ] Pas d'erreurs critiques

## 🆘 Troubleshooting

### Problème: Backend crash au démarrage

**Solution:**
1. Vérifier MONGO_URI dans les variables
2. Vérifier que MongoDB est healthy
3. Vérifier les logs du backend

- [ ] Problème résolu

### Problème: Frontend ne charge pas

**Solution:**
1. Vérifier REACT_APP_API_URL
2. Vérifier les logs du build frontend
3. Vérifier que le backend est accessible

- [ ] Problème résolu

### Problème: Erreur CORS

**Solution:**
1. Vérifier que REACT_APP_API_URL est correcte
2. Vérifier que le backend accepte les CORS
3. Redéployer le backend

- [ ] Problème résolu

## 🎉 Déploiement Réussi !

Si tout est ✓ :

- ✅ Backend accessible et fonctionnel
- ✅ Frontend accessible et fonctionnel
- ✅ MongoDB connectée
- ✅ Domaine velya.ca configuré
- ✅ Tests fonctionnels réussis
- ✅ Monitoring activé

**Prochaines étapes:**
1. Configurer les services externes (Mailgun, Google OAuth, Cloudinary)
2. Mettre en place les backups automatiques
3. Configurer les logs centralisés
4. Mettre en place le monitoring avancé

---

**Date de déploiement:** _______________
**Responsable:** _______________
**Notes:** _______________
