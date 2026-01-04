# Guide de Configuration HTTPS/TLS avec Let's Encrypt

## 1. Générer les certificats SSL (Let's Encrypt)

### Option 1: Utiliser Certbot (Recommandé)

```bash
# Installer Certbot
# Windows: télécharger depuis https://certbot.eff.org
# Mac: brew install certbot
# Linux: sudo apt-get install certbot

# Générer les certificats
certbot certonly --standalone -d api.velya.ca -d velya.ca

# Les certificats seront générés dans:
# Linux/Mac: /etc/letsencrypt/live/velya.ca/
# Windows: C:\Certbot\live\velya.ca\
```

### Option 2: Utiliser Docker + Certbot

```bash
docker run -it --rm \
  -v $PWD/certbot/conf:/etc/letsencrypt \
  -v $PWD/certbot/www:/var/www/certbot \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone -d api.velya.ca
```

## 2. Configuration du Backend (Express + HTTPS)

### Modifier server.js:

```javascript
const https = require('https');
const fs = require('fs');
const app = require('./src/app');

const PORT = process.env.PORT || 5001;

// Charger les certificats SSL
let httpsServer;
try {
  const options = {
    key: fs.readFileSync('/path/to/privkey.pem'),
    cert: fs.readFileSync('/path/to/fullchain.pem'),
  };
  httpsServer = https.createServer(options, app);
  console.log('✅ HTTPS activé');
} catch (error) {
  console.warn('⚠️ Certificats SSL non trouvés, utilisant HTTP');
  const http = require('http');
  httpsServer = http.createServer(app);
}

// Servir en HTTP aussi (redirection vers HTTPS)
const http = require('http');
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, {
    'Location': 'https://' + req.headers.host + req.url
  });
  res.end();
});

httpServer.listen(80, () => {
  console.log('✅ HTTP → HTTPS redirection sur port 80');
});

httpsServer.listen(PORT, () => {
  console.log(`✅ Backend HTTPS écoutant sur port ${PORT}`);
});
```

## 3. Configuration Nginx (Reverse Proxy)

### Voir nginx.conf

```nginx
server {
    listen 80;
    server_name api.velya.ca velya.ca;
    
    # Redirection HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.velya.ca;
    
    # Certificats SSL
    ssl_certificate /etc/nginx/ssl/velya.ca/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/velya.ca/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    
    # Proxy vers le backend
    location / {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Configuration Docker Compose

### Ajouter aux services:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl/velya.ca/:/etc/nginx/ssl/velya.ca/:ro
      - ./ssl/dhparam.pem:/etc/nginx/dhparam.pem:ro
    depends_on:
      - backend
    networks:
      - velya-network

  backend:
    # ... configuration existante ...
    environment:
      - NODE_ENV=production
      - PORT=5001
    networks:
      - velya-network

networks:
  velya-network:
    driver: bridge
```

## 5. Renouvellement Automatique des Certificats

### Script de renouvellement:

```bash
#!/bin/bash
# renewal.sh

# Renouveler les certificats
certbot renew --quiet

# Copier les certificats dans Docker (si utilisation de volumes)
if [ -f /etc/letsencrypt/live/velya.ca/fullchain.pem ]; then
  cp /etc/letsencrypt/live/velya.ca/fullchain.pem ./ssl/velya.ca/
  cp /etc/letsencrypt/live/velya.ca/privkey.pem ./ssl/velya.ca/
  
  # Redémarrer Nginx
  docker-compose -f docker-compose.prod.yml restart nginx
fi
```

### Ajouter au crontab:

```bash
# Renouvellement tous les jours à 3h du matin
0 3 * * * /path/to/renewal.sh >> /var/log/certbot-renewal.log 2>&1
```

## 6. Vérification

### Tester la configuration HTTPS:

```bash
# Vérifier le certificat
openssl s_client -connect api.velya.ca:443

# Tester le score SSL
curl -I https://api.velya.ca/api/health

# Vérifier avec SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=api.velya.ca
```

## 7. Checklist de Sécurité HTTPS

- [ ] Certificats SSL/TLS obtenus et installés
- [ ] HTTP redirige vers HTTPS
- [ ] TLS 1.2+ configuré (pas SSL 3.0 ou TLS 1.0)
- [ ] Certificats renouvelés automatiquement
- [ ] HSTS activé (Strict-Transport-Security)
- [ ] Test SSL Labs: Score A ou supérieur
- [ ] Certificate pinning pour les clients critiques (optionnel)
- [ ] Monitoring du renouvellement des certificats

## 8. Dépannage

### Erreur: "Certificate verify failed"
```bash
# Vérifier que le certificat est valid
openssl x509 -in /etc/letsencrypt/live/velya.ca/fullchain.pem -noout -dates
```

### Nginx: "SSL certificate problem"
```bash
# S'assurer que les chemins des certificats sont corrects
docker exec velya_nginx nginx -t
```

### Renouvellement échoué
```bash
# Vérifier les logs Certbot
certbot renew --dry-run -v
```
