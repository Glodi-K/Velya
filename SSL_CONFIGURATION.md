# Configuration SSL/TLS pour Velya

## Obtenir les certificats Let's Encrypt

### Option 1: Avec Certbot (Recommandé)

```bash
# Installation
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Générer les certificats
sudo certbot certonly --standalone \
  -d velya.ca \
  -d api.velya.ca \
  -d www.velya.ca \
  -m admin@velya.ca \
  --agree-tos

# Les certificats se trouvent à:
# /etc/letsencrypt/live/velya.ca/
```

### Option 2: Avec Docker + Certbot

```bash
# Générer certificats avec Docker
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly \
  --standalone \
  -d velya.ca \
  -d api.velya.ca \
  -m admin@velya.ca \
  --agree-tos
```

## Structure des certificats

Créez le dossier pour les certificats:

```bash
mkdir -p ./ssl
cp /etc/letsencrypt/live/velya.ca/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/velya.ca/privkey.pem ./ssl/key.pem

chmod 600 ./ssl/key.pem
chmod 644 ./ssl/cert.pem
```

## Configuration Nginx

Le `nginx.conf` inclut déjà:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;

# SSL moderne
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

## Renouvellement automatique des certificats

### Avec systemd timer

```bash
# Créer le script de renouvellement
sudo tee /usr/local/bin/renew-certs.sh > /dev/null << 'EOF'
#!/bin/bash
certbot renew --quiet
docker-compose -f /path/to/docker-compose.prod.yml restart nginx
EOF

sudo chmod +x /usr/local/bin/renew-certs.sh

# Créer le timer
sudo tee /etc/systemd/system/renew-certs.timer > /dev/null << 'EOF'
[Unit]
Description=Renew Let's Encrypt certificates daily
After=network.target

[Timer]
OnBootSec=1h
OnUnitActiveSec=1d
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Activer
sudo systemctl daemon-reload
sudo systemctl enable renew-certs.timer
sudo systemctl start renew-certs.timer
```

### Avec Docker (Alternative)

```yaml
# Dans docker-compose.prod.yml
certbot:
  image: certbot/certbot
  volumes:
    - ./ssl:/etc/letsencrypt
  entrypoint: /bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; sleep 12h & wait $${!}; done'
```

## Vérification

```bash
# Vérifier les certificats
sudo certbot certificates

# Tester la configuration SSL
curl -I https://velya.ca

# Score SSL
# Aller sur: https://www.ssllabs.com/ssltest/analyze.html?d=velya.ca
```

## Notes de sécurité

- ✅ Let's Encrypt = gratuit et automatisé
- ✅ Certificats valides 90 jours (auto-renouvellement)
- ✅ Support TLS 1.2 et 1.3
- ✅ A+ rating sur SSL Labs possible

## Dépannage

### Erreur "Unable to locate certificate"

```bash
# Vérifier les fichiers
ls -la /etc/letsencrypt/live/velya.ca/

# Régénérer si nécessaire
sudo certbot delete --cert-name velya.ca
# Puis relancer le processus de création
```

### Erreur "Port 80 already in use"

```bash
# Arrêter les services avant Certbot
docker-compose -f docker-compose.prod.yml down
# Générer les certificats
# Relancer les services
docker-compose -f docker-compose.prod.yml up -d
```
