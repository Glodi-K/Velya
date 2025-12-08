# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

RUN apk add --no-cache git

RUN git clone https://github.com/Glodi-K/Velya.git . --depth 1

WORKDIR /frontend/frontend

RUN npm install

RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /backend

COPY backend/package*.json ./

RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 10
RUN npm install --omit=dev --no-audit

COPY backend . .

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

COPY --from=backend-builder /backend ./backend
COPY --from=frontend-builder /frontend/frontend/build ./public

RUN apk add --no-cache nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

RUN echo '#!/bin/sh\nnginx -g "daemon off;" &\ncd /app/backend && npm start' > /start.sh && chmod +x /start.sh

USER nodejs

EXPOSE 80 5001

CMD ["/start.sh"]
