# start-dev.ps1 - Script de démarrage pour le développement

Write-Host "🚀 Démarrage de l'environnement de développement Velya" -ForegroundColor Green

# Vérifier Node.js
Write-Host "🔍 Vérification de Node.js..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier Python
Write-Host "🔍 Vérification de Python..." -ForegroundColor Yellow
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier MongoDB
Write-Host "🔍 Vérification de MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (!$mongoProcess) {
    Write-Host "⚠️ MongoDB ne semble pas être démarré" -ForegroundColor Yellow
    Write-Host "Démarrage de MongoDB..." -ForegroundColor Yellow
    Start-Process "mongod" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Installation des dépendances si nécessaire
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm run install:all
}

# Vérifier les variables d'environnement
if (!(Test-Path ".env")) {
    Write-Host "⚠️ Fichier .env manquant" -ForegroundColor Yellow
    Write-Host "Création d'un fichier .env exemple..." -ForegroundColor Yellow
    
    $envContent = @"
# Configuration Velya
NODE_ENV=development
PORT=5001
ML_PORT=5002

# Base de données
MONGO_URI=mongodb://localhost:27017/velya

# JWT
JWT_SECRET=your_jwt_secret_here

# Services externes
STRIPE_SECRET_KEY=your_stripe_key
CLOUDINARY_URL=your_cloudinary_url
SENTRY_DSN=your_sentry_dsn

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
ML_SERVICE_URL=http://localhost:5002

# Email
SMTP_USER=your_email
SMTP_PASS=your_password
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Fichier .env créé. Veuillez le configurer avec vos valeurs." -ForegroundColor Green
}

Write-Host "🎯 Démarrage des services..." -ForegroundColor Green

# Démarrer tous les services en parallèle
Write-Host "🔧 Backend sur http://localhost:5001" -ForegroundColor Cyan
Write-Host "🎨 Frontend sur http://localhost:3000" -ForegroundColor Cyan
Write-Host "🤖 Service ML sur http://localhost:5002" -ForegroundColor Cyan

npm run dev