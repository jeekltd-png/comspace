FROM node:20-alpine AS base

# Backend Dockerfile
FROM base AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM base AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/dist ./dist
EXPOSE 5000
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:5000/health || exit 1
CMD ["node", "dist/server.js"]

# Frontend Dockerfile  
FROM base AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM base AS frontend
WORKDIR /app
ENV NODE_ENV=production
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY frontend/next.config.js ./
EXPOSE 3000
CMD ["npm", "start"]
