# Stage 1: Base image
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Builder
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# Stage 3: Production release
FROM base AS release
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
# We still need package.json for type: module and other metadata
COPY package.json ./
ENV NODE_ENV=production
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
