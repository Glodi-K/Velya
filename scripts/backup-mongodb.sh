#!/bin/bash

# ============================================
# VELYA - SAUVEGARDE MONGODB
# ============================================
# Ce script crée une sauvegarde de la base de données

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/velya_$BACKUP_DATE.tar.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

echo "💾 Sauvegarde MongoDB"
echo "======================================"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Créer le dump
DUMP_DIR=$(mktemp -d)
echo "📝 Création du dump..."

mongodump --uri="$MONGO_URI" --out="$DUMP_DIR"

# Compresser
echo "🗜️ Compression..."
tar -czf "$BACKUP_FILE" -C "$DUMP_DIR" .

# Nettoyer
rm -rf "$DUMP_DIR"

echo ""
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage des sauvegardes anciennes (>$RETENTION_DAYS jours)..."
find "$BACKUP_DIR" -name "velya_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Sauvegarde terminée avec succès!"
echo ""
echo "💡 Pour restaurer:"
echo "   tar -xzf $BACKUP_FILE"
echo "   mongorestore --uri=\"\$MONGO_URI\" --dir=dump"
