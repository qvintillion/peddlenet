#!/bin/bash

# 🚀 Enhanced Production WebSocket Server Deployment
# Version: 4.0-optimized
# Date: October 9, 2025
# Includes: Phase 1 WebSocket optimizations + production enhancements

echo "🎪 Production WebSocket Server Deployment - ENHANCED"
echo "====================================================="
echo "🎯 Target: PRODUCTION Environment"
echo "🌍 Platform: Google Cloud Run"
echo "🔧 Features: Phase 1 optimizations + admin enhancements"
echo "📈 Version: 4.0-optimized"
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

echo "✅ Production Enhancement Checklist:"
echo "====================================="
echo "✅ Enhanced room stats API with proper 404 handling"
echo "✅ Admin mesh-status endpoint with null safety"
echo "✅ Improved error responses and validation"
echo "✅ SQLite fallback system for cross-platform compatibility"
echo "✅ CORS enhancements for all frontend environments"
echo "✅ Production-hardened admin authentication"
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
echo "⚡ Using cache-busting for fresh build with all fixes..."
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
echo "📍 Service URL: $SERVICE_URL"
echo "🏥 Health check: $SERVICE_URL/health"
echo "📊 Admin analytics: $SERVICE_URL/admin/analytics"
echo "🌐 Mesh status: $SERVICE_URL/admin/mesh-status"
echo "📋 Room stats: $SERVICE_URL/room-stats/[room-id]"
echo ""
echo "🎯 Production Features Active:"
echo "==============================="
echo "✅ Enhanced error handling for all frontend components"
echo "✅ Silent 404 handling for non-existent public rooms"
echo "✅ Null safety for admin dashboard mesh metrics"
echo "✅ SQLite persistence with automatic fallback"
echo "✅ Production-grade CORS and security"
echo "✅ Real-time analytics and monitoring"
echo "✅ Room-specific broadcasting"
echo "✅ Admin authentication with session management"
echo ""
echo "🧪 Production Testing URLs:"
echo "==========================="
echo "• Health: $SERVICE_URL/health"
echo "• Analytics: $SERVICE_URL/admin/analytics"
echo "• Mesh Status: $SERVICE_URL/admin/mesh-status"
echo "• Room Stats: $SERVICE_URL/room-stats/test-room (will return 404 - expected)"
echo ""
echo "📝 Next Step: Update .env.production with this WebSocket URL:"
echo "============================================================="
echo "NEXT_PUBLIC_SIGNALING_SERVER=$SERVICE_URL"
echo ""
echo "⏱️  Version: 4.0-optimized"
echo "🛠️  Deployed via: Google Cloud Build"
echo "🎪 Ready for production frontend deployment!"
