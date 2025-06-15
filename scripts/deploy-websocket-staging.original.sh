#!/bin/bash

# 🎭 ENHANCED STAGING WebSocket Server Deployment with Cache-Busting
# ================================================================
# Backup created: 2025-06-15 13:27:30
# Original script preserved before applying cache-busting enhancements

set -e

echo "🎭 Staging WebSocket Server Deployment"
echo "====================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"
REGION="us-central1"

# SAFETY: Check if we're not accidentally targeting production
if [[ "$SERVICE_NAME" == *"production"* ]]; then
    echo "❌ ERROR: This script is for STAGING only!"
    echo "Use ./scripts/deploy-websocket-cloudbuild.sh for production"
    exit 1
fi

echo "🎯 Target: STAGING Environment"
echo "📦 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo "🏗️ Project: $PROJECT_ID"
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
echo "   🔧 Version: 2.0.0-universal"
echo ""

# Build specifically for staging
echo "🎨 Building container image for STAGING..."
echo "Using universal server with auto-detection..."
echo "⚡ Forcing fresh build with cache-busting..."

# Use the minimal Docker configuration with cache busting
gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NODE_ENV=production,_BUILD_TARGET=staging

echo ""
echo "🚀 Deploying to Cloud Run (STAGING)..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars BUILD_TARGET=staging \
    --set-env-vars PLATFORM=cloudrun \
    --set-env-vars VERSION="2.0.0-universal-staging"

# CRITICAL: Ensure environment variables are set properly
echo "🔧 Verifying staging environment variables..."
gcloud run services update $SERVICE_NAME \
  --set-env-vars="NODE_ENV=production,BUILD_TARGET=staging,PLATFORM=cloudrun" \
  --region=$REGION \
  --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Failed to set environment variables"
    echo "Admin dashboard may not work properly in staging"
else
    echo "✅ Staging environment variables set successfully"
fi

# Get the service URL for verification
echo ""
echo "📡 Getting staging WebSocket server URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Failed to get staging service URL"
    exit 1
fi

# Convert HTTP to WSS for WebSocket
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "✅ Staging service deployed: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Test the health endpoint
echo ""
echo "🧪 Testing staging service health..."
if curl -s --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Staging service is healthy"
    
    # Get version info if available
    VERSION_INFO=$(curl -s "$SERVICE_URL/health" | grep -o '"version":"[^"]*"' || echo '')
    if [ ! -z "$VERSION_INFO" ]; then
        echo "📦 $VERSION_INFO"
    fi
else
    echo "⚠️  Staging service health check failed"
    echo "💡 The service might still be starting up. Try again in 30 seconds."
fi

# Update the staging environment file
echo ""
echo "📝 Updating .env.staging with new WebSocket URL..."
cat > .env.staging << EOF
# Environment variables for Firebase STAGING deployment  
# Auto-generated on $(date)

# STAGING WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Build target
BUILD_TARGET=staging

# Cloud Run service details
# Service URL: $SERVICE_URL
# Project: $PROJECT_ID
# Region: $REGION
EOF

echo "✅ Updated .env.staging"

echo ""
echo "🎉 Staging WebSocket Server Deployment Complete!"
echo "==============================================="
echo "🎭 Environment: STAGING"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"
echo "🌐 Service URL: $SERVICE_URL"
echo "🛠️ Version: 2.0.0-universal-staging"
echo ""
echo "📋 Key Features Deployed:"
echo "   ✅ Universal Server: Auto-detects staging environment"
echo "   ✅ Messaging Fix: io.to(roomId) includes sender"
echo "   ✅ Background Notifications: Cross-room system"
echo "   ✅ Room Codes: Registration and resolution"
echo "   ✅ Connection Recovery: Mobile-optimized"
echo "   ✅ Future Ready: Analytics and mesh endpoints"
echo ""
echo "🧪 Test the staging server:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "🚀 Next step - Deploy frontend to staging:"
echo "   npm run deploy:firebase:complete"
echo ""
echo "🔍 Monitor staging deployment:"
echo "   Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""
echo "⚡ Once frontend deployed, test messaging at:"
echo "   https://festival-chat-peddlenet.web.app"
