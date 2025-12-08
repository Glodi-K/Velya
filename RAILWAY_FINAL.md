# 🚀 DÉPLOYER VELYA SUR RAILWAY + ATLAS

## Configuration Actuelle

- ✅ Backend Dockerfile prêt
- ✅ MongoDB Atlas déjà configuré
- ✅ Railway.json configuré

## 🚀 Déploiement en 3 Étapes

### Étape 1: Déployer le Backend sur Railway

1. Aller sur https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionner ton repo Velya
4. Railway va détecter le Dockerfile et déployer le backend

### Étape 2: Configurer les Variables Backend

Dans Railway Dashboard → Backend Service → Variables :

```
NODE_ENV=production
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/velya
JWT_SECRET=your_super_secret_key_32_chars
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=mg.velya.ca
```

### Étape 3: Déployer le Frontend sur Vercel

1. Aller sur https://vercel.com
2. "New Project" → Importer ton repo
3. Root Directory: `frontend`
4. Framework: React
5. Build Command: `npm run build`
6. Output Directory: `build`

### Étape 4: Configurer les Variables Frontend

Dans Vercel → Settings → Environment Variables :

```
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_WEBSOCKET_URL=https://your-backend.railway.app
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
CI=false
```

## ✔️ Vérifier

### Backend
```bash
curl https://your-backend.railway.app/api/health
```

### Frontend
```
https://your-project.vercel.app
```

## 🔗 Domaine velya.ca

- `velya.ca` → Vercel (frontend)
- `api.velya.ca` → Railway (backend)

## 💰 Coûts

- **Railway:** 5$/mois (500h gratuit)
- **Vercel:** Gratuit
- **MongoDB Atlas:** Gratuit (512MB)
- **Domaine:** ~10$/an

**Total:** ~5$/mois + 10$/an

## 🎉 Succès !

- ✅ Backend sur Railway
- ✅ Frontend sur Vercel
- ✅ MongoDB sur Atlas
- ✅ Velya est en ligne ! 🎊
