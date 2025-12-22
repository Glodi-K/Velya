# 📧 Configuration de la Vérification d'Email - Velya

## Vue d'ensemble

Un système complet de vérification d'email a été implémenté pour sécuriser les comptes utilisateurs et confirmer les vraies adresses email.

## Fonctionnalités

### 1. **Vérification d'Email à l'Inscription**
- Les nouveaux utilisateurs reçoivent un email de vérification après l'inscription
- Token unique qui expire après 24 heures
- Page de confirmation élégante et sécurisée

### 2. **Changement d'Email Sécurisé**
- Les utilisateurs peuvent changer leur email depuis les paramètres
- Confirmation du mot de passe requise
- Un email de confirmation est envoyé au nouvel email
- Le changement n'est effectif qu'après confirmation

### 3. **Renvoi d'Email de Vérification**
- Les utilisateurs peuvent renvoyer l'email de vérification à tout moment
- Limitation de débit (max 1 renvoi par minute) pour prévenir l'abus
- Disponible uniquement pour les emails non vérifiés

### 4. **Email Multilingue**
- Emails HTML formatés professionnellement
- Gradient de couleur cohérent avec l'application
- Contient le lien direct et un lien alternatif

## Architecture Backend

### 📁 Fichiers Créés/Modifiés

#### 1. **Services**
```
backend/src/services/emailVerificationService.js (NOUVEAU)
```
- `generateVerificationToken()` - Génère un token crypto-sécurisé
- `sendVerificationEmail()` - Envoie l'email de vérification initial
- `sendEmailChangeVerification()` - Envoie l'email de changement d'email

#### 2. **Routes**
```
backend/src/routes/emailVerificationRoutes.js (NOUVEAU)
```

**Endpoints disponibles :**

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/send-verification-email` | Envoie un email de vérification |
| POST | `/api/auth/verify-email` | Vérifie l'email avec un token |
| GET | `/api/auth/verify-email/:token` | Vérifie l'email (via lien email) |
| POST | `/api/auth/resend-verification-email` | Renvoie l'email (authentifié) |
| POST | `/api/auth/change-email` | Demande un changement d'email |
| POST | `/api/auth/confirm-new-email` | Confirme le changement d'email |

#### 3. **Modèle User**
```
backend/src/models/User.js (MODIFIÉ)
```

**Champs ajoutés :**
```javascript
{
  emailVerified: Boolean,              // true si l'email est vérifié
  emailVerificationToken: String,      // Token unique (cryptographique)
  emailVerificationExpires: Date,      // Date d'expiration du token
  pendingNewEmail: String,             // Email temporaire en attente de confirmation
}
```

#### 4. **App.js**
```
backend/src/app.js (MODIFIÉ)
```
- Ajout des routes de vérification email au middleware auth

## Architecture Frontend

### 📁 Fichiers Créés

#### 1. **Pages**
```
frontend/src/pages/VerifyEmailPage.jsx (NOUVEAU)
```
- Page de vérification d'email via token
- Affiche l'état (en cours, succès, erreur)
- Redirection automatique après succès

```
frontend/src/pages/EmailSettingsPage.jsx (NOUVEAU)
```
- Paramètres de gestion d'email
- Affiche le statut de vérification
- Interface pour changer l'email
- Bouton pour renvoyer l'email de vérification

#### 2. **Routes**
```
frontend/src/AnimatedRoutes.jsx (MODIFIÉ)
```
- Route `/verify-email` - Vérification via token
- Route `/email-settings` - Gestion des emails

## Flux de Sécurité

### 1️⃣ **Inscription**
```
Utilisateur s'inscrit
        ↓
Backend crée User (emailVerified = false)
        ↓
Backend génère token crypto unique
        ↓
Token + email stockés en DB (expire dans 24h)
        ↓
Email avec lien verification envoyé
        ↓
Utilisateur clique sur le lien
        ↓
Token validé et email marqué comme vérifié
```

### 2️⃣ **Changement d'Email**
```
Utilisateur clique "Changer l'email"
        ↓
Formulaire : nouvel email + mot de passe
        ↓
Backend vérifie le mot de passe
        ↓
Backend généré token de confirmation
        ↓
Email de confirmation envoyé au NOUVEL email
        ↓
Utilisateur clique le lien dans le nouvel email
        ↓
