# 📋 GUIDE ULTIME DE DÉPLOIEMENT VELYA - RÉSUMÉ EXÉCUTIF

## 🎯 Objectif
Déployer Velya en production sur velya.ca avec tous les services sécurisés et monitorés.

## 📦 Fichiers créés pour vous

### Infrastructure
```
✅ docker-compose.prod.yml     - Orchestration production (MongoDB, Backend, Frontend, Nginx)
✅ frontend/Dockerfile         - Build multi-stage React + Nginx
✅ nginx.conf                  - Reverse proxy avec sécurité
```

### Configuration
```
✅ .env.production             - Variables d'environnement (secrets à remplir)
✅ .env.production.example     - Template de référence
✅ ENV_DOCUMENTATION.md        - Documentation de chaque variable
```

### Déploiement
```
✅ deploy-production.sh        - Script d'automatisation du déploiement
✅ deploy-velya.yml           - Playbook Ansible (optionnel)
✅ scripts/init-mongodb.sh    - Script d'initialisation MongoDB
```

### Documentation
```
✅ DEPLOYMENT.md              - Guide complet de déploiement (180+ lignes)
✅ DEPLOYMENT_CHECKLIST.md    - Checklist pré-go-live
✅ MAINTENANCE.md             - Guide de monitoring et maintenance
✅ SSL_CONFIGURATION.md       - Configuration SSL/TLS avec Let's Encrypt
```

### Tests
```
✅ test-production.sh         - Script de tests pré-déploiement
```

---

## 🚀 PLAN D'ACTION (Par ordre de priorité)

### ÉTAPE 1: Préparer le serveur (1-2 heures)

#### Sur un serveur Linux (Ubuntu 20.04+):

```bash
# 1. Mise à jour système
sudo apt update && sudo apt upgrade -y

# 2. Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# 3. Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Installation Certbot (pour SSL)
sudo apt install certbot python3-certbot-nginx -y

# 5. Configuration firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 6. Créer répertoire d'application
sudo mkdir -p /opt/velya
sudo chown $USER:$USER /opt/velya
```

---

### ÉTAPE 2: Configurer les secrets (30 minutes)

#### Sur votre machine locale:

```bash
# 1. Éditer .env.production
nano .env.production

# Remplir les variables manquantes:
```

#### Variables OBLIGATOIRES à remplir:

1. **Stripe** (Paiements)
   - Aller sur: https://dashboard.stripe.com/apikeys
   - Copier les clés LIVE (pas test!)
   - Mettre dans: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`

2. **Mailgun** (Emails)
   - Aller sur: https://app.mailgun.com
   - Copier la clé API
   - Domaine: `velya.ca` (doit être vérifié)
   - Mettre dans: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`

3. **Google OAuth** (Authentification)
   - Aller sur: https://console.cloud.google.com/apis/credentials
   - Créer "OAuth 2.0 Client ID" (type: Web application)
   - Authorized origins: `https://velya.ca`
   - Authorized redirect URIs: `https://api.velya.ca/api/auth/google/callback`
   - Copier: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

4. **Google Service Account** (API Google)
   - Sur Google Cloud Console
   - Créer un service account
   - Télécharger la clé JSON
   - Placer dans: `backend/config/google-service-account.json`

5. **Cloudinary** (Upload photos)
   - Aller sur: https://cloudinary.com/console
   - Copier: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

6. **MongoDB Password**
   - Générer un mot de passe sécurisé (min 16 caractères)
   - Remplacer dans `MONGO_URI`: `mongodb://velya_admin:VOTRE_PASSWORD@mongodb:27017/velya?authSource=admin`

---

### ÉTAPE 3: Générer les certificats SSL (20 minutes)

```bash
# Sur le serveur:

# 1. Générer certificats Let's Encrypt
sudo certbot certonly --standalone \
  -d velya.ca \
  -d api.velya.ca \
  -m admin@velya.ca \
  --agree-tos

# 2. Créer dossier ssl local
mkdir -p /opt/velya/ssl

# 3. Copier les certificats
sudo cp /etc/letsencrypt/live/velya.ca/fullchain.pem /opt/velya/ssl/cert.pem
sudo cp /etc/letsencrypt/live/velya.ca/privkey.pem /opt/velya/ssl/key.pem
sudo chown $USER:$USER /opt/velya/ssl/*
chmod 600 /opt/velya/ssl/key.pem
```

---

### ÉTAPE 4: Déployer l'application (30 minutes)

```bash
# Sur le serveur:

# 1. Cloner le repository
cd /opt/velya
git clone -b rename-cleaningapp-to-velya https://github.com/kevinmulamba/cleaningApp-frontend.git .

# 2. Copier la configuration (depuis votre machine locale)
scp .env.production user@velya.ca:/opt/velya/

# 3. Copier la clé Google
scp backend/config/google-service-account.json user@velya.ca:/opt/velya/backend/config/

# 4. Construire et démarrer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 5. Initialiser la base de données
docker-compose -f docker-compose.prod.yml exec mongodb bash /scripts/init-mongodb.sh
```

---

### ÉTAPE 5: Configurer le domaine (30 minutes)

#### DNS Configuration (chez votre registraire):

```
Nom              Type    Valeur
---
velya.ca         A       YOUR_SERVER_IP
api.velya.ca     A       YOUR_SERVER_IP
www.velya.ca     CNAME   velya.ca
```

---

