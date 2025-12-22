#!/bin/bash

# ============================================
# VELYA - SUIVI DES LOGS
# ============================================

SERVICE="${1:-all}"

echo "📋 LOGS VELYA"
echo "======================================"
echo "Service: $SERVICE"
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

case $SERVICE in
    backend)
        echo "📕 Logs Backend:"
        docker-compose -f docker-compose.prod.yml logs -f backend
        ;;
    frontend)
        echo "📗 Logs Frontend:"
        docker-compose -f docker-compose.prod.yml logs -f frontend
        ;;
    mongodb)
        echo "📘 Logs MongoDB:"
        docker-compose -f docker-compose.prod.yml logs -f mongodb
        ;;
    nginx)
        echo "📙 Logs Nginx:"
        docker-compose -f docker-compose.prod.yml logs -f nginx
        ;;
    all)
        echo "📚 Tous les logs:"
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    *)
        echo "❌ Service inconnu: $SERVICE"
        echo "Services disponibles: backend, frontend, mongodb, nginx, all"
        exit 1
        ;;
esac