Email changé + emailVerified remis à true
```

## Sécurité Implémentée

### ✅ Tokens
- Générés avec `crypto.randomBytes(32).toString('hex')`
- Stockés hashés en base de données
- Expirent après 24 heures
- Uniques et non-prédictibles

### ✅ Validation d'Email
- Format email validé avec regex
- Vérification que l'email n'existe pas déjà
- Protection contre les changements d'email frauduleux

### ✅ Protection Anti-Spam
- Limite d'1 renvoi par minute
- Tokens uniques par tentative
- Logs d'activité

### ✅ Authentification
- Les endpoints sensibles requièrent `authMiddleware`
- Mot de passe vérifié avant changement d'email
- Session utilisateur maintenue

## Configuration Requise

### Variables d'Environnement
Vérifiez que votre `.env` contient :

```env
# Email
MAILGUN_API_KEY=votre_api_key
MAILGUN_DOMAIN=votre_domaine
MAILGUN_FROM_EMAIL=noreply@votre_domaine

# OU

EMAIL_USER=votre_gmail@gmail.com
EMAIL_PASS=votre_mot_de_passe_app

# Frontend
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5001
```

## Usage

### Pour l'Administrateur

#### Vérifier les utilisateurs non-vérifiés
```javascript
const unverifiedUsers = await User.find({ emailVerified: false });
```

#### Forcer la vérification d'un utilisateur
```javascript
user.emailVerified = true;
user.emailVerificationToken = null;
user.emailVerificationExpires = null;
await user.save();
```

### Pour le Développeur

#### Tester avec Mailgun
```bash
# Utiliser le sandbox domain de Mailgun en dev
MAILGUN_DOMAIN=sandboxxxx.mailgun.org
MAILGUN_API_KEY=votre_clé_api
```

#### Tester avec Gmail
```bash
# Créer une "password app" sur Google Cloud
# https://myaccount.google.com/apppasswords
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_password_app
```

## Tests

### Test Manuel - Inscription
1. Allez sur `/register`
2. Remplissez le formulaire
3. Vérifiez votre boîte email
4. Cliquez sur le lien de vérification
5. Vous devez être redirigé vers l'accueil avec un message de succès

### Test Manuel - Changement d'Email
1. Connectez-vous
2. Allez sur `/email-settings`
3. Cliquez "Changer l'email"
4. Entrez un nouvel email et votre mot de passe
5. Vérifiez le nouvel email
6. Cliquez sur le lien
7. L'email doit être changé

### Endpoint Test

```bash
# Envoyer un email de vérification
curl -X POST http://localhost:5001/api/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Vérifier l'email
curl -X POST http://localhost:5001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

## Troubleshooting

### Les emails ne sont pas envoyés
1. ✅ Vérifier les variables d'environnement Mailgun/Gmail
2. ✅ Vérifier les logs backend pour les messages d'erreur
3. ✅ Si Mailgun échoue, il devrait tomber sur Gmail (fallback)
4. ✅ Tester directement avec : `node -e "require('./src/services/emailService.js').sendMail('test@example.com', 'Test', '<h1>Test</h1>')"`

### Les tokens expirent trop vite
- Changer la durée dans `emailVerificationRoutes.js`
- Actuellement : `new Date(Date.now() + 24 * 60 * 60 * 1000)` (24 heures)
- Format : `milliseconds`

### Page de vérification affiche "Token invalide"
1. ✅ Vérifier que le lien du token est complet dans l'email
2. ✅ Vérifier que le token en DB correspond à celui du lien
3. ✅ Vérifier que 24 heures ne sont pas écoulées depuis la génération

## Prochaines Étapes (Optionnel)

### Améliorations Possibles
- [ ] Envoi d'email lors du changement (notification d'alerte sécurité)
- [ ] Vérification en deux étapes avec code 2FA
- [ ] Liste d'emails secondaires autorisés
- [ ] Historique des changements d'email
- [ ] Authentification sans mot de passe via email magic link
- [ ] Suspicion de changement = demande verification bonus

## Support

Pour toute question ou problème :
1. Vérifiez les logs backend : `npm run dev:backend`
2. Ouvrez DevTools frontend : F12 → Console
3. Vérifiez les variables d'environnement : `.env`

---

✅ **Configuration complétée le 15 décembre 2025**
Développé pour Velya - Plateforme de Services de Nettoyage
