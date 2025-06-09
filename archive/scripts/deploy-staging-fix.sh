#!/bin/bash

# 🔧 Festival Chat - Staging Fix Deployment
# Deploy SQLite-based server to match working dev environment

echo "🔧 Deploying SQLite Server to Staging - Matching Dev Environment"
echo "================================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

# Check if we're authenticated with Google Cloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    echo "🔐 Authenticating with Google Cloud..."
    gcloud auth login
fi

# Set project (adjust if different)
PROJECT_ID="peddlenet-1749130439"
echo "📋 Using project: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Create temporary Dockerfile for production server (no SQLite compilation)
echo "🐳 Creating Dockerfile for production server..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install SQLite3 and build tools
RUN apk add --no-cache sqlite python3 make g++

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install only production dependencies (much faster)
RUN npm ci --only=production

# Copy server file
COPY signaling-server-sqlite.js ./
COPY sqlite-persistence.js ./

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Use non-root user
USER node

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "signaling-server-sqlite.js"]
EOF

# Deploy to Cloud Run
echo "🚀 Deploying to Google Cloud Run..."
gcloud run deploy peddlenet-websocket-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 1000 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe peddlenet-websocket-server --region=us-central1 --format="value(status.url)")
    
    if [ ! -z "$SERVICE_URL" ]; then
        echo "🌐 Service URL: $SERVICE_URL"
        
        # Convert HTTP to WSS for WebSocket connection
        WSS_URL="${SERVICE_URL/https:/wss:}"
        
        echo ""
        echo "🔧 Updating environment files..."
        
        # Update .env.firebase
        echo "# Environment variables for Firebase deployment" > .env.firebase
        echo "# Updated on $(date)" >> .env.firebase
        echo "" >> .env.firebase
        echo "# WebSocket server on Google Cloud Run (SQLite-based)" >> .env.firebase
        echo "NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL" >> .env.firebase
        
        # Update .env.local
        echo "# Environment variables for Firebase deployment" > .env.local
        echo "# Updated on $(date)" >> .env.local
        echo "" >> .env.local
        echo "# WebSocket server on Google Cloud Run (SQLite-based)" >> .env.local
        echo "NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL" >> .env.local
        
        echo "✅ Environment files updated with new SQLite server URL"
        echo ""
        echo "🧪 Testing server health..."
        
        # Test health endpoint
        HEALTH_URL="$SERVICE_URL/health"
        echo "📍 Health check: $HEALTH_URL"
        
        sleep 5  # Give server time to start
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            echo "✅ Server health check passed!"
            echo ""
            echo "🎯 Next Steps:"
            echo "1. Redeploy your frontend to pick up the new server URL"
            echo "2. Test messaging persistence in staging"
            echo "3. Verify messages survive server restarts"
            echo ""
            echo "🚀 Deploy frontend:"
            echo "   npm run deploy:firebase"
            echo "   # or"
            echo "   npm run deploy:vercel"
            echo ""
            echo "🔧 SQLite server features now available in staging:"
            echo "   ✅ Message persistence (100 messages per room)"
            echo "   ✅ Room state survival (survives restarts)"
            echo "   ✅ 24h message retention"
            echo "   ✅ Enhanced connection handling"
        else
            echo "⚠️ Server health check failed, but deployment succeeded"
            echo "The server may need a few more minutes to initialize"
        fi
    else
        echo "⚠️ Could not retrieve service URL"
    fi
    
    # Clean up
    rm -f Dockerfile
    
else
    echo "❌ Deployment failed"
    echo "Check the error messages above"
    rm -f Dockerfile
    exit 1
fi

echo ""
echo "🎪 Staging environment should now match your working dev setup!"
