# Script de vérification pour le déploiement Railway
# Usage: .\verify-railway-ready.ps1

Write-Host "🔍 Vérification de la préparation pour Railway" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Vérifier les fichiers essentiels
$requiredFiles = @(
    "backend/Dockerfile",
    "backend/package.json",
    "backend/server.js",
    "frontend/Dockerfile",
    "frontend/package.json",
    "frontend/nginx.conf",
    "docker-compose.prod.yml",
    "railway.json",
    "frontend/railway.json"
)

Write-Host "📁 Vérification des fichiers..." -ForegroundColor Cyan
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# Vérifier les variables d'environnement
Write-Host "`n🔐 Vérification des variables d'environnement..." -ForegroundColor Cyan

$envFiles = @(
    ".env.railway.example",
    "backend/.env.production",
    "frontend/.env.production"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file (optionnel)" -ForegroundColor Yellow
    }
}

# Vérifier les dépendances
Write-Host "`n📦 Vérification des dépendances..." -ForegroundColor Cyan

if (Test-Path "backend/package-lock.json") {
    Write-Host "  ✅ Backend package-lock.json" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Backend package-lock.json (recommandé)" -ForegroundColor Yellow
}

if (Test-Path "frontend/package-lock.json") {
    Write-Host "  ✅ Frontend package-lock.json" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Frontend package-lock.json (recommandé)" -ForegroundColor Yellow
}

# Vérifier Git
Write-Host "`n🔄 Vérification de Git..." -ForegroundColor Cyan

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ⚠️  Changements non commitées:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host "  💡 Exécuter: git add . && git commit -m 'Railway deployment' && git push" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ Tout est commité" -ForegroundColor Green
}

# Résumé
Write-Host "`n" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ PRÊT POUR RAILWAY!" -ForegroundColor Green
    Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Aller sur https://railway.app" -ForegroundColor White
    Write-Host "2. Créer un nouveau projet depuis ton repo GitHub" -ForegroundColor White
    Write-Host "3. Ajouter MongoDB depuis le marketplace" -ForegroundColor White
    Write-Host "4. Configurer les variables d'environnement" -ForegroundColor White
    Write-Host "5. Laisser Railway builder et déployer" -ForegroundColor White
} else {
    Write-Host "❌ PROBLÈMES DÉTECTÉS" -ForegroundColor Red
    Write-Host "Corriger les fichiers manquants avant de continuer" -ForegroundColor Yellow
}

Write-Host ""
