# ============================================
# SCRIPT D'AIDE AU DÉPLOIEMENT VELYA
# Pour utilisateurs Windows
# ============================================

# Cette fonction affiche le menu principal
function Show-Menu {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗"
    Write-Host "║          VELYA - ASSISTANT DE DÉPLOIEMENT                      ║"
    Write-Host "╚════════════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "1. 📋 Afficher la checklist de déploiement"
    Write-Host "2. 🔐 Générer des secrets sécurisés"
    Write-Host "3. 📝 Éditer .env.production"
    Write-Host "4. 🔍 Valider la configuration"
    Write-Host "5. 📖 Afficher la documentation"
    Write-Host "6. 🚀 Instructions de déploiement"
    Write-Host "7. 🆘 Dépannage et support"
    Write-Host "8. ❌ Quitter"
    Write-Host ""
}

# Générer secrets sécurisés
function Generate-Secrets {
    Write-Host ""
    Write-Host "🔐 Génération de secrets sécurisés"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    # JWT_SECRET (32 caractères)
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "✓ JWT_SECRET générée:"
    Write-Host "  $jwtSecret"
    Write-Host ""
    
    # MongoDB Password (16 caractères)
    $mongoPassword = -join ((65..90) + (97..122) + (48..57) + (33..47) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Host "✓ MongoDB Password générée:"
    Write-Host "  $mongoPassword"
    Write-Host ""
    
    Write-Host "📋 À faire:"
    Write-Host "  1. Copier JWT_SECRET dans .env.production (STRIPE_SECRET_KEY)"
    Write-Host "  2. Copier MongoDB Password et mettre dans MONGO_URI"
    Write-Host ""
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Afficher la checklist
function Show-Checklist {
    Write-Host ""
    Write-Host "📋 CHECKLIST DE DÉPLOIEMENT"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "PRÉPARATION SERVEUR:"
    Write-Host "  □ Serveur Linux (Ubuntu 20.04+) préparé"
    Write-Host "  □ Docker installé"
    Write-Host "  □ Docker Compose installé"
    Write-Host "  □ Certbot installé (pour SSL)"
    Write-Host "  □ Firewall configuré (ports 22, 80, 443)"
    Write-Host ""
    Write-Host "CONFIGURATION:"
    Write-Host "  □ .env.production créé avec tous les secrets"
    Write-Host "  □ JWT_SECRET sécurisé (min 32 chars)"
    Write-Host "  □ MongoDB password changé"
    Write-Host "  □ Stripe keys (LIVE, pas test)"
    Write-Host "  □ Mailgun API key et domaine"
    Write-Host "  □ Google OAuth configuré"
    Write-Host "  □ Google service account JSON"
    Write-Host "  □ Cloudinary credentials"
    Write-Host ""
    Write-Host "CERTIFICATS SSL:"
    Write-Host "  □ Certificats Let's Encrypt générés"
    Write-Host "  □ Fichiers placés dans ./ssl/"
    Write-Host "  □ Permissions configurées"
    Write-Host ""
    Write-Host "DÉPLOIEMENT:"
    Write-Host "  □ Repository cloné"
    Write-Host "  □ Images Docker buildées"
    Write-Host "  □ Services démarrés"
    Write-Host "  □ MongoDB initialisée"
    Write-Host ""
    Write-Host "TESTS:"
    Write-Host "  □ Frontend accessible (https://velya.ca)"
    Write-Host "  □ API accessible (https://api.velya.ca/api/health)"
    Write-Host "  □ MongoDB responsive"
    Write-Host "  □ Tests d'authentification réussis"
    Write-Host "  □ Tests d'email réussis"
    Write-Host "  □ Tests de paiement réussis"
    Write-Host ""
    Write-Host "MONITORING:"
    Write-Host "  □ Logs configurés"
    Write-Host "  □ Alertes configurées"
    Write-Host "  □ Backups planifiés"
    Write-Host "  □ Renouvellement certificats automatisé"
    Write-Host ""
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Valider configuration
function Validate-Configuration {
    Write-Host ""
    Write-Host "🔍 VALIDATION DE CONFIGURATION"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    $issues = 0
    
    # Vérifier .env.production existe
    if (Test-Path ".env.production") {
        Write-Host "✓ .env.production existe"
    } else {
        Write-Host "✗ .env.production manquant"
        $issues++
    }
    
    # Vérifier les fichiers clés
    if (Test-Path "docker-compose.prod.yml") {
        Write-Host "✓ docker-compose.prod.yml existe"
    } else {
        Write-Host "✗ docker-compose.prod.yml manquant"
        $issues++
    }
    
    if (Test-Path "nginx.conf") {
        Write-Host "✓ nginx.conf existe"
    } else {
        Write-Host "✗ nginx.conf manquant"
        $issues++
    }
    
    if (Test-Path "frontend/Dockerfile") {
        Write-Host "✓ frontend/Dockerfile existe"
    } else {
        Write-Host "✗ frontend/Dockerfile manquant"
        $issues++
    }
    
    # Vérifier les secrets
    if ((Test-Path ".env.production")) {
        $content = Get-Content ".env.production" -Raw
        if ($content -match "YOUR_.*_HERE") {
            Write-Host "✗ Secrets manquants (remplacer YOUR_*_HERE)"
            $issues++
        } else {
            Write-Host "✓ Tous les secrets configurés"
        }
        
        if ($content -match "monSuperSecret") {
            Write-Host "✗ JWT_SECRET faible (change-le!)"
            $issues++
        } else {
            Write-Host "✓ JWT_SECRET sécurisé"
        }
    }
    
    Write-Host ""
    if ($issues -eq 0) {
        Write-Host "✅ Configuration valide! Prêt à déployer"
    } else {
        Write-Host "⚠️  $issues problème(s) détecté(s)"
    }
    
    Write-Host ""
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Afficher documentation
function Show-Documentation {
    Write-Host ""
    Write-Host "📖 DOCUMENTATION"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "Documents disponibles:"
    Write-Host ""
    Write-Host "1. DEPLOYMENT_SUMMARY.md"
    Write-Host "   → Guide rapide de déploiement"
    Write-Host ""
    Write-Host "2. DEPLOYMENT.md"
    Write-Host "   → Guide complet (180+ lignes)"
    Write-Host ""
    Write-Host "3. DEPLOYMENT_CHECKLIST.md"
    Write-Host "   → Checklist exhaustive pré-go-live"
    Write-Host ""
    Write-Host "4. MAINTENANCE.md"
    Write-Host "   → Monitoring et maintenance"
    Write-Host ""
    Write-Host "5. SSL_CONFIGURATION.md"
    Write-Host "   → Configuration SSL/TLS"
    Write-Host ""
    Write-Host "6. ENV_DOCUMENTATION.md"
    Write-Host "   → Documentation des variables d'environnement"
    Write-Host ""
    Write-Host "Quel fichier voulez-vous lire?"
    Write-Host "1-6 (numéro) ou 0 (retour):"
    $choice = Read-Host
    
    switch ($choice) {
        "1" { if (Test-Path "DEPLOYMENT_SUMMARY.md") { Get-Content "DEPLOYMENT_SUMMARY.md" | more } }
        "2" { if (Test-Path "DEPLOYMENT.md") { Get-Content "DEPLOYMENT.md" | more } }
        "3" { if (Test-Path "DEPLOYMENT_CHECKLIST.md") { Get-Content "DEPLOYMENT_CHECKLIST.md" | more } }
        "4" { if (Test-Path "MAINTENANCE.md") { Get-Content "MAINTENANCE.md" | more } }
        "5" { if (Test-Path "SSL_CONFIGURATION.md") { Get-Content "SSL_CONFIGURATION.md" | more } }
        "6" { if (Test-Path "ENV_DOCUMENTATION.md") { Get-Content "ENV_DOCUMENTATION.md" | more } }
    }
}

# Instructions de déploiement
function Show-DeploymentInstructions {
    Write-Host ""
    Write-Host "🚀 INSTRUCTIONS DE DÉPLOIEMENT"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "ÉTAPE 1: Préparer le serveur"
    Write-Host "  • Ubuntu 20.04+ sur un VPS (Linode, DigitalOcean, AWS, etc.)"
    Write-Host "  • Installer Docker et Docker Compose"
    Write-Host "  • Ouvrir les ports 22, 80, 443"
    Write-Host ""
    Write-Host "ÉTAPE 2: Configurer les secrets"
    Write-Host "  • Copier .env.production.example → .env.production"
    Write-Host "  • Remplir toutes les clés API (Stripe, Mailgun, Google, etc.)"
    Write-Host "  • Générer un JWT_SECRET sécurisé"
    Write-Host ""
    Write-Host "ÉTAPE 3: Générer certificats SSL"
    Write-Host "  • certbot certonly --standalone -d velya.ca -d api.velya.ca"
    Write-Host "  • Copier dans ./ssl/"
    Write-Host ""
    Write-Host "ÉTAPE 4: Déployer"
    Write-Host "  • git clone ... (repository)"
    Write-Host "  • docker-compose -f docker-compose.prod.yml build"
    Write-Host "  • docker-compose -f docker-compose.prod.yml up -d"
    Write-Host ""
    Write-Host "ÉTAPE 5: Configurer DNS"
    Write-Host "  • velya.ca → A record → IP du serveur"
    Write-Host "  • api.velya.ca → A record → IP du serveur"
    Write-Host ""
    Write-Host "Pour le guide complet, voir: DEPLOYMENT_SUMMARY.md"
    Write-Host ""
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Dépannage
function Show-Troubleshooting {
    Write-Host ""
    Write-Host "🆘 DÉPANNAGE"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "Problèmes courants:"
    Write-Host ""
    Write-Host "1. Frontend ne charge pas"
    Write-Host "   → Vérifier: docker-compose -f docker-compose.prod.yml logs nginx"
    Write-Host "   → Redémarrer: docker-compose -f docker-compose.prod.yml restart nginx"
    Write-Host ""
    Write-Host "2. API retourne 502"
    Write-Host "   → Vérifier: docker-compose -f docker-compose.prod.yml logs backend"
    Write-Host "   → Redémarrer: docker-compose -f docker-compose.prod.yml restart backend"
    Write-Host ""
    Write-Host "3. MongoDB lent/inaccessible"
    Write-Host "   → Vérifier: docker-compose -f docker-compose.prod.yml logs mongodb"
    Write-Host "   → Espace disque: docker exec velya_mongodb_1 df -h"
    Write-Host ""
    Write-Host "4. Certificat expiré"
    Write-Host "   → Renouveler: certbot renew --force-renewal"
    Write-Host "   → Copier: sudo cp /etc/letsencrypt/live/velya.ca/* ./ssl/"
    Write-Host ""
    Write-Host "Pour plus de détails, voir: MAINTENANCE.md"
    Write-Host ""
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Éditer .env.production
function Edit-EnvFile {
    Write-Host ""
    Write-Host "📝 ÉDITER .env.production"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    if (-not (Test-Path ".env.production")) {
        Write-Host "❌ .env.production n'existe pas"
        Write-Host "Créer à partir de .env.production.example:"
        Write-Host "  Copy-Item .env.production.example .env.production"
        Write-Host ""
        Write-Host "Appuyez sur une touche pour continuer..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    Write-Host "Ouvrir .env.production avec:"
    Write-Host "  1. VSCode (code .env.production)"
    Write-Host "  2. Notepad (notepad .env.production)"
    Write-Host "  3. PowerShell ISE"
    Write-Host ""
    Write-Host "Votre choix (1-3):"
    $choice = Read-Host
    
    switch ($choice) {
        "1" { & code .env.production }
        "2" { & notepad .env.production }
        "3" { & powershell_ise .env.production }
    }
}

# Boucle principale
do {
    Clear-Host
    Show-Menu
    $choice = Read-Host "Votre choix (1-8)"
    
    switch ($choice) {
        "1" { Show-Checklist }
        "2" { Generate-Secrets }
        "3" { Edit-EnvFile }
        "4" { Validate-Configuration }
        "5" { Show-Documentation }
        "6" { Show-DeploymentInstructions }
        "7" { Show-Troubleshooting }
        "8" { 
            Write-Host ""
            Write-Host "Au revoir! 👋"
            exit
        }
        default {
            Write-Host "Option invalide"
            Start-Sleep -Seconds 2
        }
    }
} while ($true)
