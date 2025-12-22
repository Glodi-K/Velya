# Guide Post-Déploiement Velya

## ✅ Les 24 premières heures

### Monitoring immédiat (Heure 1)

```bash
# Vérifier que tous les services sont up
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs pour erreurs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Tester les endpoints critiques
curl https://velya.ca
curl https://api.velya.ca/api/health
```

### Vérifications critiques (Heure 1-2)

1. **Frontend chargeable**
   - Ouvrir https://velya.ca dans un navigateur
   - Vérifier que la page charge complètement
   - Ouvrir la console (F12) et vérifier pas d'erreurs majeures

2. **API accessible**
   - `curl https://api.velya.ca/api/health`
   - Doit retourner JSON avec status "ok"

3. **Base de données**
   ```bash
   docker-compose -f docker-compose.prod.yml exec -T mongodb \
     mongosh -u velya_admin -p --eval "db.stats()"
   ```

4. **Emails fonctionnels**
   - Créer un compte de test → Vérifier email de confirmation
   - Si pas reçu: Vérifier MAILGUN_DOMAIN est vérifié

5. **Authentification Google**
   - Tester "Login with Google"
   - Vérifier que redirect URL fonctionne

### Logs à monitorer (Toutes les heures)

```bash
# Backend
docker-compose -f docker-compose.prod.yml logs backend --since 1h --tail=50

# MongoDB
docker-compose -f docker-compose.prod.yml logs mongodb --since 1h --tail=50

# Nginx
docker-compose -f docker-compose.prod.yml logs nginx --since 1h --tail=50
```

---

## 📊 Semaine 1: Monitoring intensif

### Performance metrics

```bash
# Utilisation mémoire/CPU
docker stats

# Connexions MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongosh -u velya_admin -p --eval "db.currentOp()"
```

### Points de vérification quotidiens

```
□ Jour 1: Tout en ligne
□ Jour 2: Utilisateurs inscrits? Premiers paiements?
□ Jour 3: Aucun crash notable
□ Jour 4: Emails arrivent tous normalement
□ Jour 5: Certificats SSL valides (> 30 jours restants)
□ Jour 6: Backups MongoDB sans erreur
□ Jour 7: Test complet du flow (inscription → réservation → paiement)
```

### Tâches administratives premières semaines

1. **Créer des comptes administrateur**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend \
     node scripts/createAdmin.js
   ```

2. **Configurer les alertes**
   - Mailgun: Activer les logs
   - Stripe: Ajouter email pour notifications
   - MongoDB: Configurer alertes si possible

3. **Documenter les configurations**
   - Écrire les credentials dans un gestionnaire de secrets
   - Documenter les URLs critiques
   - Sauvegarder les backups SSL

---

## 🔄 Maintenance régulière

### Quotidienne

```bash
# Vérifier status
docker-compose -f docker-compose.prod.yml ps

# Vérifier pas d'erreurs dans les logs
docker-compose -f docker-compose.prod.yml logs --tail=50 | grep -i error
```

### Hebdomadaire

```bash
# Sauvegarde MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --out /data/backups/$(date +%Y%m%d)

# Vérifier certificats SSL
certbot certificates
```

### Mensuelle

```bash
# Mettre à jour les images
docker-compose -f docker-compose.prod.yml pull

# Rebuild
docker-compose -f docker-compose.prod.yml build

# Redéployer
docker-compose -f docker-compose.prod.yml up -d

# Vérifier tout fonctionne
bash test-production.sh
```

### Trimestrielle

```bash
# Audit de sécurité
docker scan velya_backend:latest
docker scan velya_frontend:latest

# Vérifier secrets n'ont pas fuité (GitHub)
git log --all -p | grep -i "sk_live\|api_key" || echo "OK"

