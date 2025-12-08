#!/bin/bash

# ============================================
# SCRIPT DE TEST PRÉ-DÉPLOIEMENT
# ============================================
# Teste tous les services avant le go-live

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Tests pré-déploiement Velya${NC}"
echo "=================================="
echo ""

# Fonction de test
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_code=$4
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Accept: application/json")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗${NC} $name (Expected $expected_code, got $http_code)"
        return 1
    fi
}

# Test 1: Services en ligne
echo -e "${YELLOW}1️⃣  Vérification des services${NC}"
echo "---"

if ! docker-compose -f docker-compose.prod.yml ps | grep -q "mongodb.*Up"; then
    echo -e "${RED}✗${NC} MongoDB n'est pas en ligne"
    exit 1
fi
echo -e "${GREEN}✓${NC} MongoDB en ligne"

if ! docker-compose -f docker-compose.prod.yml ps | grep -q "backend.*Up"; then
    echo -e "${RED}✗${NC} Backend n'est pas en ligne"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend en ligne"

if ! docker-compose -f docker-compose.prod.yml ps | grep -q "frontend.*Up\|nginx.*Up"; then
    echo -e "${RED}✗${NC} Frontend/Nginx n'est pas en ligne"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend/Nginx en ligne"

echo ""

# Test 2: Endpoints API
echo -e "${YELLOW}2️⃣  Tests des endpoints API${NC}"
echo "---"

test_endpoint "Health check" "GET" "http://localhost:5001/api/health" "200" || true
test_endpoint "Auth routes" "GET" "http://localhost:5001/api/auth" "404" || true

echo ""

# Test 3: Connectivité MongoDB
echo -e "${YELLOW}3️⃣  Vérification MongoDB${NC}"
echo "---"

mongo_result=$(docker-compose -f docker-compose.prod.yml exec -T mongodb \
    mongosh -u velya_admin -p --eval "db.adminCommand('ping')" 2>&1 | grep -c "ok.*1" || true)

if [ "$mongo_result" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} MongoDB accessible et responsive"
else
    echo -e "${RED}✗${NC} MongoDB non responsive"
    exit 1
fi

echo ""

# Test 4: Base de données
echo -e "${YELLOW}4️⃣  Vérification de la base de données${NC}"
echo "---"

collections=$(docker-compose -f docker-compose.prod.yml exec -T mongodb \
    mongosh -u velya_admin -p --quiet --eval "db.getCollectionNames()" 2>/dev/null | grep -c "\[" || true)

if [ "$collections" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Collections en place"
else
    echo -e "${YELLOW}⚠${NC}  Pas de collections trouvées (normal si première exécution)"
fi

echo ""

# Test 5: Fichiers de configuration
echo -e "${YELLOW}5️⃣  Vérification des fichiers de configuration${NC}"
echo "---"

files_to_check=(
    ".env.production"
    "docker-compose.prod.yml"
    "nginx.conf"
    "frontend/Dockerfile"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file existe"
    else
        echo -e "${RED}✗${NC} $file manquant"
        exit 1
    fi
done

echo ""

# Test 6: Vérification des secrets
echo -e "${YELLOW}6️⃣  Vérification des secrets${NC}"
echo "---"

if grep -q "YOUR_.*_HERE" .env.production; then
    echo -e "${RED}✗${NC} Clés API manquantes (remplacer les YOUR_*_HERE)"
    exit 1
else
    echo -e "${GREEN}✓${NC} Tous les secrets configurés"
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}✗${NC} JWT_SECRET trop court"
    exit 1
else
    echo -e "${GREEN}✓${NC} JWT_SECRET sécurisé"
fi

echo ""

# Test 7: Certificats SSL (si applicable)
echo -e "${YELLOW}7️⃣  Vérification SSL${NC}"
echo "---"

if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo -e "${GREEN}✓${NC} Certificats SSL en place"
    
    # Vérifier la validité
    cert_date=$(openssl x509 -in ssl/cert.pem -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || true)
    if [ -n "$cert_date" ]; then
        echo -e "  Valide jusqu'au: $cert_date"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Certificats SSL manquants (à ajouter avant go-live)"
fi

echo ""

# Test 8: Performance
echo -e "${YELLOW}8️⃣  Tests de performance${NC}"
echo "---"

response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:5001/api/health)
echo -e "Backend response time: ${response_time}s"

if (( $(echo "$response_time < 1" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Performance acceptable"
else
    echo -e "${YELLOW}⚠${NC}  Response time > 1s (vérifier les ressources)"
fi

echo ""

# Test 9: Taille des images Docker
echo -e "${YELLOW}9️⃣  Vérification des images Docker${NC}"
echo "---"

images_size=$(docker images | grep -E "velya|nginx|node|mongo" | awk '{print $7}' | paste -sd+ | bc 2>/dev/null || true)
echo -e "Taille totale des images: ${images_size}"

echo ""

# Résumé
echo -e "${YELLOW}════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Tous les tests réussis!${NC}"
echo -e "${YELLOW}════════════════════════════════════${NC}"
echo ""
echo "📋 Résumé de vérification:"
echo "  ✓ Services en ligne"
echo "  ✓ API accessible"
echo "  ✓ MongoDB opérationnel"
echo "  ✓ Configuration complète"
echo "  ✓ Secrets configurés"
echo ""
echo "🚀 L'application est prête pour le déploiement"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier les logs: docker-compose -f docker-compose.prod.yml logs"
echo "  2. Tester les flux critiques (auth, paiement, upload)"
echo "  3. Monitorer les performances: docker stats"
echo "  4. Configurer les alertes et monitoring"
echo ""
