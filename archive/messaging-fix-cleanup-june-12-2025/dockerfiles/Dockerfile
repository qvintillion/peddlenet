FROM node:18-alpine

# Install system dependencies for SQLite
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy server-specific package.json with overrides to eliminate deprecation warnings
COPY package-server.json ./package.json

# Create package-lock.json from the server package.json
RUN npm install --package-lock-only

# Install dependencies with overrides applied (eliminates deprecation warnings)
RUN npm ci --omit=dev --prefer-offline --no-fund --no-audit && npm cache clean --force

# Copy the enhanced SQLite signaling server with stability improvements
COPY signaling-server-sqlite-enhanced.js ./
COPY sqlite-persistence.js ./

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Create tmp directory for SQLite (fallback)
RUN mkdir -p /tmp/festival-chat && chown -R node:node /tmp/festival-chat

# Switch to non-root user
USER node

# Cloud Run uses PORT environment variable, default to 8080
ENV PORT=8080
ENV NODE_ENV=production
ENV PLATFORM="Google Cloud Run"
EXPOSE 8080

# Health check using the PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the enhanced SQLite server
CMD ["node", "signaling-server-sqlite-enhanced.js"]
