# Script de déploiement Railway pour Velya
# Usage: .\deploy-railway.ps1

Write-Host "🚀 Déploiement Velya sur Railway" -ForegroundColor Cyan

# Vérifier que git est installé
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier que Railway CLI est installé
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Railway CLI n'est pas installé" -ForegroundColor Yellow
    Write-Host "Installer depuis: https://docs.railway.app/guides/cli" -ForegroundColor Yellow
    Write-Host "Ou continuer sans CLI (déploiement via GitHub)" -ForegroundColor Yellow
}

# Étape 1: Vérifier les changements
Write-Host "`n📋 Vérification des changements..." -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Changements détectés:" -ForegroundColor Green
    Write-Host $status
    
    # Demander confirmation
    $confirm = Read-Host "Commiter et pusher ces changements? (y/n)"
    if ($confirm -eq 'y') {
        git add .
        $message = Read-Host "Message de commit"
        git commit -m $message
        git push origin main
        Write-Host "✅ Changements pushés" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Pas de changements" -ForegroundColor Green
}

# Étape 2: Afficher les instructions
Write-Host "`n📖 Instructions de déploiement:" -ForegroundColor Cyan
Write-Host @"
1. Aller sur https://railway.app
2. Créer un nouveau projet depuis ton repo GitHub
3. Ajouter MongoDB depuis le marketplace
4. Configurer les variables d'environnement:
   - Backend: MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, etc.
   - Frontend: REACT_APP_API_URL, REACT_APP_WEBSOCKET_URL, etc.
5. Railway va automatiquement builder et déployer

📊 Monitoring:
- Logs: Railway Dashboard → Service → Logs
- Metrics: Railway Dashboard → Service → Metrics
- Deployments: Railway Dashboard → Deployments

🔗 Domaine:
- Configurer velya.ca dans Railway → Settings → Domains
- Mettre à jour les DNS records chez ton registraire
"@

Write-Host "`n✅ Prêt pour le déploiement!" -ForegroundColor Green
Write-Host "Ouvre https://railway.app et crée un nouveau projet" -ForegroundColor Cyan
