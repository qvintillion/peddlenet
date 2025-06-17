#!/bin/bash

# 🎪 PRODUCTION WebSocket Server Deployment Script
# =================================================
# Deploys universal WebSocket server to PRODUCTION environment
# Uses universal server with automatic production environment detection

set -e

echo "🎪 Production WebSocket Server Deployment"
echo "====================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

# SAFETY: Check if we're not accidentally targeting staging
if [[ "$SERVICE_NAME" == *"staging"* ]]; then
    echo "❌ ERROR: This script is for PRODUCTION only!"
    echo "Use ./scripts/deploy-websocket-staging.sh for staging"
    exit 1
fi

echo "🎯 Target: PRODUCTION Environment"
echo "📦 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo "🏢 Project: $PROJECT_ID"
echo ""

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
    exit 1
fi

# Set project
echo "⚙️ Configuring Google Cloud project..."
gcloud config set project $PROJECT_ID

# Verify we're using the correct Docker configuration
echo "📋 Using universal server configuration:"
echo "   🐳 Dockerfile: Dockerfile.minimal"
echo "   🖥️ Server: signaling-server.js (universal with auto-detection)"
echo "   📦 Dependencies: Minimal (no SQLite compilation issues)"
echo "   🔧 Version: 2.0.0-universal-production"
echo ""

# Build specifically for production
echo "🎨 Building container image for PRODUCTION..."
echo "Using universal server with auto-detection..."
echo "⚡ Forcing fresh build with cache-busting..."

# Use the production Docker configuration with cache busting
gcloud builds submit \
  --config=deployment/cloudbuild-production.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME

echo ""
echo "🚀 Deploying to Cloud Run (PRODUCTION)..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars BUILD_TARGET=production \
    --set-env-vars PLATFORM=cloudrun \
    --set-env-vars VERSION="2.0.0-universal-production"

# CRITICAL: Ensure environment variables are set properly
echo "🔧 Verifying production environment variables..."
gcloud run services update $SERVICE_NAME \
  --set-env-vars="NODE_ENV=production,BUILD_TARGET=production,PLATFORM=cloudrun" \
  --region=$REGION \
  --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Failed to set environment variables"
    echo "Admin dashboard may not work properly in production"
else
    echo "✅ Production environment variables set successfully"
fi

# Get the service URL for verification
echo ""
echo "📡 Getting production WebSocket server URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Failed to get production service URL"
    exit 1
fi

# Convert HTTP to WSS for WebSocket
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "✅ Production service deployed: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Test the health endpoint
echo ""
echo "🧪 Testing production service health..."
if curl -s --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Production service is healthy"
    
    # Get version info if available
    VERSION_INFO=$(curl -s "$SERVICE_URL/health" | grep -o '"version":"[^"]*"' || echo '')
    if [ ! -z "$VERSION_INFO" ]; then
        echo "📦 $VERSION_INFO"
    fi
else
    echo "⚠️ Production service health check failed"
    echo "💡 The service might still be starting up. Try again in 30 seconds."
fi

# Update the production environment file
echo ""
echo "📝 Updating .env.production with new WebSocket URL..."
cat > .env.production << EOF
# Environment variables for Vercel PRODUCTION deployment  
# Auto-generated on $(date)

# PRODUCTION WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Build target
BUILD_TARGET=production
NODE_ENV=production
PLATFORM=vercel

# Cloud Run service details
# Service URL: $SERVICE_URL
# Project: $PROJECT_ID
# Region: $REGION
EOF

echo "✅ Updated .env.production"

echo ""
echo "🎉 Production WebSocket Server Deployment Complete!"
echo "==============================================="
echo "🎪 Environment: PRODUCTION"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"
echo "🌐 Service URL: $SERVICE_URL"
echo "🛠️ Version: 2.0.0-universal-production"
echo ""
echo "📋 Key Features Deployed:"
echo "   ✅ Universal Server: Auto-detects production environment"
echo "   ✅ Messaging Fix: io.to(roomId) includes sender"
echo "   ✅ Background Notifications: Cross-room system"
echo "   ✅ Room Codes: Registration and resolution"
echo "   ✅ Connection Recovery: Mobile-optimized"
echo "   ✅ Admin Dashboard: Complete analytics and management"
echo "   ✅ Production Ready: High performance, scaling enabled"
echo ""
echo "🧪 Test the production server:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "🚀 Next step - Deploy frontend to production:"
echo "   npm run deploy:vercel:complete"
echo ""
echo "🔍 Monitor production deployment:"
echo "   Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""
echo "⚡ Once frontend deployed, LIVE at:"
echo "   https://peddlenet.app"
echo "   https://peddlenet.app/admin-analytics (Admin Dashboard)"