### ÉTAPE 6: Vérifications finales (15 minutes)

```bash
# Sur le serveur:

# 1. Test complet
bash /opt/velya/test-production.sh

# 2. Vérifier les services
docker-compose -f docker-compose.prod.yml ps

# 3. Vérifier les logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# 4. Tester les URLs
curl -I https://velya.ca
curl -I https://api.velya.ca/api/health

# 5. Tester via navigateur
# Frontend: https://velya.ca
# Health check: https://api.velya.ca/api/health
```

---

## ⚠️ CHECKLIST DE SÉCURITÉ

Avant le GO-LIVE, vérifier:

```
□ JWT_SECRET: Sécurisé (min 32 chars, pas "monSuperSecret")
□ MongoDB: Password changé du défaut
□ Stripe: Clés LIVE utilisées (pas test keys)
□ Google OAuth: Domaines autorisés corrects
□ Mailgun: Domaine vérifié et configuré
□ SSL: Certificats en place et valides
□ Firewall: Ports 80/443 ouverts, 22 limité
□ .env.production: Aucun placeholder "YOUR_*_HERE"
□ Secrets: Pas commités dans git
□ Backups: MongoDB sauvegardée
□ Monitoring: Logs configurés
```

---

## 🔄 TESTS CRITIQUES À EFFECTUER

```bash
# 1. Test d'authentification
curl -X POST https://api.velya.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 2. Test Stripe webhook
# Aller sur: https://dashboard.stripe.com/webhooks
# Modifier l'URL: https://api.velya.ca/api/webhook/stripe

# 3. Test email
# Créer un compte → Vérifier que l'email de confirmation arrive

# 4. Test upload photo
# Dashboard → Upload photo de profil → Vérifier via Cloudinary

# 5. Test paiement
# Réserver un service → Effectuer paiement test Stripe
```

---

## 📊 MONITORING APRÈS LE GO-LIVE

### Commandes essentielles:

```bash
# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Status des services
docker-compose -f docker-compose.prod.yml ps

# Ressources utilisées
docker stats

# Sauvegarde MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --out /data/backups/$(date +%Y%m%d_%H%M%S)

# Redémarrage gracieux
docker-compose -f docker-compose.prod.yml restart

# Arrêt complet
docker-compose -f docker-compose.prod.yml down
```

### Renouvellement certificats (automatique):

```bash
# Créer cron job
0 3 * * * certbot renew --quiet && \
  docker-compose -f docker-compose.prod.yml restart nginx > /var/log/certbot-renew.log 2>&1
```

---

## 🆘 DÉPANNAGE RAPIDE

### Frontend ne charge pas
```bash
# Vérifier Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Redémarrer
docker-compose -f docker-compose.prod.yml restart nginx
```

### API retourne 502
```bash
# Vérifier Backend
docker-compose -f docker-compose.prod.yml logs backend

# Redémarrer
docker-compose -f docker-compose.prod.yml restart backend
```

### MongoDB lent
```bash
# Vérifier la taille
docker-compose -f docker-compose.prod.yml exec -T mongodb du -sh /data/db

# Indices manquants
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongosh -u velya_admin -p << 'EOF'
use velya
db.collection.reIndex()
EOF
```

### Certificat expiré
```bash
# Renouveler manuellement
sudo certbot renew --force-renewal

# Copier les nouveaux certificats
sudo cp /etc/letsencrypt/live/velya.ca/fullchain.pem /opt/velya/ssl/cert.pem
sudo cp /etc/letsencrypt/live/velya.ca/privkey.pem /opt/velya/ssl/key.pem

# Redémarrer Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📞 SUPPORT ET ESCALADE

| Problème | Premier pas | Ressource |
|----------|-------------|-----------|
| MongoDB | `docker logs velya_mongodb_1` | MAINTENANCE.md |
| Stripe | Vérifier logs | https://stripe.com/docs |
| Mailgun | Vérifier domaine | https://app.mailgun.com |
| SSL | `certbot certificates` | SSL_CONFIGURATION.md |
| Général | `test-production.sh` | DEPLOYMENT_CHECKLIST.md |

---

## ✅ CHECKLIST FINALE - PRÊT À DÉPLOYER?

```
□ Étape 1: Serveur préparé (Docker, Certbot, Firewall)
□ Étape 2: Tous les secrets configurés (.env.production)
□ Étape 3: Certificats SSL générés et en place
□ Étape 4: Application déployée et services running
□ Étape 5: DNS configuré (propagation peut prendre 24h)
□ Étape 6: Tous les tests réussis
□ Tests critiques: Auth, Email, Stripe, Upload effectués
□ Monitoring: Logs et alertes configurés
□ Backups: MongoDB sauvegardé
□ Documentation: Équipe informée
```

Si tous les checkboxes sont cochés ✅ → **GO-LIVE AUTORISÉ** 🚀

---

## 📚 Documents de référence

- **DEPLOYMENT.md** - Guide complet (180+ lignes)
- **DEPLOYMENT_CHECKLIST.md** - Checklist exhaustive (50+ items)
- **MAINTENANCE.md** - Monitoring et maintenance
- **SSL_CONFIGURATION.md** - Configuration SSL/TLS
- **ENV_DOCUMENTATION.md** - Documentation des variables

---

**Créé**: 4 décembre 2025
**Version**: 1.0 Production Ready
**Status**: ✅ Prêt pour déploiement
