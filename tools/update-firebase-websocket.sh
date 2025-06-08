#!/bin/bash

# Auto-configure Firebase with Cloud Run WebSocket Server

set -e

echo "🔧 Auto-Configure Firebase with Cloud Run"
echo "=========================================="

PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

echo "📡 Getting Cloud Run WebSocket server URL..."

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Cloud Run service not found. Please deploy it first:"
    echo "   ./tools/deploy-to-cloudrun.sh"
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

echo "✅ Updated .env.firebase with Cloud Run WebSocket URL"

# Rebuild and deploy Firebase
echo "🏗️  Rebuilding Firebase with Cloud Run configuration..."
npm run build:firebase

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

# Get Firebase URL for testing
FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "🎉 Firebase Updated Successfully!"
echo "================================"
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo ""
echo "📱 Now you can test mobile connections:"
echo "   1. Visit $FIREBASE_URL on desktop"
echo "   2. Create a room and get QR code"
echo "   3. Scan QR code with mobile device"
echo "   4. Both will connect to the Cloud Run WebSocket server"
echo ""
echo "🧪 Test the health endpoint:"
echo "   curl $SERVICE_URL/health"
