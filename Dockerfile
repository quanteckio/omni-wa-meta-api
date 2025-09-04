# Multi-stage build for production
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and set ownership
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
WORKDIR /usr/src/app

# Switch to non-root user
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Build stage - install all dependencies (including devDependencies for TypeScript compilation)
FROM base AS builder

# Copy package files for dependency installation
COPY --chown=node:node package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm ci && npm cache clean --force

# Copy source code
COPY --chown=node:node . .

# Build TypeScript to JavaScript
RUN npm run build

# Production dependencies stage
FROM base AS dependencies

# Copy package files for dependency installation
COPY --chown=node:node package*.json ./

RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production

# Copy node_modules from dependencies stage (production only)
COPY --from=dependencies --chown=node:node /usr/src/app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Expose port (default Express port)
EXPOSE 3000


# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
