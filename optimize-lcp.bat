@echo off
REM LCP Optimization Menu - Windows Batch Version

:menu
cls
echo.
echo ================================================================
echo         LCP OPTIMIZATION SUITE - VELYA PERFORMANCE FIX
echo ================================================================
echo.
echo STATUS ACTUEL:
echo    LCP: 10.7s - Target: 2.5s (80%% du travail fait)
echo    Speed Index: 5.4s - Target: 3.0s (77%% reduction)
echo.
echo MENU:
echo    1. Voir le plan d'optimisation complet
echo    2. Convertir les images en WebP (gain: 1-2s)
echo    3. Valider le cache Redis (gain: 1-2s)
echo    4. Rebuild du projet
echo    5. Voir le rapport de progression
echo    6. Voir la documentation
echo    7. Executer TOUT (1-5)
echo    8. Informations detaillees
echo    0. Quitter
echo.
set /p choice="Choisir une option: "

if "%choice%"=="1" goto plan
if "%choice%"=="2" goto images
if "%choice%"=="3" goto redis
if "%choice%"=="4" goto build
if "%choice%"=="5" goto report
if "%choice%"=="6" goto docs
if "%choice%"=="7" goto all
if "%choice%"=="8" goto info
if "%choice%"=="0" exit /b 0
goto menu

:plan
echo.
echo Affichage du plan d'optimisation...
echo.
cd /d c:\Dev\Velya
node scripts\lcp-optimization-plan.js
pause
goto menu

:images
echo.
echo ETAPE: Conversion en WebP
echo ================================================================
echo.
echo PREREQUISITE:
echo    - Images doivent être dans: frontend/src/assets/
echo    - Sharp doit être installé ^(npm install sharp^)
echo.
set /p confirm="Continuer? (o/n): "
if "%confirm%"=="o" (
    cd /d c:\Dev\Velya
    node scripts\optimize-images-webp.js
)
pause
goto menu

:redis
echo.
echo ETAPE: Validation du Cache Redis
echo ================================================================
echo.
echo PREREQUISITE:
echo    - Backend doit être en cours d'exécution ^(npm run dev:backend^)
echo    - MongoDB doit être connecté
echo    - Redis doit être actif
echo.
set /p confirm="Continuer? (o/n): "
if "%confirm%"=="o" (
    cd /d c:\Dev\Velya
    node scripts\test-api-cache.js
)
pause
goto menu

:build
echo.
echo ETAPE: Rebuild du Projet
echo ================================================================
echo.
echo Commande: npm run build ^(dans frontend/^)
echo.
set /p confirm="Continuer? (o/n): "
if "%confirm%"=="o" (
    cd /d c:\Dev\Velya\frontend
    call npm run build
    cd /d c:\Dev\Velya
)
pause
goto menu

:report
echo.
echo Affichage du rapport de progression...
echo.
cd /d c:\Dev\Velya
node scripts\progress-report.js
pause
goto menu

:docs
cls
echo.
echo ================================================================
echo                        DOCUMENTATION
echo ================================================================
echo.
echo Fichiers disponibles:
echo.
echo 1. INDEX.md
echo    ^> Point d'acces principal
echo    ^> Liens vers tous les autres fichiers
echo.
echo 2. OPTIMIZATION_SUMMARY.md
echo    ^> Vue d'ensemble complete
echo    ^> Métriques actuelles vs cibles
echo    ^> Résultats attendus
echo.
echo 3. LCP_OPTIMIZATION_GUIDE.md
echo    ^> Guide détaillé étape par étape
echo    ^> Debugging et troubleshooting
echo    ^> Explications techniques
echo.
echo Ouvrir:
echo    notepad c:\Dev\Velya\INDEX.md
echo    notepad c:\Dev\Velya\OPTIMIZATION_SUMMARY.md
echo    notepad c:\Dev\Velya\LCP_OPTIMIZATION_GUIDE.md
echo.
pause
goto menu

:info
cls
echo.
echo ================================================================
echo      OPTIMISATIONS LCP VELYA - INFORMATIONS
echo ================================================================
echo.
echo PROBLEME:
echo    LCP ^(Largest Contentful Paint^) = 10.7 secondes
echo    Target = 2.5 secondes
echo    Gap = 8.2 secondes ^(4.3x trop lent^)
echo.
echo SOLUTIONS IMPLEMENTEES:
echo    1. Code Splitting Vite ^(274KB main vs 650KB^)
echo    2. Lazy Loading Routes ^(15+ routes, Speed Index +77%%^)
echo    3. Redis Cache Middleware ^(4 endpoints^)
echo    4. Service Deferral ^(Mixpanel, fixSpacing^)
echo    5. OptimizedImage Component ^(CLS = 0.013^)
echo.
echo A FAIRE:
echo    1. Convertir images en WebP ^(30-50%% reduction^)
echo    2. Valider cache Redis
echo    3. Identifier le bottleneck reel ^(Chrome DevTools^)
echo    4. Optimiser fonts ^(font-display: swap^)
echo    5. Retest Lighthouse
echo.
echo GAINS ESTIMES:
echo    Phase 1 ^(fait^):     -4 à 9 secondes
echo    Phase 2 ^(ready^):    -1.7 à 2.5 secondes
echo    -----------------------------------
echo    Total: LCP = 1.7s à 3s ^(TARGET 2.5s OK^)
echo.
pause
goto menu

:all
cls
echo.
echo ================================================================
echo                  EXECUTION COMPLETE
echo ================================================================
echo.

echo 1/5 Plan d'optimisation...
cd /d c:\Dev\Velya
call node scripts\lcp-optimization-plan.js
timeout /t 2

echo.
echo 2/5 Conversion WebP...
call node scripts\optimize-images-webp.js
timeout /t 2

echo.
echo 3/5 Validation Redis...
call node scripts\test-api-cache.js
timeout /t 2

echo.
echo 4/5 Rebuild...
cd /d c:\Dev\Velya\frontend
call npm run build
cd /d c:\Dev\Velya
timeout /t 2

echo.
echo 5/5 Rapport...
call node scripts\progress-report.js

echo.
echo ================================================================
echo              EXECUTION COMPLETE TERMINEE
echo ================================================================
echo.
pause
goto menu
