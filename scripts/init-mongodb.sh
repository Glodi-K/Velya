#!/bin/bash

# ============================================
# SCRIPT D'INITIALISATION MONGODB PRODUCTION
# ============================================
# Exécute les migrations de base de données

set -e

echo "🗄️ Initialisation MongoDB..."

# Attendre que MongoDB soit prêt
echo "⏳ Attente de MongoDB..."
for i in {1..30}; do
    if mongosh -u velya_admin -p --eval "db.adminCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB est prêt"
        break
    fi
    echo "  Tentative $i/30..."
    sleep 1
done

# Créer les collections avec indices
echo "📊 Création des collections et indices..."

mongosh -u velya_admin -p << 'EOF'
use velya

// Collections utilisateurs
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: 1 })

// Collections réservations
db.reservations.createIndex({ clientId: 1 })
db.reservations.createIndex({ prestataireId: 1 })
db.reservations.createIndex({ status: 1 })
db.reservations.createIndex({ date: 1 })
db.reservations.createIndex({ paid: 1 })
db.reservations.createIndex({ createdAt: -1 })

// Collections paiements
db.payments.createIndex({ reservationId: 1 }, { unique: true })
db.payments.createIndex({ userId: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ stripePaymentIntentId: 1 }, { unique: true, sparse: true })
db.payments.createIndex({ createdAt: -1 })

// Collections messages
db.messages.createIndex({ conversationId: 1 })
db.messages.createIndex({ senderId: 1 })
db.messages.createIndex({ createdAt: -1 })
db.conversations.createIndex({ participants: 1 })

// Collections estimations
db.estimates.createIndex({ clientId: 1 })
db.estimates.createIndex({ prestataireId: 1 })
db.estimates.createIndex({ status: 1 })

// Collections admin
db.admins.createIndex({ email: 1 }, { unique: true })

// Collection logs
db.logs.createIndex({ timestamp: 1 })
db.logs.createIndex({ userId: 1 })

console.log("✅ Collections et indices créés avec succès")
EOF

echo "✅ Initialisation MongoDB complétée"