# Rotation des secrets critiques
# - Générern JWT_SECRET
# - Changer MongoDB password
# - Rotation clés Stripe si nécessaire
```

---

## 🚨 Alertes à configurer

### Via email (Mailgun)

```bash
# Script de monitoring (cron)
#!/bin/bash
STATUS=$(curl -s https://api.velya.ca/api/health | grep -c "ok")
if [ "$STATUS" -eq 0 ]; then
  curl --user "api:YOUR_MAILGUN_KEY" \
    https://api.mailgun.net/v3/velya.ca/messages \
    -F from="alerts@velya.ca" \
    -F to="admin@velya.ca" \
    -F subject="🚨 Alerte: API hors ligne" \
    -F text="L'API Velya ne répond plus"
fi
```

### Intégrer à cron

```bash
# Ajouter au crontab
crontab -e

# Ajouter:
*/5 * * * * /usr/local/bin/velya-health-check.sh >> /var/log/velya-health.log 2>&1
0 3 * * * /usr/local/bin/velya-backup.sh >> /var/log/velya-backup.log 2>&1
0 3 * * 0 /usr/local/bin/velya-maintenance.sh >> /var/log/velya-maintenance.log 2>&1
```

---

## 📈 Scaling pour l'avenir

### Si trafic augmente significativement

#### Option 1: Vertical scaling (plus puissant)
```bash
# Redimensionner la machine (plus de RAM/CPU)
# Puis redéployer
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Horizontal scaling (load balancer)
```yaml
# docker-compose.prod.yml
services:
  backend-1:
    ...
  backend-2:
    ...
  backend-3:
    ...
  nginx:
    # Configure comme load balancer
```

#### Option 3: Managed services
```
- MongoDB Atlas au lieu de conteneur Docker
- Cloudflare pour CDN/DDoS
- RDS pour base de données
```

---

## 📞 Contacts essentiels

| Service | Statut | Contact |
|---------|--------|---------|
| Stripe | https://status.stripe.com | https://dashboard.stripe.com |
| Mailgun | https://status.mailgun.com | https://app.mailgun.com |
| MongoDB | https://status.cloud.mongodb.com | https://cloud.mongodb.com |
| Google Cloud | https://status.cloud.google.com | https://console.cloud.google.com |
| Cloudinary | https://status.cloudinary.com | https://cloudinary.com/dashboard |

---

## 🔒 Incident response plan

### Si Frontend ne charge pas

1. Vérifier Nginx: `docker-compose logs nginx`
2. Vérifier certificats: `openssl x509 -in ssl/cert.pem -noout -dates`
3. Vérifier DNS: `nslookup velya.ca`
4. Redémarrer: `docker-compose restart nginx`
5. Nuclear option: `docker-compose down && docker-compose up -d`

### Si API ne répond pas

1. Vérifier Backend: `docker-compose logs backend`
2. Vérifier MongoDB: `docker-compose logs mongodb`
3. Vérifier ports: `lsof -i :5001`
4. Redémarrer Backend: `docker-compose restart backend`
5. Vérifier espace disque: `df -h`

### Si MongoDB lent/cassée

1. Vérifier taille: `docker exec velya_mongodb_1 du -sh /data/db`
2. Vérifier indices: `mongosh ... --eval "db.collection.stats()"`
3. Regénérer indices si nécessaire: `mongosh ... --eval "db.collection.reIndex()"`
4. Derniers recours: Restaurer depuis backup

### Si paiements Stripe échouent

1. Vérifier la clé: `grep STRIPE .env.production | head -3`
2. Vérifier Stripe status: https://status.stripe.com
3. Vérifier les logs: `docker-compose logs backend | grep -i stripe`
4. Tester avec Stripe CLI: `stripe listen --forward-to localhost:5001/api/webhook/stripe`

---

## 📝 Logs critiques à archiver

```bash
# Après semaine 1: archiver les logs
tar -czf velya-logs-week1.tar.gz \
  $(docker-compose logs --no-log-prefix 2>/dev/null)

# Garder pour analyse/dépannage ultérieur
mkdir -p /backups/logs
mv velya-logs-week1.tar.gz /backups/logs/
```

---

## 🎓 Team documentation

Pour que votre équipe soit au courant:

1. **Créer un runbook**
   - Où sont les fichiers importants?
   - Comment vérifier la santé?
   - Comment redémarrer quoi?

2. **Créer un guide de troubleshooting**
   - Problèmes courants et solutions
   - Qui contacter pour quoi

3. **Documenter les accès**
   - Qui a accès à quoi?
   - Comment accéder aux services?
   - Quels sont les credentials partagés?

---

## ✨ Fin du déploiement!

Une fois que vous êtes passé par tous les points ci-dessus et que:

```
✅ Tous les services tournent sans erreur
✅ Utilisateurs peuvent créer des comptes
✅ Paiements fonctionnent
✅ Emails arrivent
✅ Aucun incident critique en 24h
✅ Monitoring et alertes en place
```

**Félicitations! Velya est en production! 🎉**

---

**Créé**: 4 décembre 2025
**Mise à jour**: À définir selon votre calendrier
**Responsable**: À assigner à un membre de l'équipe
