#!/bin/bash

# Quick Firebase Update Script
# Just rebuilds and deploys Firebase with existing Cloud Run URL

set -e

echo "⚡ Quick Firebase Update"
echo "======================"

PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

# Get the existing Cloud Run service URL
echo "📡 Getting existing Cloud Run WebSocket server URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Cloud Run service not found. Please deploy it first:"
    echo "   ./tools/deploy-complete.sh"
    exit 1
fi

# Convert HTTP to WSS for WebSocket
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "✅ Using existing Cloud Run service: $SERVICE_URL"

# Update Firebase environment (in case it's missing)
echo "📝 Updating Firebase environment..."
cat > .env.firebase << EOF
# Environment variables for Firebase deployment
# Updated on $(date)

# WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL
EOF

# Rebuild and deploy Firebase
echo "🏗️  Rebuilding Firebase..."
npm run build:firebase

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "✅ Firebase Updated Successfully!"
echo "================================"
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo ""
echo "📱 Ready for testing!"
