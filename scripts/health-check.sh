#!/bin/bash

# ============================================
# VELYA - VÉRIFICATION SANTÉ DES SERVICES
# ============================================

BACKEND_URL="${BACKEND_URL:-https://api.velya.ca}"
FRONTEND_URL="${FRONTEND_URL:-https://velya.ca}"

echo "🏥 VÉRIFICATION SANTÉ - VELYA"
echo "======================================"
echo "Timestamp: $(date)"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2
    
    echo -n "Vérification $name... "
    
    if curl -s -f -L "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ ERREUR${NC}"
        return 1
    fi
}

# Vérifier les services
echo "📡 Services Web:"
check_service "Backend" "$BACKEND_URL/api/health"
backend_status=$?

check_service "Frontend" "$FRONTEND_URL"
frontend_status=$?

# Vérifier Docker
echo ""
echo "🐳 Docker Compose:"
if command -v docker-compose &> /dev/null; then
    docker_status=$(docker-compose -f docker-compose.prod.yml ps 2>/dev/null | grep -c "Up" || echo "0")
    services_count=$(docker-compose -f docker-compose.prod.yml config --services 2>/dev/null | wc -l)
    
    echo "   Services actifs: $docker_status/$services_count"
    
    if [ "$docker_status" == "$services_count" ]; then
        echo -e "   ${GREEN}✅ Tous les services sont en cours d'exécution${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Certains services sont inactifs${NC}"
        docker-compose -f docker-compose.prod.yml ps
    fi
fi

# Résumé
echo ""
echo "📊 Résumé:"
if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les services sont opérationnels${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains services ne répondent pas${NC}"
    exit 1
fi
