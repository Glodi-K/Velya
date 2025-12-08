# 🚀 DÉPLOYER VELYA SUR RENDER.COM

Render.com permet de déployer tout ensemble (frontend + backend + MongoDB) en un seul endroit.

## ✅ Avantages

- ✅ Tout ensemble (pas de séparation)
- ✅ Gratuit pour commencer
- ✅ MongoDB inclus
- ✅ Déploiement automatique avec git push
- ✅ Domaine personnalisé

## 🚀 Déploiement en 3 Étapes

### Étape 1: Créer un compte Render

1. Aller sur https://render.com
2. S'inscrire avec GitHub
3. Autoriser Render à accéder tes repos

### Étape 2: Créer le Blueprint

1. Aller sur https://dashboard.render.com
2. Cliquer "New +" → "Blueprint"
3. Sélectionner ton repo Velya
4. Render va détecter le `render.yaml`

### Étape 3: Configurer les Variables

Render va demander les variables manquantes :

**Backend:**
- `JWT_SECRET` - Générer une clé sécurisée
- `STRIPE_SECRET_KEY` - Clé Stripe de test
- `STRIPE_WEBHOOK_SECRET` - Webhook secret

**Frontend:**
- `REACT_APP_STRIPE_PUBLIC_KEY` - Clé publique Stripe

### Étape 4: Déployer

Cliquer "Deploy" → Render va :
1. Builder le backend
2. Builder le frontend
3. Créer MongoDB
4. Déployer tout

**Temps total:** ~10-15 minutes

## ✔️ Vérifier

### Backend
```bash
curl https://velya-backend.onrender.com/api/health
```

### Frontend
```
https://velya-frontend.onrender.com
```

## 🔗 Configurer le Domaine velya.ca

1. Acheter velya.ca
2. Dans Render Dashboard → Settings → Custom Domain
3. Ajouter velya.ca
4. Configurer les DNS records chez ton registraire

## 💰 Coûts

- **Render:** Gratuit (5$/mois après)
- **Domaine:** ~10$/an

**Total:** ~15$/an

## 🎉 Succès !

Si tout est ✓ :
- ✅ Backend accessible
- ✅ Frontend accessible
- ✅ MongoDB connectée
- ✅ Velya est en ligne ! 🎊

## 📊 Monitoring

- Logs: Render Dashboard → Service → Logs
- Metrics: CPU, mémoire
- Deployments: Historique des builds

## 🔄 Redéploiement

Simplement faire `git push` → Render redéploie automatiquement
