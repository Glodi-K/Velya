# 📝 Guide : Inscription avec Vérification par Code 5 Chiffres

## Vue d'ensemble

Le nouveau système d'inscription Velya fonctionne en **2 étapes** :

### **Étape 1 : Inscription Initiale**
- L'utilisateur remplit le formulaire d'inscription (nom, email, mot de passe, photo de profil)
- Un code de vérification à **5 chiffres** est envoyé par email
- L'utilisateur n'est **pas encore enregistré** dans la base de données

### **Étape 2 : Vérification du Code**
- L'utilisateur accède à la page de vérification du code
- Il entre les 5 chiffres reçus par email
- Après vérification réussie, le compte est créé et l'utilisateur est connecté automatiquement

## Architecture Technique

### Backend Routes

#### 1. **POST `/api/auth/signup-step1`**
Envoie le code de vérification par email

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "SecurePassword123",
  "role": "client" // ou "provider"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "✓ Code de vérification envoyé par email",
  "email": "jean@example.com"
}
```

**Validations:**
- Email non déjà utilisé
- Mot de passe ≥ 6 caractères
- Tous les champs requis

**Stockage Temporaire:**
- Les données utilisateur sont stockées dans `global.signupPendingData`
- Expiration après 15 minutes
- Destruction automatique après 30 minutes
- ⚠️ **En production**, utiliser Redis à la place

#### 2. **POST `/api/auth/signup-step2`**
Vérifie le code et crée le compte (multipart/form-data)

**Body (FormData):**
```
email: "jean@example.com"
verificationCode: "12345"
profilePhoto: <File> (optionnel)
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "✓ Compte créé avec succès !",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "client",
    "profilePhoto": "/uploads/profile-photos/1234567890-photo.jpg",
    "emailVerified": true
  }
}
```

**Validations:**
- Code doit être exactement 5 chiffres
- Code doit correspondre à celui envoyé
- Code ne doit pas être expiré (15 min)
- Session doit exister pour cet email

#### 3. **POST `/api/auth/resend-signup-code`**
Renvoie le code de vérification

**Body:**
```json
{
  "email": "jean@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "✓ Nouveau code envoyé par email"
}
```

**Limitations:**
- Session doit exister et ne pas être expirée
- Timer de renvoi de 60 secondes côté frontend

## Frontend Components

### 1. **RegisterUser.jsx**
Page d'inscription avec formulaire complet

**Nouveautés:**
- Upload de photo de profil avec aperçu
- Validation avant envoi
- 2 étapes claires
- État de chargement pendant l'envoi du code

**Champs:**
- Nom (requis)
- Email (requis)
- Téléphone (optionnel)
- Adresse (optionnel)
- Photo de profil (optionnel, max 5MB)
- Mot de passe (requis, min 6 caractères)
- Confirmation mot de passe (requis)

**Flux:**
1. Utilisateur remplit le formulaire
2. Clique sur "Créer un compte utilisateur"
3. Requête POST à `/api/auth/signup-step1`
4. Email reçu avec code de vérification
5. Redirection automatique à `/verify-signup-code`

### 2. **VerifySignupCodePage.jsx**
Page d'entrée du code à 5 chiffres

**Fonctionnalités:**
- 5 champs d'entrée indépendants
- Auto-focus entre les champs
- Auto-submit quand tous les chiffres sont entrés
- Validation des chiffres uniquement
- Gestion du backspace entre champs
- Bouton "Renvoyer le code" avec timer de 60s
- États : chargement, succès, erreur

**Flux:**
1. Utilisateur voit son email pré-rempli
2. Entre les 5 chiffres
3. Auto-submit après le 5e chiffre
4. Requête POST à `/api/auth/signup-step2` avec FormData (photo incluse)
5. JWT reçu et stocké dans localStorage
6. Redirection automatique au tableau de bord approprié

## Modèle de Données User

### Nouveaux Champs:
```javascript
{
  // Vérification d'email pour l'inscription
  emailVerificationCode: String,        // Code 5 chiffres
  emailVerificationCodeExpires: Date,   // Expire 15 min après génération
  
  // Photo de profil
  profilePhoto: String,                 // URL du fichier uploadé
  
  // Vérification d'email (existant)
  emailVerified: Boolean,                // true après signup-step2
  emailVerificationToken: String,        // Pour les changements d'email
  emailVerificationExpires: Date,
  pendingNewEmail: String
}
```

## Email Template

Le code est envoyé avec un design professionnel :

```
┌─────────────────────────────────────────┐
│         Bienvenue sur Velya !           │
├─────────────────────────────────────────┤
│                                         │
│  Voici votre code de vérification :    │
│                                         │
│              12345                      │
│                                         │
│   (Valide pendant 15 minutes)           │
│                                         │
│  ← Lien de retour vers l'app           │
│                                         │
└─────────────────────────────────────────┘
```

**Caractéristiques:**
- Code en police 48px, centré
- Délai d'expiration visible
- HTML responsive
- Lien de secours vers le formulaire

## Exemple Complet de Flux

### 1️⃣ Utilisateur arrive sur `/register-user`

```
┌──────────────────────────────────┐
│ Inscription - Formulaire Utilisateur│
├──────────────────────────────────┤
│ Nom: [Jean Dupont           ]    │
│ Email: [jean@example.com    ]    │
│ Téléphone: [+33 6 12 34 56 78] │
│ Adresse: [123 Rue de la Paix ]  │
│ Photo: [Choisir fichier...] [✓] │
│ Mot de passe: [••••••••••••]    │
│ Confirmer: [••••••••••••]        │
│                                  │
│ [Créer un compte utilisateur]    │
└──────────────────────────────────┘
```

### 2️⃣ Backend Process

```
POST /api/auth/signup-step1
  ↓
