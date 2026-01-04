# Production Configuration Best Practices

Ce fichier documente la configuration optimale pour la production.

## 📋 .env.production (Template)

```env
# ===== ENVIRONMENT =====
NODE_ENV=production
PORT=5001

# ===== HTTPS/TLS =====
USE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/velya.ca/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/velya.ca/privkey.pem

# ===== SÉCURITÉ - SECRETS =====
# GÉNÉRER: openssl rand -base64 32
JWT_SECRET=your-very-long-random-32-char-secret-here
SESSION_SECRET=your-very-long-random-32-char-secret-here
CSRF_SECRET=your-very-long-random-32-char-secret-here

# ===== BASE DE DONNÉES =====
# Format: mongodb+srv://user:pass@cluster.mongodb.net/database
MONGO_URI=mongodb+srv://velya_user:very_strong_password@cluster.mongodb.net/velya?retryWrites=true&w=majority

# ===== REDIS CACHE =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password-here

# ===== PAIEMENTS - STRIPE (LIVE KEYS ONLY) =====
# Obtenir depuis: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_your_public_key

# ===== MONITORING - SENTRY =====
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production

# ===== FICHIERS - CLOUDINARY =====
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# ===== GOOGLE SERVICES =====
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.velya.ca/api/auth/google/callback
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# ===== EMAIL - MAILGUN =====
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.velya.ca
EMAIL_FROM=noreply@velya.ca

# ===== FRONTEND =====
FRONTEND_URL=https://velya.ca
BACKEND_URL=https://api.velya.ca

# ===== LOGGING =====
LOG_LEVEL=info

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐳 Docker Compose Production

```yaml
version: '3.8'

services:
  # Backend Node.js
  backend:
    image: velya-backend:latest
    container_name: velya_backend
    environment:
      - NODE_ENV=production
      - PORT=5001
    env_file:
      - .env.production
    volumes:
      - ./ssl:/app/ssl:ro
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    ports:
      - "5001:5001"
    depends_on:
      - mongodb
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - velya-network
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"

  # Frontend React
  frontend:
    image: velya-frontend:latest
    container_name: velya_frontend
    environment:
      - NODE_ENV=production
    volumes:
      - ./frontend/build:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - backend
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:443"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - velya-network
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  # MongoDB
  mongodb:
    image: mongo:7
    container_name: velya_mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: velya_admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: velya
    volumes:
      - mongo_data:/data/db
      - ./backups/mongodb:/data/backups
    ports:
      - "27017:27017"
    restart: always
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - velya-network
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: velya_redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - velya-network
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

volumes:
  mongo_data:
  redis_data:

networks:
  velya-network:
    driver: bridge
```

## 📝 Nginx Configuration (Production)

Voir `nginx.conf` dans le repository. Points clés:

```nginx
# HTTPS uniquement
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    
    # SSL certificates
    ssl_certificate /etc/nginx/ssl/velya.ca/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/velya.ca/privkey.pem;
    
    # Modern SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API caching
    location /api {
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 5m;
        proxy_pass http://backend:5001;
    }
}
```

## 🔐 Secrets Management

**Jamais en plaintext:**

```bash
# ❌ MAUVAIS
export JWT_SECRET="my-secret-here"
echo $JWT_SECRET

# ✅ BON
export JWT_SECRET=$(openssl rand -base64 32)
# Stocker dans AWS Secrets Manager, Docker Secrets, ou vault
```

## 📊 Monitoring Commands

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Vérifier la santé
curl https://api.velya.ca/api/health

# Vérifier les circuit breakers
curl https://api.velya.ca/api/health/breakers

# MongoDB
docker-compose exec mongodb mongosh -u velya_admin -p --eval "db.adminCommand('ping')"

# Redis
docker-compose exec redis redis-cli ping

# Utilisation disque
docker system df

# Utilisation mémoire
docker stats
```

## 🔄 Backup & Restore

```bash
# Backup MongoDB quotidien
docker-compose exec -T mongodb mongodump --out /data/backups/$(date +%Y%m%d_%H%M%S)

# Restore
docker-compose exec -T mongodb mongorestore /data/backups/BACKUP_NAME

# Vérifier les backups
ls -lah ./backups/mongodb/
```

## 🚀 Déploiement Minimal

```bash
# 1. Préparer
cp .env.production.example .env.production
# Éditer .env.production avec vrais secrets

# 2. Build images
docker build -t velya-backend:latest ./backend
docker build -t velya-frontend:latest ./frontend

# 3. Démarrer
docker-compose -f docker-compose.prod.yml up -d

# 4. Vérifier
curl https://api.velya.ca/api/health
curl https://velya.ca

# 5. Monitorer
docker-compose logs -f
```

## ⚠️ Points Critiques

- [ ] Certificats SSL valides et à jour
- [ ] Variables d'environnement sécurisées
- [ ] Backups automatisés et testés
- [ ] Monitoring/alertes en place
- [ ] Pas de debug mode
- [ ] Logs archivés
- [ ] Rate limiting activé
- [ ] HTTPS forcé
- [ ] HSTS activé
- [ ] Healthchecks fonctionnels
