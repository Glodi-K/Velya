#!/bin/bash

# ============================================
# VELYA - DÉPLOIEMENT PRODUCTION RAPIDE
# ============================================
# Script de déploiement automatisé pour serveur Linux/Ubuntu

set -e

# Variables
VELYA_HOME="/opt/velya"
DOMAIN="velya.ca"
EMAIL="admin@velya.ca"
BACKUP_DIR="$VELYA_HOME/backups"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Vérifications préalables
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    command -v docker >/dev/null 2>&1 || log_error "Docker n'est pas installé"
    command -v docker-compose >/dev/null 2>&1 || log_error "Docker Compose n'est pas installé"
    command -v git >/dev/null 2>&1 || log_error "Git n'est pas installé"
    command -v certbot >/dev/null 2>&1 || log_warning "Certbot n'est pas installé (requis pour SSL)"
    
    log_success "Tous les prérequis sont OK"
}

# Créer répertoires
setup_directories() {
    log_info "Création des répertoires..."
    
    mkdir -p "$VELYA_HOME"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$VELYA_HOME/ssl"
    mkdir -p "$VELYA_HOME/scripts"
    mkdir -p "$VELYA_HOME/data"
    
    log_success "Répertoires créés"
}

# Cloner le repo
clone_repository() {
    log_info "Clonage du repository..."
    
    if [ -d "$VELYA_HOME/.git" ]; then
        log_warning "Repository déjà existant, pull au lieu de clone"
        cd "$VELYA_HOME"
        git pull origin rename-cleaningapp-to-velya
    else
        cd "$VELYA_HOME"
        git clone -b rename-cleaningapp-to-velya \
            https://github.com/kevinmulamba/cleaningApp-frontend.git .
    fi
    
    log_success "Repository cloné"
}

# Configurer .env.production
setup_environment() {
    log_info "Configuration des variables d'environnement..."
    
    if [ ! -f "$VELYA_HOME/.env.production" ]; then
        log_error ".env.production n'existe pas. Créez-le en copiant .env.production.example"
    fi
    
    # Vérifier que les secrets ne sont pas des placeholders
    if grep -q "YOUR_" "$VELYA_HOME/.env.production"; then
        log_error "Secrets non configurés! Remplissez les valeurs YOUR_*_HERE dans .env.production"
    fi
    
    log_success "Variables d'environnement OK"
}

# Générer certificats SSL
setup_ssl() {
    log_info "Vérification des certificats SSL..."
    
    if [ ! -f "$VELYA_HOME/ssl/cert.pem" ] || [ ! -f "$VELYA_HOME/ssl/key.pem" ]; then
        log_warning "Certificats SSL non trouvés"
        log_info "Génération avec Let's Encrypt..."
        
        bash "$VELYA_HOME/ssl/generate-certificates.sh" || \
            log_error "Erreur lors de la génération des certificats"
    fi
    
    log_success "Certificats SSL OK"
}

# Builder les images
build_images() {
    log_info "Construction des images Docker..."
    
    cd "$VELYA_HOME"
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log_success "Images construites"
}

# Démarrer les services
start_services() {
    log_info "Démarrage des services..."
    
    cd "$VELYA_HOME"
    docker-compose -f docker-compose.prod.yml up -d
    
    # Attendre que MongoDB soit prêt
    log_info "Attente de MongoDB..."
    sleep 5
    
    docker-compose -f docker-compose.prod.yml exec -T mongodb mongosh \
        --eval "db.adminCommand('ping')" > /dev/null 2>&1 || \
        log_error "MongoDB ne répond pas"
    
    log_success "Services démarrés"
}

# Initialiser la base de données
init_database() {
    log_info "Initialisation de la base de données..."
    
    bash "$VELYA_HOME/scripts/init-mongodb.sh"
    
    log_success "Base de données initialisée"
}

# Tests de santé
health_checks() {
    log_info "Vérification de la santé des services..."
    
    bash "$VELYA_HOME/scripts/health-check.sh"
    
    log_success "Health checks OK"
}

# Menu principal
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   VELYA - SCRIPT DE DÉPLOIEMENT PRODUCTION         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_info "Démarrage du déploiement..."
    
    check_prerequisites
    setup_directories
    clone_repository
    setup_environment
    setup_ssl
    build_images
    start_services
    init_database
    health_checks
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ DÉPLOIEMENT COMPLÉTÉ AVEC SUCCÈS!             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Prochaines étapes:${NC}"
    echo "  1. Configurer DNS: velya.ca -> $SERVER_IP"
    echo "  2. Monitorer les logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  3. Tester les services: curl https://api.velya.ca/api/health"
    echo ""
}

# Exécution
main "$@"