Validation des données
  ↓
Vérifier email unique
  ↓
Générer code = "12345"
  ↓
Stocker temp: { email, name, password, role, code, expiration }
  ↓
Envoyer email avec code
  ↓
Response: success ✓
  ↓
Frontend: Redirect to /verify-signup-code
```

### 3️⃣ Utilisateur reçoit l'email

```
From: noreply@velya.app
To: jean@example.com

Sujet: Votre code de vérification Velya

Corps: 
  Bienvenue Jean,
  
  Voici votre code de vérification :
  
           12345
  
  Valide pendant 15 minutes
```

### 4️⃣ Utilisateur entre le code

```
┌──────────────────────────────────┐
│ Vérification de votre email      │
├──────────────────────────────────┤
│                                  │
│ Code envoyé à :                  │
│ jean@example.com                 │
│                                  │
│ Entrez le code :                 │
│ [1] [2] [3] [4] [5]             │
│                                  │
│ Vous n'avez pas reçu le code ?  │
│ [Renvoyer le code]               │
│                                  │
│ [← Retour à l'inscription]       │
└──────────────────────────────────┘
```

Auto-submit → Vérification

### 5️⃣ Création du Compte

```
POST /api/auth/signup-step2
  ↓
Récupérer données temp pour jean@example.com
  ↓
Vérifier code = "12345" ✓
  ↓
Code pas expiré ✓
  ↓
Hash mot de passe
  ↓
Upload photo de profil (optionnel)
  ↓
Créer utilisateur:
  {
    name: "Jean Dupont",
    email: "jean@example.com",
    password: "hashed...",
    role: "client",
    profilePhoto: "/uploads/profile-photos/1704067200000-photo.jpg",
    emailVerified: true
  }
  ↓
Générer JWT
  ↓
Response: { token, user }
  ↓
Nettoyer données temporaires
```

### 6️⃣ Utilisateur Connecté

```
localStorage:
  token = "eyJhbGc..."
  user = { id, name, email, role, profilePhoto, emailVerified }

Redirect to:
  - /dashboard-client (si client)
  - /dashboard-prestataire (si provider)
```

## Gestion des Erreurs

### Erreurs Possibles Étape 1

| Erreur | Message | Solution |
|--------|---------|----------|
| Email déjà utilisé | "Cet email est déjà utilisé" | Utiliser autre email ou connexion |
| Champs manquants | "Tous les champs sont requis" | Remplir tous les champs |
| Mot de passe court | "Min 6 caractères" | Augmenter la longueur |
| Photo trop grande | "Fichier > 5MB" | Réduire la taille |
| Format image invalide | "Fichier invalide" | Utiliser JPG/PNG/GIF |

### Erreurs Possibles Étape 2

| Erreur | Message | Solution |
|--------|---------|----------|
| Code incorrect | "Code de vérification incorrect" | Vérifier l'email et renvoyer |
| Code expiré | "Code expiré. Recommencez" | Cliquer "Renvoyer le code" |
| Session expirée | "Session d'inscription expirée" | Recommencer l'inscription |
| Code invalide | "Code doit être 5 chiffres" | Entrer exactement 5 chiffres |

## Sécurité

✅ **Mesures Implémentées:**
- Validation stricte des données côté backend
- Crypto.randomBytes pour génération du code (sécurisé)
- Expiration du code en 15 minutes
- Email unique en base de données
- Hash bcrypt du mot de passe
- JWT signé (30 jours d'expiration)
- Nettoyage auto des sessions expirées

⚠️ **À Améliorer en Production:**
- Remplacer `global.signupPendingData` par Redis
- Implémenter rate limiting sur `/signup-step1`
- Logger les tentatives échouées
- HTTPS obligatoire
- CSRF tokens optionnels
- Vérifier le MX record de l'email

## Configuration d'Environnement

Aucune nouvelle variable d'environnement requise. Utilise :
- `REACT_APP_API_URL` (frontend)
- `JWT_SECRET` (backend)
- `MAILGUN_*` / `GMAIL_*` (email)

## Test en Development

### 1. Inscription Valide
```
URL: http://localhost:3000/register-user
Formulaire: Remplir tous les champs
Code reçu: Vérifier les logs backend ou Mailgun
Vérification: Entrer le code
Résultat: Dashboard ✓
```

### 2. Code Expiré
```
Attendre 15+ minutes
Vérifier code
Message: "Code expiré"
Solution: Cliquer "Renvoyer le code"
```

### 3. Code Invalide
```
Entrer n'importe quel code
Message: "Code incorrect"
Solution: Utiliser le bon code du mail
```

## Routes Frontend

```
/register-user              → Formulaire inscription (step 1)
/verify-signup-code         → Vérification code (step 2)
/dashboard-client           → Post-inscription (après vérification)
/dashboard-prestataire      → Post-inscription provider
```

## Migration depuis l'Ancien Système

L'ancien système `/api/auth/register` n'est plus utilisé pour les nouveaux utilisateurs.

**Ancien:**
```
POST /api/auth/register
Response: { token, user }
```

**Nouveau:**
```
POST /api/auth/signup-step1      → Envoie code
POST /api/auth/signup-step2      → Crée utilisateur
```

## Checklist de Vérification

- ✅ Backend routes créées
- ✅ Frontend pages créées
- ✅ Email template avec code
- ✅ Stockage temp des données
- ✅ Upload de photo intégré
- ✅ Gestion erreurs implémentée
- ✅ Auto-redirection fonctionnelle
- ✅ Timer de renvoi de code
- ✅ Nettoyage des données expirées
- ✅ SessionStorage pour données temporaires

## Dépannage

### "Code non envoyé"
→ Vérifier les logs backend pour erreurs Mailgun
→ Vérifier EMAIL_DOMAIN dans l'env
→ Vérifier MAILGUN_API_KEY valide

### "Erreur multipart/form-data"
→ Multer correctement configuré
→ Headers Content-Type auto-géré par axios
→ Dossier uploads/profile-photos existe

### "Redirection ne fonctionne pas"
→ JWT token valide et stocké
→ localStorage accessible
→ Role parsé correctement du token

---

**Créé le:** 2025  
**Version:** 1.0  
**Statut:** Production Ready
