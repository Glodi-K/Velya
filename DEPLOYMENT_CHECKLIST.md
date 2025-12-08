# ✅ CHECKLIST PRÉ-DÉPLOIEMENT VELYA

## 🔒 Sécurité & Configuration

- [ ] JWT_SECRET changé et sécurisé (min 32 caractères)
- [ ] MongoDB password modifié dans .env.production
- [ ] Fichier .env.production créé (nunelé du repo)
- [ ] Clés Stripe Production testées
- [ ] Clés Mailgun vérifiées
- [ ] Google OAuth credentials valides
- [ ] Cloudinary configuré
- [ ] CORS configuré pour domaines spécifiques uniquement

## 🐳 Docker & Infrastructure

- [ ] Docker & Docker Compose installés sur le serveur
- [ ] frontend/Dockerfile créé ✓
- [ ] nginx.conf configuré ✓
- [ ] docker-compose.prod.yml prêt ✓
- [ ] SSL/TLS certificats prêts (ou Let's Encrypt configuré)
- [ ] Volumes persistants configurés (uploads, DB)

## 📁 Fichiers à vérifier

- [ ] backend/package.json - dépendances à jour
- [ ] frontend/package.json - dépendances à jour
- [ ] backend/server.js - configuration correcte
- [ ] frontend/.env.production - URLs correctes
- [ ] .gitignore - contient .env et node_modules

## 🔧 Code Nettoyage

- [x] Routes de debug supprimées
- [x] Tests unitaires supprimés
- [x] Fichiers temporaires supprimés
- [x] Console.logs de debug minimalisés
- [ ] Code inutilisé enlevé/commenté

## 📊 Tests Production

- [ ] Backend démarre sans erreurs
- [ ] Frontend compile en production
- [ ] Authentification fonctionne
- [ ] Paiements Stripe testés
- [ ] Emails d'envoi testés
- [ ] Upload de fichiers (photos) testé
- [ ] Websockets (notifications) fonctionnels
- [ ] API health endpoint répond

## 🚀 Déploiement

- [ ] Domaine configuré (velya.ca)
- [ ] DNS pointe vers le serveur
- [ ] Certificats SSL/TLS installés
- [ ] Nginx reverse proxy configuré
- [ ] MongoDB initialisé
- [ ] Backups automatiques configurés
- [ ] Monitoring activé
- [ ] Logs centralisés configurés

## 📧 Services Externes

- [ ] Mailgun domain vérifié
- [ ] Stripe webhooks configurés
- [ ] Google OAuth credentials valides
- [ ] Firebase/Storage configuré (si utilisé)
- [ ] CDN/Cloudinary configuré

## 🔄 Avant le go-live

- [ ] Tests de charge effectués
- [ ] Plan de rollback préparé
- [ ] Support on-call activé
- [ ] Monitoring alertes configurées
- [ ] Documentation déploiement à jour
- [ ] Équipe en standby pour support

## 📝 Documentation

- [x] DEPLOYMENT.md créé ✓
- [ ] README.md mis à jour
- [ ] IMPLEMENTATION_SUMMARY.md à jour
- [ ] Runbook de troubleshooting
- [ ] Process de hotfix documenté

---

## 🎯 Commandes de déploiement

```bash
# 1. Préparer l'environnement
cp .env.production.example .env.production
# Éditer .env.production

# 2. Build images
docker-compose -f docker-compose.prod.yml build

# 3. Démarrer services
docker-compose -f docker-compose.prod.yml up -d

# 4. Vérifier santé
docker-compose -f docker-compose.prod.yml ps
curl https://api.velya.ca/api/health
curl https://velya.ca

# 5. Monitorer
docker-compose -f docker-compose.prod.yml logs -f
```

---

**Statut:** 📋 À compléter avant production
**Date visée:** [À définir]
**Responsable:** [À assigner]
