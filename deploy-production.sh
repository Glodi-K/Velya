#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT VELYA
# ============================================
# Usage: ./deploy-production.sh

set -e

echo "🚀 Démarrage du déploiement Velya..."

# Vérifications préalables
echo "📋 Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant"
    echo "   Créez-le avec: cp .env.production.example .env.production"
    exit 1
fi

if [ ! -f "backend/config/google-service-account.json" ]; then
    echo "⚠️  Avertissement: google-service-account.json manquant"
fi

# Vérifications de sécurité
echo "🔐 Vérifications de sécurité..."

JWT_SECRET=$(grep "^JWT_SECRET=" .env.production | cut -d= -f2)
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "❌ JWT_SECRET trop court (min 32 caractères)"
    exit 1
fi

if grep -q "YOUR_.*_HERE" .env.production; then
    echo "❌ Clés d'API manquantes dans .env.production"
    echo "   Remplissez toutes les valeurs YOUR_*_HERE"
    exit 1
fi

# Arrêter les anciens conteneurs
echo "🛑 Arrêt des anciens conteneurs..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build
echo "🏗️  Build des images Docker..."
docker-compose -f docker-compose.prod.yml build

# Démarrage
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage des services (30s)..."
sleep 30

# Vérifications de santé
echo "🏥 Vérification de la santé des services..."

if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
    echo "⚠️  Certains services ne sont pas sains"
    docker-compose -f docker-compose.prod.yml logs --tail=20
fi

echo "✅ Vérification de MongoDB..."
docker-compose -f docker-compose.prod.yml exec -T mongodb mongosh -u velya_admin -p --eval "db.adminCommand('ping')" 2>/dev/null || {
    echo "❌ MongoDB n'est pas accessible"
    docker-compose -f docker-compose.prod.yml logs mongodb --tail=20
    exit 1
}

echo "✅ Vérification du Backend..."
if ! curl -f http://localhost:5001/api/health &> /dev/null; then
    echo "⚠️  Backend non accessible via health check"
    docker-compose -f docker-compose.prod.yml logs backend --tail=20
fi

# Logs
echo ""
echo "📊 Logs des services (dernières 10 lignes):"
echo "========================================"
docker-compose -f docker-compose.prod.yml logs --tail=10

echo ""
echo "✅ Déploiement réussi!"
echo ""
echo "📋 Status des services:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 URLs:"
echo "  Frontend: https://velya.ca"
echo "  API: https://api.velya.ca"
echo "  Mailgun Dashboard: https://app.mailgun.com"
echo ""
echo "💡 Commandes utiles:"
echo "  Logs en temps réel:   docker-compose -f docker-compose.prod.yml logs -f"
echo "  Redémarrer:           docker-compose -f docker-compose.prod.yml restart"
echo "  Arrêter:              docker-compose -f docker-compose.prod.yml down"
echo "  Backup MongoDB:       docker-compose -f docker-compose.prod.yml exec mongodb mongodump --out /backup"
echo ""
