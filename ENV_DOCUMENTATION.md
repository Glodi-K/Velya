# Documentation des variables d'environnement

## Vue d'ensemble

Ce document décrit toutes les variables d'environnement requises pour déployer Velya en production.

## 🔐 Sécurité

### JWT_SECRET

- **Description**: Clé secrète pour signer les tokens JWT
- **Type**: String (min 32 caractères)
- **Format**: Alphanumerique aléatoire
- **Exemple**: `5avKgkHx7BG1ZpQU9FnEsWJeTVo6rjAO`
- **Générer**: 
  ```bash
  # Linux/Mac
  openssl rand -base64 24 | tr -d '=+/' | cut -c1-32
  
  # Windows PowerShell
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
  ```
- **Sécurité**: CRITIQUE - Changer entre chaque environnement
- **Notes**: Si changé, tous les tokens actifs deviennent invalides

### MONGO_URI

- **Description**: Chaîne de connexion MongoDB
- **Type**: String (MongoDB connection string)
- **Format pour Docker**: 
  ```
  mongodb://username:password@host:port/database?authSource=admin
  ```
- **Format MongoDB Atlas**:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/database
  ```
- **Exemple (Docker)**:
  ```
  mongodb://velya_admin:SecurePassword123@mongodb:27017/velya?authSource=admin
  ```
- **Sécurité**: CRITIQUE - Ne jamais exposer
- **Notes**: 
  - Username: `velya_admin`
  - Password: Générer sécurisé (min 16 caractères)

## 💳 Paiements (Stripe)

### STRIPE_SECRET_KEY

- **Description**: Clé secrète API Stripe (production)
- **Type**: String (commence par `sk_live_`)
- **Obtenir**: https://dashboard.stripe.com/apikeys
- **Exemple**: `sk_live_51234567890abcdefghijklmnopqrst`
- **Sécurité**: CRITIQUE
- **Environnement**: Production UNIQUEMENT (pas de test keys)

### STRIPE_WEBHOOK_SECRET

- **Description**: Secret pour valider les webhooks Stripe
- **Type**: String (commence par `whsec_`)
- **Obtenir**: https://dashboard.stripe.com/webhooks
- **Exemple**: `whsec_test_secret_1234567890abcdefghijklmno`
- **Sécurité**: CRITIQUE
- **Configuration**: 
  - URL: `https://api.velya.ca/api/webhook/stripe`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### REACT_APP_STRIPE_PUBLIC_KEY

- **Description**: Clé publique Stripe (frontend)
- **Type**: String (commence par `pk_live_`)
- **Obtenir**: https://dashboard.stripe.com/apikeys
- **Exemple**: `pk_live_51234567890abcdefghijklmno`
- **Visibilité**: Publique (exposée au frontend)
- **Sécurité**: Moyenne (clé publique)

## 📧 Email (Mailgun)

### MAILGUN_API_KEY

- **Description**: Clé API Mailgun pour l'envoi d'emails
- **Type**: String
- **Obtenir**: https://app.mailgun.com/app/account/security/api_keys
- **Exemple**: `key-1234567890abcdefghijklmnop`
- **Sécurité**: CRITIQUE
- **Utilisation**: Envoi d'emails transactionnels et marketing

### MAILGUN_DOMAIN

- **Description**: Domaine Mailgun configuré
- **Type**: String (domaine)
- **Obtenir**: https://app.mailgun.com/app/domains
- **Exemple**: `velya.ca` ou `mg.velya.ca`
- **Notes**: Doit être un domaine vérifié dans Mailgun

### MAILGUN_FROM_EMAIL

- **Description**: Email "from" pour les messages
- **Type**: String (email valide)
- **Format**: `noreply@velya.ca` ou `notifications@velya.ca`
- **Notes**: Doit être configuré dans Mailgun

## 🔐 Authentification Google

### GOOGLE_CLIENT_ID

- **Description**: ID client OAuth Google
- **Type**: String (format: `...apps.googleusercontent.com`)
- **Obtenir**: https://console.cloud.google.com/apis/credentials
- **Exemple**: `123456789-abc1def2ghi3jkl4mno5pqr6stu7@apps.googleusercontent.com`
- **Configuration requise**:
  - Authorized JavaScript origins: `https://velya.ca`
  - Authorized redirect URIs: `https://api.velya.ca/api/auth/google/callback`

### GOOGLE_CLIENT_SECRET

- **Description**: Secret client OAuth Google
- **Type**: String
- **Obtenir**: https://console.cloud.google.com/apis/credentials
- **Exemple**: `GOCSPX-1234567890abcdefghijklm`
- **Sécurité**: CRITIQUE

### GOOGLE_APPLICATION_CREDENTIALS

- **Description**: Chemin vers le fichier service account JSON
- **Type**: String (chemin fichier)
- **Docker**: `/app/config/google-service-account.json`
- **Local**: `./backend/config/google-service-account.json`
- **Obtenir**: https://console.cloud.google.com/iam-admin/serviceaccounts
- **Fichier**: Télécharger la clé JSON du service account

## 🖼️ Stockage images (Cloudinary)

### CLOUDINARY_CLOUD_NAME

- **Description**: Nom de compte Cloudinary
- **Type**: String
- **Obtenir**: https://cloudinary.com/console
- **Exemple**: `velya-storage`
- **Utilisation**: Upload et stockage des photos

