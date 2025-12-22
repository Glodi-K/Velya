# 🚀 GUIDE DE DÉPLOIEMENT VELYA

## 📋 Pré-requis

- Docker & Docker Compose
- Domain name (velya.ca)
- SSL Certificates (Let's Encrypt recommandé)
- Services externes configurés:
  - MongoDB Atlas ou instance MongoDB
  - Stripe (Production keys)
  - Mailgun (Production API)
  - Google OAuth & Maps APIs
  - Cloudinary

## 🔧 Configuration Production

### 1. Préparer les variables d'environnement

```bash
cp .env.production.example .env.production
# Éditer .env.production avec vos clés PRODUCTION
```

### 2. Générer des clés sécurisées

```bash
# JWT Secret (minimum 32 caractères)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MongoDB Password - Utilisez un gestionnaire de secrets
```

### 3. Configurer les certificats SSL

```bash
# Option 1: Let's Encrypt avec Certbot
mkdir -p certbot/conf certbot/www
certbot certonly --webroot -w certbot/www -d velya.ca -d api.velya.ca

# Option 2: Utiliser des certificats existants
# Placer les certs dans ./ssl/velya.ca/
```

### 4. Mettre à jour nginx.conf pour HTTPS

```nginx
# Si vous avez des certificats SSL:
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/velya.ca/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/velya.ca/privkey.pem;

# Redirection HTTP -> HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

## 🐳 Déploiement avec Docker

### Démarrer les services

```bash
# Créer et démarrer tous les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier l'état
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Initialiser la base de données

```bash
# Se connecter au conteneur MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p changeme

# Ou utiliser MongoDB Atlas (sans conteneur local)
```

### Vérifier la santé

```bash
# Backend
curl https://api.velya.ca/api/health

# Frontend
curl https://velya.ca

# Logs Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

## 🔒 Sécurité

### Checklist de sécurité avant production

- [ ] JWT_SECRET modifié et sécurisé
- [ ] MongoDB password changé
- [ ] Tous les .env exclus du git
- [ ] CORS configuré pour domaines spécifiques
- [ ] HTTPS activé avec certificats valides
- [ ] Rate limiting activé
- [ ] Headers de sécurité configurés
- [ ] Sauvegardes MongoDB automatisées
- [ ] Monitoring & logs centralisés
- [ ] Firewall configuré (ports 80, 443 uniquement)

## 📊 Monitoring

### Logs centralisés

```bash
# Avec ELK Stack ou autre:
docker logs velya-backend
docker logs velya-frontend
docker logs velya-nginx
```

### Performance

- Nginx: Monitorer les temps de réponse
- Backend: Vérifier la charge CPU/Mémoire
- MongoDB: Monitorer les connexions actives

## 🔄 Mise à jour

### Déployer une nouvelle version

```bash
# Pull les derniers changements
git pull origin main

# Reconstruire les images
docker-compose -f docker-compose.prod.yml build

# Relancer les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier le déploiement
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## 🆘 Troubleshooting

### Backend ne démarre pas

```bash
docker-compose -f docker-compose.prod.yml logs backend
# Vérifier: MONGO_URI, JWT_SECRET, Dépendances npm
```

### Frontend affiche erreur 502

```bash
# Vérifier nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Vérifier backend est accessible
docker-compose -f docker-compose.prod.yml exec nginx wget -O- http://backend:5001/api/health
```

### MongoDB connexion refusée

```bash
docker-compose -f docker-compose.prod.yml logs mongodb
# Vérifier credentials et permissions
```

## 📞 Support

Pour plus d'aide, consulter:
- Documentation MongoDB: https://docs.mongodb.com
- Docs Stripe: https://stripe.com/docs
- Nginx Docs: https://nginx.org/en/docs
