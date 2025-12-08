# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend . .
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /backend

COPY backend/package*.json ./
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 10
RUN npm install --production --no-audit

COPY backend . .

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Copier backend
COPY --from=backend-builder /backend ./backend

# Copier frontend build
COPY --from=frontend-builder /frontend/build ./frontend/build

# Installer nginx pour servir le frontend
RUN apk add --no-cache nginx

# Copier config nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Créer utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

# Script de démarrage
RUN echo '#!/bin/sh\nnginx -g "daemon off;" &\ncd /app/backend && npm start' > /start.sh && chmod +x /start.sh

USER nodejs

EXPOSE 80 5001

CMD ["/start.sh"]
