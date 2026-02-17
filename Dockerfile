# Stage 1: Base image
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development / Build dependencies
FROM base AS dependencies
RUN npm install

# Stage 3: Final Production image
FROM base AS release
ENV NODE_ENV=production
RUN npm install --only=production

# Copy application source code
COPY . .

# Create logs directory and set permissions (if using winston to write to files)
RUN mkdir -p logs && chown -R node:node /app

# Switch to non-root user
USER node

# Expose the application port (default is 3000 in environment.js)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
