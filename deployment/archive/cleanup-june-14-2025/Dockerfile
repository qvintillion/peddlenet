# Dockerfile for containerized signaling server deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create a minimal package.json for signaling server
COPY package.json ./
RUN npm install --only=production

# Copy signaling server
COPY signaling-server.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S signaling -u 1001

# Change ownership
RUN chown -R signaling:nodejs /app
USER signaling

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start server
CMD ["node", "signaling-server.js"]
