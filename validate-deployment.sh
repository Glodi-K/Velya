#!/bin/bash

# ============================================
# VELYA - SCRIPT DE VALIDATION PRE-DEPLOIEMENT
# ============================================

set -e

ERRORS=0
WARNINGS=0

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# En-tête
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VELYA - VALIDATION PRÉ-DÉPLOIEMENT              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Section 1: Infrastructure
echo -e "${BLUE}📦 Infrastructure${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "docker-compose.prod.yml" ] && pass "docker-compose.prod.yml existe" || fail "docker-compose.prod.yml manque"
[ -f "frontend/Dockerfile" ] && pass "frontend/Dockerfile existe" || fail "frontend/Dockerfile manque"
[ -f "backend/Dockerfile" ] && pass "backend/Dockerfile existe" || fail "backend/Dockerfile manque"
[ -f "nginx.conf" ] && pass "nginx.conf existe" || fail "nginx.conf manque"

# Section 2: Configuration
echo ""
echo -e "${BLUE}🔧 Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.production" ]; then
    pass ".env.production existe"
    
    if grep -q "YOUR_" ".env.production"; then
        fail ".env.production contient des placeholders (YOUR_*_HERE)"
    else
        pass "Tous les secrets semblent configurés"
    fi
    
    grep -q "JWT_SECRET=" ".env.production" && pass "JWT_SECRET configuré" || fail "JWT_SECRET manque"
    grep -q "MONGO_URI=" ".env.production" && pass "MONGO_URI configuré" || fail "MONGO_URI manque"
    grep -q "STRIPE_SECRET_KEY=" ".env.production" && pass "Stripe configuré" || fail "Stripe manque"
    grep -q "MAILGUN_API_KEY=" ".env.production" && pass "Mailgun configuré" || fail "Mailgun manque"
else
    fail ".env.production n'existe pas"
fi

# Section 3: SSL
echo ""
echo -e "${BLUE}🔐 Certificats SSL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    pass "Certificats SSL présents"
    
    # Vérifier la validité
    CERT_EXPIRY=$(openssl x509 -in ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")
    if [ "$CERT_EXPIRY" != "unknown" ]; then
        pass "Certificat valable jusqu'au: $CERT_EXPIRY"
    else
        warn "Impossible de vérifier la date d'expiration du certificat"
    fi
else
    warn "Certificats SSL manquants (optionnel en développement)"
fi

# Section 4: Documentation
echo ""
echo -e "${BLUE}📚 Documentation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "DEPLOYMENT.md" ] && pass "DEPLOYMENT.md existe" || fail "DEPLOYMENT.md manque"
[ -f "DEPLOYMENT_CHECKLIST.md" ] && pass "DEPLOYMENT_CHECKLIST.md existe" || fail "DEPLOYMENT_CHECKLIST.md manque"
[ -f "DEPLOYMENT_SUMMARY.md" ] && pass "DEPLOYMENT_SUMMARY.md existe" || fail "DEPLOYMENT_SUMMARY.md manque"

# Section 5: Scripts
echo ""
echo -e "${BLUE}🛠️  Scripts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "deploy-production.sh" ] && pass "deploy-production.sh existe" || fail "deploy-production.sh manque"
[ -f "test-production.sh" ] && pass "test-production.sh existe" || fail "test-production.sh manque"
[ -f "scripts/init-mongodb.sh" ] && pass "init-mongodb.sh existe" || fail "init-mongodb.sh manque"
[ -f "ssl/generate-certificates.sh" ] && pass "generate-certificates.sh existe" || fail "generate-certificates.sh manque"

# Section 6: Dépendances Node
echo ""
echo -e "${BLUE}📦 Dépendances${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    pass "package.json (racine) existe"
else
    warn "package.json (racine) manque"
fi

if [ -f "backend/package.json" ]; then
    pass "backend/package.json existe"
else
    fail "backend/package.json manque"
fi

if [ -f "frontend/package.json" ]; then
    pass "frontend/package.json existe"
else
    fail "frontend/package.json manque"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ VALIDATION RÉUSSIE!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ VALIDATION ÉCHOUÉE!${NC}"
    echo -e "${RED}$ERRORS erreur(s) détectée(s)${NC}"
    exit 1
fi
