# 🚀 DÉPLOYER VELYA MAINTENANT

## Architecture Finale

```
Frontend (React)     →  Vercel (gratuit, CDN global)
Backend (Node.js)    →  Railway (gratuit, 5$/mois après)
Database (MongoDB)   →  Railway (gratuit)
```

---

## 🔧 BACKEND - Railway (DÉJÀ CONFIGURÉ)

Railway va automatiquement :
1. Détecter le Dockerfile
2. Builder le backend
3. Connecter MongoDB
4. Déployer

**URL du backend:** `https://your-backend-service.railway.app`

---

## 🎨 FRONTEND - Vercel (À FAIRE)

### Étape 1: Créer un repo séparé pour le frontend

```bash
cd frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/velya-frontend.git
git push -u origin main
```

### Étape 2: Déployer sur Vercel

1. Aller sur https://vercel.com
2. Cliquer "New Project"
3. Importer le repo `velya-frontend`
4. Vercel détecte React automatiquement

### Étape 3: Configurer les variables

Dans Vercel Dashboard → Settings → Environment Variables :

```
REACT_APP_API_URL=https://your-backend-service.railway.app
REACT_APP_WEBSOCKET_URL=https://your-backend-service.railway.app
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
CI=false
```

### Étape 4: Déployer

Cliquer "Deploy" → Vercel va builder et déployer automatiquement

**URL du frontend:** `https://your-project.vercel.app`

---

## 🔗 Configurer le Domaine velya.ca

### Option 1: Domaine unique (recommandé)

1. Acheter `velya.ca`
2. Configurer DNS :
   - `velya.ca` → Vercel
   - `api.velya.ca` → Railway

### Option 2: Sous-domaines

- Frontend: `app.velya.ca` (Vercel)
- Backend: `api.velya.ca` (Railway)

---

## ✔️ Vérifier que Ça Marche

### Backend
```bash
curl https://your-backend-service.railway.app/api/health
```

Devrait retourner :
```json
{"status":"OK","message":"Backend Velya opérationnel"}
```

### Frontend
Ouvrir dans le navigateur :
```
https://your-project.vercel.app
```

---

## 📊 Monitoring

**Railway:**
- Logs: Dashboard → Backend → Logs
- Metrics: CPU, mémoire

**Vercel:**
- Logs: Dashboard → Deployments → Logs
- Analytics: Dashboard → Analytics

---

## 💰 Coûts

- **Vercel:** Gratuit (frontend)
- **Railway:** Gratuit (5$/mois après)
- **Domaine:** ~10$/an

**Total:** ~15$/an pour commencer

---

## 🎉 Succès !

Si tout est ✓ :
- ✅ Backend sur Railway
- ✅ Frontend sur Vercel
- ✅ Domaine velya.ca configuré
- ✅ **Velya est en ligne !** 🎊

---

**Prochaines étapes:**
1. Créer repo frontend séparé
2. Déployer sur Vercel
3. Configurer le domaine
4. Tester l'application complète
