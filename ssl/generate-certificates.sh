#!/bin/bash

# ============================================
# VELYA - SCRIPT GÉNÉRATION CERTIFICATS SSL
# ============================================
# Ce script génère des certificats Let's Encrypt pour velya.ca
# À exécuter sur le serveur production (Ubuntu/Debian)

set -e

echo "🔐 Génération des certificats SSL pour Velya..."
echo "================================================"

DOMAIN="velya.ca"
EMAIL="admin@velya.ca"
CERT_DIR="/opt/velya/ssl"

# Vérifier si certbot est installé
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot n'est pas installé"
    echo "Installation: sudo apt install certbot python3-certbot-nginx -y"
    exit 1
fi

# Vérifier les permissions
if [ ! -w "$CERT_DIR" ]; then
    echo "❌ Pas de permissions en écriture sur $CERT_DIR"
    echo "Exécutez avec sudo ou changez les permissions"
    exit 1
fi

echo "📍 Domaine: $DOMAIN"
echo "📧 Email: $EMAIL"
echo "📁 Répertoire: $CERT_DIR"
echo ""

# Générer les certificats
echo "⏳ Génération des certificats Let's Encrypt..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "api.$DOMAIN" \
    -m "$EMAIL" \
    --agree-tos \
    --non-interactive

# Copier les certificats dans le répertoire d'application
echo ""
echo "📋 Copie des certificats..."
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/cert.pem"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/key.pem"

# Changer les permissions
sudo chown $(whoami):$(whoami) "$CERT_DIR/cert.pem"
sudo chown $(whoami):$(whoami) "$CERT_DIR/key.pem"
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo ""
echo "✅ Certificats générés avec succès!"
echo ""
echo "📝 Locations:"
echo "   Certificat: $CERT_DIR/cert.pem"
echo "   Clé privée: $CERT_DIR/key.pem"
echo ""
echo "🔄 Renouvellement automatique:"
echo "   Ajoutez à crontab (crontab -e):"
echo "   0 2 * * * /usr/bin/certbot renew --quiet"
echo ""
