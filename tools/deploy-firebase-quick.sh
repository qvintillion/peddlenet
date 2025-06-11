#!/bin/bash

# Quick Firebase Functions + Hosting Update Script
# Rebuilds and deploys Firebase Functions with SSR + Hosting
# ENHANCED: Now includes dev server safety checks and environment protection

set -e

echo "⚡ Quick Firebase Functions + Hosting Update (Safe)"
echo "=================================================="

PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
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
echo "🧹 Cache bust: clearing builds..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

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

# Update Firebase environment (temporarily)
echo "📝 Updating Firebase environment..."
cat > .env.firebase << EOF
# Environment variables for Firebase deployment
# Updated on $(date)

# WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL
EOF

# Copy env for Next.js build
cp .env.firebase .env.local

# Rebuild and deploy Firebase Functions + Hosting
echo "🏗️ Rebuilding Next.js..."
npm run build

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions (this was the missing piece!)
echo "🚀 Deploying Functions + Hosting to Firebase..."
firebase deploy --only hosting,functions

# SAFETY: Restore development environment
echo "🔄 Restoring development environment..."
if [ -f .env.local.backup ]; then
    mv .env.local.backup .env.local
    echo "✅ Restored original .env.local"
fi

FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo "✅ Firebase Functions + Hosting Updated Successfully!"
echo "=================================================="
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🔌 WebSocket Server: $WEBSOCKET_URL"
echo "⚡ SSR Functions: Deployed"
echo "🌐 Client-side code: Deployed"
echo "🧹 Cache-bust applied - fresh deployment guaranteed"
echo "🛡️ Development environment protected"
echo ""
echo "📱 To restart development: npm run dev:mobile"
