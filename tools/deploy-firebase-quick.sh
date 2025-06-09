#!/bin/bash

# Quick Firebase Functions Update Script
# Rebuilds and deploys Firebase Functions with SSR

set -e

echo "⚡ Quick Firebase Functions Update"
echo "================================="

PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

# Get the existing Cloud Run service URL (optional, for display)
echo "📡 Getting existing Cloud Run WebSocket server URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "⚠️ Cloud Run service not found, but continuing with Functions deployment..."
    WEBSOCKET_URL="wss://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app"
else
    # Convert HTTP to WSS for WebSocket
    WEBSOCKET_URL="wss://${SERVICE_URL#https://}"
    echo "✅ Using existing Cloud Run service: $SERVICE_URL"
fi

# Update Firebase environment
echo "📝 Updating Firebase environment..."
cat > .env.firebase << EOF
# Environment variables for Firebase deployment
# Updated on $(date)

# WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL
EOF

# Copy env for Next.js build
cp .env.firebase .env.local

# Rebuild and deploy Firebase Functions
echo "🏗️ Rebuilding Next.js..."
npm run build

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

echo "🚀 Deploying Functions to Firebase..."
firebase deploy --only functions

FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "✅ Firebase Functions Updated Successfully!"
echo "=========================================="
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo "⚡ SSR Functions: Deployed"
echo ""
echo "📱 Ready for testing!"
