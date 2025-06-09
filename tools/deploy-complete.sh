#!/bin/bash

# Complete Firebase + Cloud Run Deployment Script
# Deploys WebSocket server to Cloud Run and rebuilds Firebase with the URL

set -e

echo "🚀 Complete Firebase + Cloud Run Deployment"
echo "============================================"

PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

# Check if user wants to update Cloud Run
read -p "🤔 Update Cloud Run WebSocket server? (y/N): " update_cloudrun
update_cloudrun=${update_cloudrun:-n}

if [[ $update_cloudrun =~ ^[Yy]$ ]]; then
    echo ""
    echo "☁️ Step 1: Deploying WebSocket Server to Cloud Run"
    echo "=================================================="
    
    # Check if gcloud is available
    if ! command -v gcloud &> /dev/null; then
        echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
        exit 1
    fi
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Build and deploy to Cloud Run
    echo "🏗️ Building container image..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME .
    
    echo "🚀 Deploying to Cloud Run..."
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
        --set-env-vars PLATFORM="Google Cloud Run"
    
    echo "✅ Cloud Run deployment complete!"
else
    echo "⏭️  Skipping Cloud Run deployment"
fi

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

echo "✅ Found Cloud Run service: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Test the health endpoint
echo "🧪 Testing Cloud Run service health..."
if curl -s --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Cloud Run service is healthy"
else
    echo "⚠️  Cloud Run service health check failed, but continuing..."
fi

# Update Firebase environment
echo "📝 Updating Firebase environment..."
cat > .env.firebase << EOF
# Environment variables for Firebase deployment
# Auto-generated on $(date)

# WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Cloud Run service details
# Service URL: $SERVICE_URL
# Project: $PROJECT_ID
# Region: $REGION
EOF

# CRITICAL: Copy Firebase env to local env for Next.js build
echo "📝 Copying Firebase environment to .env.local for Next.js build..."
cp .env.firebase .env.local

echo "✅ Updated .env.firebase and .env.local with Cloud Run WebSocket URL"

echo ""
echo "🔥 Step 3: Building and Deploying Firebase"
echo "=========================================="

# Rebuild and deploy Firebase
echo "🏗️  Rebuilding Firebase with Cloud Run configuration..."
npm run build:firebase

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

# Get Firebase URL for testing
FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "🎉 Complete Deployment Successful!"
echo "================================="
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo "☁️  Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "🎛️  Firebase Console: https://console.firebase.google.com/project/festival-chat-peddlenet"
echo ""
echo "📱 Test cross-device messaging:"
echo "   1. Visit $FIREBASE_URL on desktop"
echo "   2. Create a room and get QR code"
echo "   3. Scan QR code with mobile device"
echo "   4. Send messages between devices"
echo ""
echo "🧪 Health checks:"
echo "   curl $SERVICE_URL/health"
echo "   curl $SERVICE_URL/ (service info)"
