# Guide de Monitoring et Maintenance Velya

## 📊 Monitoring en temps réel

### Logs des services

```bash
# Tous les logs
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mongodb
docker-compose -f docker-compose.prod.yml logs -f nginx

# Dernières 50 lignes
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### Status des conteneurs

```bash
# Status global
docker-compose -f docker-compose.prod.yml ps

# Détails ressources
docker stats

# Informations détaillées
docker inspect <container-name>
```

### Santé des services

```bash
# Backend health check
curl -i https://api.velya.ca/api/health

# MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongosh -u velya_admin -p --eval "db.adminCommand('ping')"

# Nginx
curl -i https://velya.ca
```

## 🔧 Maintenance courante

### Sauvegarde MongoDB

```bash
# Sauvegarde manuelle
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --out /data/backups/$(date +%Y%m%d_%H%M%S)

# Télécharger la sauvegarde
docker cp velya_mongodb_1:/data/backups ./backups

# Restaurer
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongorestore /data/backups/DUMP_NAME
```

### Nettoyage des logs

```bash
# Voir la taille des logs
du -sh /var/lib/docker/containers/*/

# Nettoyer les anciens logs
docker system prune -a

# Limiter la taille des logs (docker-compose.prod.yml)
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

### Redémarrages

```bash
# Redémarrer tous les services
docker-compose -f docker-compose.prod.yml restart

# Redémarrer un service spécifique
docker-compose -f docker-compose.prod.yml restart backend

# Redémarrage doux avec versioning
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Mises à jour

```bash
# Mettre à jour les images
docker-compose -f docker-compose.prod.yml pull

# Rebuild et redémarrer
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Sécurité

### Certaines meilleures pratiques

```bash
# Vérifier les vulnérabilités des images
docker scan <image-name>

# Mettre à jour les images de base
docker pull nginx:alpine
docker pull node:18-alpine
docker pull mongo:6.0-alpine

# Vérifier les certificats SSL
curl -v https://velya.ca 2>&1 | grep -E "issuer|subject|dates"

# Certbot
certbot certificates
```

### Fail2Ban pour SSH

```bash
# Installer
apt-get install fail2ban

# Configuration basique (/etc/fail2ban/jail.local)
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

# Redémarrer
systemctl restart fail2ban

# Vérifier les bans
fail2ban-client status sshd
```

## 📈 Monitoring avancé

### Avec Prometheus + Grafana (Optionnel)

```yaml
# Ajouter au docker-compose.prod.yml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-storage:/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana-storage:/var/lib/grafana

volumes:
  prometheus-storage:
  grafana-storage:
```

### ELK Stack pour les logs (Optionnel)

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
  environment:
    - discovery.type=single-node
  volumes:
    - elasticsearch-data:/usr/share/elasticsearch/data

kibana:
  image: docker.elastic.co/kibana/kibana:7.17.0
  ports:
    - "5601:5601"
```

## 🚨 Alertes et notifications

### Configuration email pour alertes

Créer `alert-webhook.sh`:

```bash
#!/bin/bash
# Appeler cette fonction en cas d'erreur

send_alert() {
    local subject=$1
    local message=$2
    
    curl -s --user "api:YOUR_MAILGUN_KEY" \
      https://api.mailgun.net/v3/YOUR_DOMAIN/messages \
      -F from="alerts@velya.ca" \
      -F to="admin@velya.ca" \
      -F subject="🚨 $subject" \
      -F text="$message"
}

# Exemple d'utilisation
docker-compose -f docker-compose.prod.yml ps | grep -q "Exit" && \
  send_alert "Conteneur arrêté" "Vérifiez docker-compose.prod.yml logs"
```

### Cron job de monitoring

```bash
# /etc/cron.d/velya-monitor
*/5 * * * * root /usr/local/bin/velya-monitor.sh >> /var/log/velya-monitor.log 2>&1
```

## 📋 Checklist de maintenance mensuelle

- [ ] Mettre à jour les images Docker
- [ ] Vérifier la santé de tous les services
- [ ] Tester la sauvegarde MongoDB
- [ ] Vérifier les certificats SSL (valide > 30 jours)
- [ ] Nettoyer les anciens logs et données
- [ ] Vérifier l'utilisation disque
- [ ] Tester la restauration de base de données
- [ ] Vérifier les alertes de sécurité
- [ ] Réduire les droit d'accès si nécessaire
- [ ] Documenter les changements

## 🐛 Dépannage courant

### Backend ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs backend

# Erreur courante: Port déjà utilisé
lsof -i :5001
kill -9 <PID>

# Erreur MongoDB: vérifier la connexion
docker-compose -f docker-compose.prod.yml logs mongodb
```

### MongoDB lent

```bash
# Vérifier les indices
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongosh -u velya_admin -p << 'EOF'
use velya
db.collection.getIndexes()
db.collection.stats()
EOF

# Optimiser les collections
db.collection.reIndex()
```

### Certificat SSL expiré

```bash
# Vérifier la date
openssl x509 -in /etc/letsencrypt/live/velya.ca/cert.pem -noout -dates

# Renouveler manuellement
certbot renew --force-renewal

# Redémarrer Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Espace disque plein

```bash
# Vérifier l'utilisation
df -h

# Nettoyer Docker
docker system prune -a

# Supprimer les volumes orphelins
docker volume prune

# Archiver les anciens logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/containers/
```

## 📞 Support et escalade

Pour les problèmes critiques:

1. Vérifier les logs: `docker-compose -f docker-compose.prod.yml logs`
2. Vérifier la santé: `docker-compose -f docker-compose.prod.yml ps`
3. Restart des services: `docker-compose -f docker-compose.prod.yml restart`
4. Contacter le support si le problème persiste
