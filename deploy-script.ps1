# Script de déploiement optimisé
Write-Host "Nettoyage pour déploiement..." -ForegroundColor Green

# Supprimer les dossiers volumineux
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue frontend/node_modules
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue uploads
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue cypress
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue frontend/cypress

# Supprimer les fichiers de test
Get-ChildItem -Recurse -Name "*.test.js" | Remove-Item -Force
Remove-Item -Force -ErrorAction SilentlyContinue "*.zip", "*.rar", "*.onnx"

# Build du frontend
Write-Host "Build du frontend..." -ForegroundColor Yellow
cd frontend
npm ci --production
npm run build
cd ..

Write-Host "Projet prêt pour déploiement!" -ForegroundColor Green