# backend/Dockerfile
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Configurer npm pour plus de patience
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 10

# Installer les dépendances avec plus de patience
RUN npm install --production --no-audit

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer la propriété des fichiers
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 5001

# Commande de démarrage
CMD ["npm", "start"]