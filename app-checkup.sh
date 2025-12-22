#!/bin/bash
echo "🔍 Vérification de la logique de ton app CleaningApp..."

echo -e "\n📦 BACKEND : Routes détectées :"
grep -r "router\." backend/routes | cut -d: -f2 | sort

echo -e "\n🧠 BACKEND : Fonctions clés du contrôleur (reservationController.js) :"
grep -E "exports\." backend/controllers/reservationController.js | cut -d'=' -f1

echo -e "\n🧭 FRONTEND : Pages disponibles :"
ls frontend/src/pages

echo -e "\n📄 FRONTEND : Composants principaux :"
ls frontend/src/components | grep -E 'Dashboard|Paiement|Reservation|Track|Chat|Selfie|VerifyPin'

echo -e "\n📌 Étapes utilisateur typiques :"
echo "1️⃣ Entry ➜ 2️⃣ Login/Register ➜ 3️⃣ Onboarding ➜ 4️⃣ Réservation ➜ 5️⃣ Paiement ➜ 6️⃣ Dashboard ➜ 7️⃣ Suivi / Selfie / Code PIN"

echo -e "\n✅ Checkup terminé !"

