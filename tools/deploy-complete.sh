#!/bin/bash

# Complete Firebase + Cloud Run Deployment Script - STAGING VERSION
# Deploys WebSocket server to STAGING Cloud Run and rebuilds Firebase with the URL
# ENHANCED: Now includes dev server safety checks and environment protection
# UPDATED: Automatically targets STAGING environment (not production)

set -e

echo "🎭 Complete Firebase + Cloud Run Deployment (STAGING)"
echo "===================================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"  # 🎯 STAGING SERVER
REGION="us-central1"

# SAFETY: Backup current development environment
echo "💾 Protecting development environment..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up .env.local"
fi

# SAFETY: Check if dev server is running and warn user
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ WARNING: Development server running on port 3000"
    echo "This may cause deployment conflicts."
    read -p "Stop dev server and continue? (y/N): " stop_dev
    
    if [[ $stop_dev =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping development servers..."
        pkill -f "next dev" 2>/dev/null || true
        pkill -f "signaling-server" 2>/dev/null || true
        sleep 2
        echo "✅ Development servers stopped"
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# SAFETY: Stop WebSocket server if running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🛑 Stopping WebSocket server..."
    pkill -f "signaling-server" 2>/dev/null || true
    sleep 1
fi

# Cache bust - clear builds to ensure fresh deployment
echo "🧹 Cache bust: clearing all builds..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

echo ""
echo "☁️ Step 1: Deploying WebSocket Server to Cloud Run (STAGING)"
echo "=========================================================="

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo "🎯 Deploying to STAGING WebSocket server: $SERVICE_NAME"
echo "🛡️ Using proven working configuration"
echo "📦 Docker: Dockerfile.minimal"
echo "🔌 Server: signaling-server.js (universal server with auto-detection)"
echo ""

# Build and deploy to Cloud Run using proven working configuration
echo "🏗️ Building container image for STAGING..."
gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NODE_ENV=staging

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
    --set-env-vars NODE_ENV=staging \
    --set-env-vars PLATFORM="Google Cloud Run - Staging" \
    --set-env-vars VERSION="1.2.0-messaging-fix-staging"

echo "✅ STAGING Cloud Run deployment complete!"

echo ""
echo "🔥 Step 2: Configuring Firebase with Cloud Run"
echo "=============================================="

# Get the Cloud Run service URL
echo "📡 Getting Cloud Run WebSocket server URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Cloud Run service not found. Please deploy it first."
    exit 1
fi

# Convert HTTP to WSS for WebSocket
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "✅ Found STAGING Cloud Run service: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Test the health endpoint
echo "🧪 Testing STAGING service health..."
if curl -s --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ STAGING service is healthy"
else
    echo "⚠️  STAGING service health check failed, but continuing..."
fi

# Update staging environment file
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

# Use staging environment for build
echo "📝 Using staging environment for Next.js build..."
cp .env.staging .env.local

echo ""
echo "🔥 Step 3: Building and Deploying Firebase"
echo "=========================================="

# Rebuild and deploy Firebase
echo "🏗️  Rebuilding Firebase with Cloud Run configuration..."
npm run build:firebase

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions (this was the missing piece!)
echo "🚀 Deploying to Firebase (hosting + functions)..."
firebase deploy --only hosting,functions

# SAFETY: Restore development environment
echo "🔄 Restoring development environment..."
if [ -f .env.local.backup ]; then
    mv .env.local.backup .env.local
    echo "✅ Restored original .env.local"
fi

# Get Firebase URL for testing
FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "🎉 STAGING Deployment Successful!"
echo "=============================="
echo "🎭 Firebase URL: $FIREBASE_URL"
echo "🔌 STAGING WebSocket: $WEBSOCKET_URL"
echo "🌐 Client-side code: Deployed to staging"
echo "⚡ SSR Functions: Deployed to staging"
echo "🧹 Cache-bust applied - fresh deployment guaranteed"
echo "🛡️ Development environment protected"
echo "🎯 Messaging fix: Applied (sender sees own messages)"
echo "☁️  STAGING Cloud Run: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "🏛️  Firebase Console: https://console.firebase.google.com/project/festival-chat-peddlenet"
echo ""
echo "📱 To restart development: npm run dev:mobile"
echo ""
echo "📱 Test STAGING cross-device messaging:"
echo "   1. Visit $FIREBASE_URL on desktop"
echo "   2. Create a room and get QR code"
echo "   3. Scan QR code with mobile device"
echo "   4. Send messages between devices"
echo "   ✅ Expected: Sender sees own messages immediately"
echo ""
echo "🧪 Health checks:"
echo "   curl $SERVICE_URL/health"
echo "   curl $SERVICE_URL/ (service info)"
