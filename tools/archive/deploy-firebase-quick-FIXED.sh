#!/bin/bash

# FIXED: Quick Firebase Deploy with BOTH hosting and functions
# This ensures client-side code updates get deployed

set -e

echo "⚡ FIXED Quick Firebase Deploy (Hosting + Functions)"
echo "==================================================="

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
    echo "⚠️ Cloud Run service not found, using fallback..."
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

# Clear any cached builds
echo "🧹 Clearing cached builds..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

# Rebuild everything
echo "🏗️ Rebuilding Next.js..."
npm run build

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions (this was the missing piece!)
echo "🚀 Deploying BOTH hosting and functions to Firebase..."
firebase deploy --only hosting,functions

FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "✅ FIXED Firebase Deploy Complete!"
echo "================================="
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo "📱 Client-side code: UPDATED (hosting deployed)"
echo "⚡ SSR Functions: UPDATED"
echo ""
echo "🎯 Your mobile notification debug should now appear!"
