# Stage 1: Base image
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development dependencies
FROM base AS dev
RUN npm install
COPY . .
ENV NODE_ENV=development
CMD ["npm", "start"]

# Stage 3: Production release
FROM base AS release
RUN npm install --only=production
COPY . .
ENV NODE_ENV=production
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