### CLOUDINARY_API_KEY

- **Description**: Clé API Cloudinary
- **Type**: String (digits)
- **Obtenir**: https://cloudinary.com/console/settings
- **Exemple**: `123456789012345`
- **Sécurité**: Moyenne (API key)

### CLOUDINARY_API_SECRET

- **Description**: Secret API Cloudinary
- **Type**: String
- **Obtenir**: https://cloudinary.com/console/settings
- **Sécurité**: CRITIQUE

## 🗺️ Cartes (Google Maps)

### GOOGLE_MAPS_API_KEY

- **Description**: Clé API Google Maps
- **Type**: String
- **Obtenir**: https://console.cloud.google.com/google/maps-apis
- **Configuration requise**:
  - Activer: Maps JavaScript API, Places API
  - Restrictions: HTTP referrers pour `velya.ca`
- **Visibilité**: Publique (mais sécurisée par restrictions)
- **Coût**: À vérifier (utilisation payante)

## 🌐 Configuration d'URL

### FRONTEND_URL

- **Description**: URL du frontend
- **Type**: String (URL complète)
- **Exemple**: `https://velya.ca`
- **Utilisation**: Emails, redirections

### CLIENT_URL

- **Description**: URL client (alias pour FRONTEND_URL)
- **Type**: String (URL complète)
- **Exemple**: `https://velya.ca`
- **Notes**: Même valeur que FRONTEND_URL

### BACKEND_URL

- **Description**: URL de l'API backend
- **Type**: String (URL complète)
- **Exemple**: `https://api.velya.ca`
- **Utilisation**: Appels API depuis le frontend

## 🚀 Serveur

### PORT

- **Description**: Port du serveur backend
- **Type**: Number
- **Valeur**: `5001` (production)
- **Notes**: Nginx écoute sur 80/443 et forward vers 5001

### NODE_ENV

- **Description**: Environnement Node.js
- **Type**: String
- **Valeur**: `production`
- **Autres valeurs**: `development`, `staging`, `test`
- **Impact**: Affecte logging, performance, cache

## 📊 Monitoring (Optionnel)

### SENTRY_DSN

- **Description**: DSN pour Sentry error tracking
- **Type**: String (URL Sentry)
- **Obtenir**: https://sentry.io/ (optionnel)
- **Exemple**: `https://key@o1234567.ingest.sentry.io/9876543`
- **Utilisation**: Suivi des erreurs en production

### ENABLE_PAYMENT_MONITORING

- **Description**: Activer le monitoring des paiements
- **Type**: Boolean
- **Valeur**: `true` (production)

### PAYMENT_CHECK_INTERVAL

- **Description**: Intervalle de vérification des paiements (ms)
- **Type**: Number
- **Valeur**: `3600` (1 heure)
- **Notes**: Cron job pour vérifier les paiements manqués

## 📋 Checklist de configuration

### Avant le déploiement

```bash
# Vérifier que .env.production existe
[ -f .env.production ] && echo "✓" || echo "✗"

# Vérifier qu'il n'y a pas de clés exemple
grep -c "YOUR_.*_HERE" .env.production && echo "✗ Clés manquantes" || echo "✓ Prêt"

# Vérifier la sécurité
grep "monSuperSecret" .env.production && echo "✗ Secret faible" || echo "✓ Sécurisé"
```

### Test des connections

```bash
# MongoDB
mongo "mongodb://user:pass@host:27017/velya"

# Mailgun
curl --user "api:YOUR_API_KEY" \
  https://api.mailgun.net/v3/YOUR_DOMAIN/messages

# Stripe
curl https://api.stripe.com/v1/balance \
  -u sk_live_YOUR_KEY:

# Google
curl "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=YOUR_TOKEN"
```

## 🔄 Rotation des secrets

### Processus recommandé

1. **Générer nouvelles clés** dans les services respectifs
2. **Créer nouveau .env.production.bak** (backup)
3. **Mettre à jour .env.production** avec nouvelles clés
4. **Redémarrer les services**: `docker-compose -f docker-compose.prod.yml restart`
5. **Tester les fonctionnalités** affectées
6. **Archiver l'ancienne clé** (rotation de logs)

### Clés critiques (changer tous les 6 mois)

- JWT_SECRET
- MongoDB password
- Stripe API keys
- Google OAuth secrets
- Mailgun API key
- Cloudinary API secret

## 📞 Troubleshooting

### Erreur: "Invalid API Key"

```
Solution: Vérifier que la clé est valide dans le service (Dashboard)
         Vérifier qu'elle n'a pas expiré
         Tester avec curl
```

### Erreur: "MongoDB connection refused"

```
Solution: Vérifier MONGO_URI
         docker-compose -f docker-compose.prod.yml logs mongodb
         Vérifier que mongodb est en ligne
```

### Erreur: "STRIPE_SECRET_KEY is not set"

```
Solution: Vérifier que .env.production est chargé
         Vérifier qu'il n'y a pas de quotes supplémentaires
         docker-compose -f docker-compose.prod.yml exec backend env | grep STRIPE
```

## 📖 Références

- Stripe API: https://stripe.com/docs/api
- Mailgun API: https://documentation.mailgun.com/
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Cloudinary: https://cloudinary.com/documentation
- MongoDB: https://docs.mongodb.com/manual/
