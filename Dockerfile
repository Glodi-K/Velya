FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 10
RUN npm install --production --no-audit

COPY backend . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5001

CMD ["npm", "start"]
