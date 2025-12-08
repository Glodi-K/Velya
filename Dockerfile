# Root Dockerfile - Déploie le backend par défaut
# Railway utilise ce fichier à la racine

FROM node:20-alpine

WORKDIR /app

# Copier les fichiers du backend
COPY backend/package*.json ./

# Installer les dépendances
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 10
RUN npm install --production --no-audit

# Copier le code du backend
COPY backend/src ./src
COPY backend/server.js ./
COPY backend/start-dev.js ./

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 5001

# Commande de démarrage
CMD ["npm", "start"]
