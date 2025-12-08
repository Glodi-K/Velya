# 🔒 CHECKLIST SÉCURITÉ - AVANT DÉPLOIEMENT

## ⚠️ PROBLÈMES DÉTECTÉS

### 1. ❌ Secrets dans Git
Les fichiers `.env` contiennent des clés Stripe, Mailgun, etc. qui ont été pushés sur GitHub.

**Action immédiate:**
```bash
# Régénérer TOUTES les clés compromises
# 1. Stripe: https://dashboard.stripe.com/apikeys
# 2. Mailgun: https://app.mailgun.com/app/account/security/api_keys
# 3. Google OAuth: https://console.cloud.google.com/apis/credentials
```

### 2. ✅ .gitignore Correct
`.env` est déjà dans `.gitignore` ✓

### 3. ✅ .env.example Créé
Template sans secrets créé ✓

---

## 🔐 AVANT DE DÉPLOYER

### Étape 1: Régénérer les Secrets

**Stripe:**
1. Aller sur https://dashboard.stripe.com/apikeys
2. Créer de nouvelles clés
3. Copier les nouvelles clés

**Mailgun:**
1. Aller sur https://app.mailgun.com/app/account/security/api_keys
2. Créer une nouvelle clé API
3. Copier la nouvelle clé

**Google OAuth:**
1. Aller sur https://console.cloud.google.com/apis/credentials
2. Créer de nouvelles credentials
3. Copier les nouvelles clés

### Étape 2: Mettre à Jour .env Localement

```bash
# Éditer backend/.env avec les NOUVELLES clés
STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
MAILGUN_API_KEY=NEW_KEY_HERE
GOOGLE_CLIENT_ID=NEW_ID_HERE
GOOGLE_CLIENT_SECRET=NEW_SECRET_HERE
```

### Étape 3: Vérifier que .env n'est pas Commité

```bash
git status
# Ne doit pas afficher backend/.env ou frontend/.env
```

### Étape 4: Configurer les Variables sur Render

Dans Render Dashboard → Environment Variables :

```
STRIPE_SECRET_KEY=sk_test_NEW_KEY
MAILGUN_API_KEY=NEW_KEY
GOOGLE_CLIENT_ID=NEW_ID
GOOGLE_CLIENT_SECRET=NEW_SECRET
JWT_SECRET=GENERATE_NEW_SECURE_KEY
```

---

## 📋 CHECKLIST FINALE

- [ ] Toutes les clés Stripe régénérées
- [ ] Toutes les clés Mailgun régénérées
- [ ] Toutes les clés Google régénérées
- [ ] JWT_SECRET changé
- [ ] .env local mis à jour
- [ ] .env n'est pas commité
- [ ] Variables configurées sur Render
- [ ] Aucun secret dans le code source

---

## 🚀 PRÊT POUR DÉPLOYER

Une fois tout ✓, tu peux déployer sur Render sans risque.

Les secrets ne seront jamais pushés sur GitHub.
