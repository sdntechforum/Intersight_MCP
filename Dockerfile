# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY build/ ./build/

# Create non-root user for security
RUN addgroup -g 1001 -S intersight && \
    adduser -S intersight -u 1001

# Create directory for secrets and set permissions
RUN mkdir -p /app/secrets && \
    chown -R intersight:intersight /app

# Switch to non-root user
USER intersight

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the HTTP server
CMD ["node", "build/http-server.js"]