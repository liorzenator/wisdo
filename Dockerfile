# Stage 1: Base image
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development / Builder
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
COPY . .

# Stage 3: Build
FROM dev AS builder
RUN npm run build

# Stage 4: Production release
FROM base AS release
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
# We still need package.json for type: module and other metadata
COPY package.json ./
ENV NODE_ENV=production
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
