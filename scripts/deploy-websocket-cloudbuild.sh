#!/bin/bash

# 🚀 PRODUCTION WebSocket Server Deployment Script
# Deploy universal WebSocket server to production Cloud Run
# Version: 1.2.0-phase1-optimized
# Date: October 8, 2025
# Includes: Phase 1 WebSocket optimizations for Cloud Run stability

echo "🚀 Production WebSocket Server Deployment - Phase 1 Optimized"
echo "=============================================================="
echo "🎯 Target: PRODUCTION Environment"
echo "🌍 Platform: Google Cloud Run"
echo "🔧 Features: Phase 1 WebSocket optimizations"
echo "📈 Version: 1.2.0-phase1-optimized"
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: signaling-server.js not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set project variables - PRODUCTION PROJECT ID
PROJECT_ID="festival-chat-peddlenet"  # Production project ID
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Method: Google Cloud Build (no local Docker required)"
echo ""

echo "📋 Using universal server configuration:"
echo "   🐳 Dockerfile: Dockerfile.cloudrun"
echo "   🖥️ Server: signaling-server.js (universal with auto-detection)"
echo "   📦 Build: Google Cloud Build (no local Docker required)"
echo "   🔧 Version: 1.2.0-phase1-optimized"
echo ""
echo "✅ Phase 1 Optimization Checklist:"
echo "====================================="
echo "✅ Increased timeouts: 90s ping, 35s interval (Cloud Run optimized)"
echo "✅ Automatic reconnection enabled on client (handles scale-to-zero)"
echo "✅ Memory cleanup: Hourly cleanup, 24h message retention for public rooms"
echo "✅ CORS fix: Vercel preview domain support with regex patterns"
echo "✅ Cold start detection: Adaptive timeouts for Cloud Run startup"
echo "✅ Connection health monitoring: Ping/pong statistics tracking"
echo "✅ Environment detection: Correctly identifies staging vs production"
echo ""

# Check if gcloud is authenticated
echo "🔐 Checking Google Cloud authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🎯 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Submit build to Cloud Build (production configuration)
echo "☁️  Submitting production build to Google Cloud Build..."
echo "⚡ Using cache-busting for fresh build with Phase 1 optimizations..."
gcloud builds submit \
  --config deployment/cloudbuild-production.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Cloud Build deployment failed"
    exit 1
fi

# CRITICAL: Set environment variables after deployment
echo "🔧 Setting production environment variables..."
gcloud run services update $SERVICE_NAME \
  --set-env-vars="NODE_ENV=production,BUILD_TARGET=production,PLATFORM=cloudrun" \
  --region=$REGION \
  --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Failed to set environment variables"
    echo "Admin dashboard may not work properly"
else
    echo "✅ Environment variables set successfully"
fi

# Get the service URL
echo "📍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo ""
echo "🎉 PRODUCTION WEBSOCKET SERVER DEPLOYMENT SUCCESSFUL!"
echo "====================================================="
echo "🚀 Environment: PRODUCTION"
echo "📍 Service URL: $SERVICE_URL"
echo "🏥 Health check: $SERVICE_URL/health"
echo "📊 Admin dashboard: $SERVICE_URL/admin"
echo "🛠️ Version: 1.2.0-phase1-optimized"
echo ""
echo "📋 Phase 1 Features Active:"
echo "============================"
echo "✅ Universal Server: Auto-detects production environment"
echo "✅ Increased Timeouts: 90s ping, 35s interval (Cloud Run optimized)"
echo "✅ Automatic Reconnection: Client handles scale-to-zero gracefully"
echo "✅ Memory Cleanup: Hourly cleanup, 24h for public rooms"
echo "✅ CORS Support: Vercel domains (production + preview)"
echo "✅ Cold Start Detection: Adaptive timeouts for Cloud Run"
echo "✅ Connection Health: Ping/pong monitoring and statistics"
echo ""
echo "🧪 Test Production Server:"
echo "=========================="
echo "curl $SERVICE_URL/health"
echo ""
echo "💰 Cost:"
echo "========"
echo "• min-instances=0 (scales to zero when idle)"
echo "• Cost when idle: \$0"
echo "• Cost when active: Pay per use"
echo ""
echo "📝 WebSocket URL (already configured in next.config.ts):"
echo "========================================================="
# Convert https to wss
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"
echo "$WEBSOCKET_URL"
echo ""
echo "🔍 Monitor Deployment:"
echo "======================"
echo "Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""
echo "✅ Ready for production traffic!"
echo "Vercel production (peddlenet.app) will automatically connect to this server."
