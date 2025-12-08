# 🚀 DÉMARRER VELYA SUR RAILWAY - GUIDE RAPIDE

## ✅ Statut Actuel

Ton application Velya est **PRÊTE POUR RAILWAY** ✓

Tous les problèmes de déploiement ont été corrigés :
- ✅ railway.json fixé (utilise `npm start` au lieu de `npm run dev:backend`)
- ✅ Support du PORT dynamique de Railway
- ✅ Configuration frontend dynamique
- ✅ Guides complets créés

## 🚀 Déployer en 5 Minutes

### 1️⃣ Aller sur Railway
```
https://railway.app
```

### 2️⃣ Créer un Projet
- Cliquer "New Project"
- Sélectionner "Deploy from GitHub repo"
- Choisir ton repo Velya
- Autoriser Railway

### 3️⃣ Ajouter MongoDB
- Cliquer "+ Add"
- Chercher "MongoDB"
- Sélectionner et créer
- **Copier la `MONGODB_URI` fournie**

### 4️⃣ Configurer le Backend

Dans Railway Dashboard → Backend Service → Variables :

```
MONGO_URI=<copier depuis MongoDB>
JWT_SECRET=your_super_secret_key_minimum_32_characters_here
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NODE_ENV=production
```

### 5️⃣ Configurer le Frontend

1. Récupérer l'URL du backend depuis Railway
   - Railway Dashboard → Backend Service → Deployments
   - Copier l'URL publique

2. Dans Railway Dashboard → Frontend Service → Variables :

```
REACT_APP_API_URL=https://your-backend-service.railway.app
REACT_APP_WEBSOCKET_URL=https://your-backend-service.railway.app
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
CI=false
```

### 6️⃣ Attendre le Déploiement

Railway va automatiquement :
1. Builder le backend (~3-5 min)
2. Builder le frontend (~5-7 min)
3. Initialiser MongoDB (~2 min)
4. Déployer les services

**Temps total : ~10-15 minutes**

## ✔️ Vérifier que Ça Marche

### Tester le Backend
```bash
curl https://your-backend-service.railway.app/api/health
```

Devrait retourner :
```json
{"status":"OK","message":"Backend Velya opérationnel","timestamp":"..."}
```

### Tester le Frontend
Ouvrir dans le navigateur :
```
https://your-frontend-service.railway.app
```

## 🔗 Configurer le Domaine velya.ca

### Dans Railway
1. Railway Dashboard → Settings → Domains
2. Ajouter velya.ca
3. Copier les DNS records

### Chez ton Registraire
1. Aller chez ton registraire (GoDaddy, Namecheap, etc.)
2. Configurer les DNS records fournis par Railway
3. Attendre la propagation (5-30 minutes)

## 📊 Monitoring

- **Logs en temps réel:** Railway Dashboard → Service → Logs
- **Metrics:** CPU, mémoire, réseau
- **Deployments:** Historique des builds

## 🆘 Si Ça Crash

### Backend crash au démarrage
```
1. Vérifier MONGO_URI dans les variables
2. Vérifier les logs : Railway Dashboard → Backend → Logs
3. S'assurer que MongoDB est healthy
```

### Frontend ne charge pas
```
1. Vérifier REACT_APP_API_URL
2. Vérifier les logs du build
3. Vérifier que le backend est accessible
```

### Erreur CORS
```
1. Vérifier que REACT_APP_API_URL est correcte
2. Vérifier que le backend accepte les CORS
3. Redéployer : git push
```

## 📚 Documentation Complète

- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Guide détaillé
- [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md) - Checklist complète
- [RAILWAY_DEPLOYMENT_SUMMARY.md](./RAILWAY_DEPLOYMENT_SUMMARY.md) - Résumé des changements

## 💡 Tips

- **Redéploiement:** `git push` déclenche automatiquement un nouveau build
- **Logs en temps réel:** `railway logs -f` (avec Railway CLI)
- **Rollback:** Railway garde l'historique des déploiements
- **Scale:** Augmenter les resources facilement depuis le dashboard

## 🎉 Succès !

Si tout est ✓ :
- ✅ Backend accessible
- ✅ Frontend accessible
- ✅ MongoDB connectée
- ✅ Domaine configuré
- ✅ **Velya est en ligne !** 🎊

## 🔐 Sécurité

Avant de passer en production :
- [ ] Changer JWT_SECRET par une clé sécurisée
- [ ] Utiliser les clés Stripe LIVE (pas test)
- [ ] Configurer les services externes (Mailgun, Google OAuth, Cloudinary)
- [ ] Mettre en place les backups automatiques
- [ ] Configurer le monitoring

## 📞 Support

Si tu as des problèmes :
1. Vérifier les logs : Railway Dashboard → Logs
2. Consulter la documentation : [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)
3. Vérifier la checklist : [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)

---

**Status:** ✅ PRÊT POUR DÉPLOIEMENT
**Dernière mise à jour:** 2024
**Version:** 1.0

**Prochaine étape:** Aller sur https://railway.app et créer un nouveau projet ! 🚀
