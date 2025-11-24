# Velya - Application de Services de Nettoyage

## 🏗️ Architecture Restructurée

Ce projet a été restructuré pour améliorer la maintenabilité, la scalabilité et la séparation des responsabilités.

### 📁 Structure du Projet

```
velya/
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/            # Configurations (DB, auth, etc.)
│   │   ├── controllers/       # Logique métier
│   │   ├── middleware/        # Middlewares Express
│   │   ├── models/           # Modèles Mongoose
│   │   ├── routes/           # Routes API
│   │   ├── services/         # Services métier
│   │   ├── utils/            # Utilitaires
│   │   └── app.js            # Configuration Express
│   ├── tests/                # Tests backend
│   ├── scripts/              # Scripts d'administration
│   ├── uploads/              # Fichiers uploadés
│   └── server.js             # Point d'entrée
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/           # Pages/Vues
│   │   ├── context/         # Contextes React
│   │   ├── services/        # Services API
│   │   ├── utils/           # Utilitaires frontend
│   │   └── styles/          # Styles globaux
│   └── public/
│
├── ml-service/               # Service Machine Learning
│   ├── api/                 # API Flask
│   ├── models/              # Modèles ML
│   └── scripts/             # Scripts d'entraînement
│
└── shared/                   # Code partagé
    ├── types/               # Types TypeScript
    ├── constants/           # Constantes
    └── utils/               # Utilitaires partagés
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 18.0.0
- Python >= 3.8
- MongoDB
- npm >= 8.0.0

### Installation

```bash
# Installation de toutes les dépendances
npm run install:all

# Ou installation séparée
npm run install:backend
npm run install:frontend
```

### Développement

```bash
# Démarrer tous les services en mode développement
npm run dev

# Ou démarrer individuellement
npm run dev:backend    # Backend sur port 5001
npm run dev:frontend   # Frontend sur port 3001
npm run dev:ml         # Service ML sur port 5002
```

### Production

```bash
# Build du frontend
npm run build

# Démarrage en production
npm run start:prod
```

## 🧪 Tests

```bash
# Tous les tests
npm test

# Tests backend uniquement
npm run test:backend

# Tests frontend uniquement
npm run test:frontend
```

## 📝 Scripts Disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Build de production
- `npm test` - Exécution des tests
- `npm run lint` - Vérification du code
- `npm run clean` - Nettoyage des dépendances

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine avec :

```env
# Base de données
MONGO_URI=mongodb://localhost:27017/velya

# JWT
JWT_SECRET=your_jwt_secret

# Services externes
STRIPE_SECRET_KEY=your_stripe_key
CLOUDINARY_URL=your_cloudinary_url
SENTRY_DSN=your_sentry_dsn

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:5001
ML_SERVICE_URL=http://localhost:5002
```

## 🏆 Avantages de cette Structure

1. **Séparation claire** : Backend, Frontend et ML séparés
2. **Scalabilité** : Services indépendants
3. **Maintenance** : Code organisé par domaine
4. **Déploiement** : Services déployables séparément
5. **Collaboration** : Équipes peuvent travailler indépendamment

## 📚 Documentation

- [Backend API](./backend/README.md)
- [Frontend](./frontend/README.md)
- [Service ML](./ml-service/README.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.