# Installation optimisée des dépendances
Write-Host "Installation optimisée..." -ForegroundColor Green

# Backend - Production uniquement
Write-Host "Backend dependencies..." -ForegroundColor Yellow
npm ci --production --no-optional

# Frontend - Production uniquement  
Write-Host "Frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm ci --production --no-optional
npm run build
cd ..

Write-Host "Installation terminée!" -ForegroundColor Green