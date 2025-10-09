# Plan de Restructuration - Projet Velya

## Structure Actuelle vs Proposée

### 🎯 Objectifs
- Séparer clairement backend et frontend
- Organiser les fichiers par domaine métier
- Éliminer les duplications
- Améliorer la maintenabilité

### 📁 Nouvelle Structure Proposée

```
velya/
├── backend/                          # API Node.js/Express
│   ├── src/
│   │   ├── config/                   # Configurations (DB, auth, etc.)
│   │   ├── controllers/              # Logique métier
│   │   ├── middleware/               # Middlewares Express
│   │   ├── models/                   # Modèles Mongoose
│   │   ├── routes/                   # Routes API
│   │   ├── services/                 # Services métier
│   │   ├── utils/                    # Utilitaires
│   │   └── app.js                    # Configuration Express
│   ├── tests/                        # Tests backend
│   ├── scripts/                      # Scripts d'administration
│   ├── uploads/                      # Fichiers uploadés
│   ├── server.js                     # Point d'entrée
│   └── package.json
│
├── frontend/                         # Application React
│   ├── src/
│   │   ├── components/               # Composants réutilisables
│   │   ├── pages/                    # Pages/Vues
│   │   ├── hooks/                    # Hooks personnalisés
│   │   ├── context/                  # Contextes React
│   │   ├── services/                 # Services API
│   │   ├── utils/                    # Utilitaires frontend
│   │   ├── styles/                   # Styles globaux
│   │   └── App.js
│   ├── public/
│   ├── tests/
│   └── package.json
│
├── ml/                               # Services Machine Learning
│   ├── models/                       # Modèles ML
│   ├── scripts/                      # Scripts d'entraînement
│   ├── api/                          # API ML (Flask/FastAPI)
│   └── requirements.txt
│
├── shared/                           # Code partagé
│   ├── types/                        # Types TypeScript
│   ├── constants/                    # Constantes
│   └── utils/                        # Utilitaires partagés
│
├── docs/                             # Documentation
├── docker/                           # Configurations Docker
├── scripts/                          # Scripts de déploiement
└── package.json                      # Workspace root
```

## 🔄 Étapes de Migration

### Étape 1: Préparation
- [ ] Créer la nouvelle structure de dossiers
- [ ] Sauvegarder le projet actuel

### Étape 2: Backend
- [ ] Déplacer les fichiers backend vers `/backend/src/`
- [ ] Nettoyer les duplications
- [ ] Réorganiser par domaine métier

### Étape 3: Frontend
- [ ] Réorganiser les composants React
- [ ] Séparer les services API
- [ ] Optimiser la structure des pages

### Étape 4: ML & Services
- [ ] Isoler les services ML
- [ ] Créer une API ML dédiée

### Étape 5: Configuration
- [ ] Centraliser les configurations
- [ ] Mettre à jour les scripts de build/deploy

## 🚀 Avantages de cette structure

1. **Séparation claire** : Backend/Frontend/ML séparés
2. **Scalabilité** : Structure modulaire
3. **Maintenance** : Code organisé par domaine
4. **Déploiement** : Services indépendants
5. **Collaboration** : Équipes peuvent travailler séparément

## ⚠️ Points d'attention

- Migration progressive pour éviter les interruptions
- Tests après chaque étape
- Mise à jour des chemins d'import
- Configuration des environnements