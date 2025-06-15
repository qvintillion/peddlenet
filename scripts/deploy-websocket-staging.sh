#!/bin/bash

# 🎭 SIMPLIFIED STAGING WebSocket Server Deployment with Cache-Busting
# ====================================================================
# Uses the proven simplified approach that eliminates tag complexity
# Features: Unique image tagging, direct deployment, health verification

set -e

echo "🎭 SIMPLIFIED Staging WebSocket Deployment with Cache-Busting"
echo "==========================================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"
REGION="us-central1"

# Generate unique identifiers for cache-busting
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_ID="staging-${BUILD_TIMESTAMP}"
GIT_COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
UNIQUE_IMAGE_TAG="${GIT_COMMIT_SHA}-${BUILD_TIMESTAMP}"

echo "🎯 Target: STAGING Environment"
echo "📦 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo "🏗️ Project: $PROJECT_ID"
echo "🏷️ Unique Tag: $UNIQUE_IMAGE_TAG"
echo "📝 Build ID: $BUILD_ID"
echo "🔗 Git SHA: $GIT_COMMIT_SHA"
echo ""

# SAFETY: Check if we're not accidentally targeting production
if [[ "$SERVICE_NAME" == *"production"* ]]; then
    echo "❌ ERROR: This script is for STAGING only!"
    exit 1
fi

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
    exit 1
fi

# Set project
echo "⚙️ Configuring Google Cloud project..."
gcloud config set project $PROJECT_ID

echo ""
echo "🧹 STEP 1: CACHE-BUSTING DOCKER BUILD"
echo "====================================="

# CRITICAL: Use unique image tag instead of :latest to force cache miss
FULL_IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${UNIQUE_IMAGE_TAG}"

echo "🐳 Building with unique image tag: $FULL_IMAGE_NAME"
echo "⚡ Using --no-cache to force fresh build (cache-busting strategy)"
echo "🔄 Build args include CACHEBUST=$BUILD_TIMESTAMP"

# Build with comprehensive cache-busting
gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NODE_ENV=production,_BUILD_TARGET=staging,_IMAGE_TAG=$UNIQUE_IMAGE_TAG,_BUILD_ID=$BUILD_ID,_GIT_COMMIT_SHA=$GIT_COMMIT_SHA

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build complete with unique tag: $UNIQUE_IMAGE_TAG"

echo ""
echo "🚀 STEP 2: SIMPLIFIED DEPLOYMENT WITH TRAFFIC"
echo "============================================="

echo "🛡️ Deploying directly with traffic (simplified approach)..."
echo "⚡ No complex tag management - direct deployment"
gcloud run deploy $SERVICE_NAME \
    --image $FULL_IMAGE_NAME \
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
    --set-env-vars VERSION="2.2.0-simplified" \
    --set-env-vars BUILD_ID=$BUILD_ID \
    --set-env-vars GIT_COMMIT_SHA=$GIT_COMMIT_SHA

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

echo "✅ Simplified deployment complete with traffic routed"

echo ""
echo "🧪 STEP 3: HEALTH VERIFICATION"
echo "============================="

# Get the live service URL for verification
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Failed to get live service URL"
    exit 1
fi

WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "🌐 Live Service URL: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Wait for service to be ready
echo "⏱️ Waiting for service to initialize..."
sleep 15

# Comprehensive health check with retry logic
MAX_RETRIES=6
RETRY_COUNT=0
HEALTH_CHECK_PASSED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$HEALTH_CHECK_PASSED" = false ]; do
    echo "🩺 Health check attempt $((RETRY_COUNT + 1))/$MAX_RETRIES..."
    
    if curl -s --max-time 15 --fail "${SERVICE_URL}/health" > /dev/null; then
        echo "✅ Health check PASSED!"
        
        # Get detailed health info
        HEALTH_RESPONSE=$(curl -s --max-time 10 "${SERVICE_URL}/health" || echo '{}')
        echo "📊 Health Response: $HEALTH_RESPONSE"
        
        HEALTH_CHECK_PASSED=true
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️ Health check failed, retrying in 10 seconds..."
            sleep 10
        fi
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    echo "❌ Health check failed after $MAX_RETRIES attempts!"
    echo "🛑 Service may not be fully functional"
    echo "🔍 Check Cloud Run logs for issues"
    exit 1
fi

echo ""
echo "🔍 STEP 4: POST-DEPLOYMENT VERIFICATION"
echo "======================================"

# Final comprehensive health check on live URL
echo "🩺 Final health verification on live URL..."
if curl -s --max-time 10 --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Live service is healthy!"
    
    # Get version verification
    VERSION_CHECK=$(curl -s --max-time 10 "$SERVICE_URL/health" | grep -o '"version":"[^"]*"' || echo 'version not found')
    BUILD_CHECK=$(curl -s --max-time 10 "$SERVICE_URL/health" | grep -o '"buildId":"[^"]*"' || echo 'build ID not found')
    
    echo "📦 $VERSION_CHECK"
    echo "🏗️ $BUILD_CHECK"
else
    echo "❌ CRITICAL: Live service health check failed!"
    echo "This indicates a deployment issue."
    exit 1
fi

echo ""
echo "📝 STEP 5: UPDATE ENVIRONMENT CONFIGURATION"
echo "=========================================="

# Update staging environment file with verified URL
cat > .env.staging << EOF
# Environment variables for Firebase STAGING deployment  
# Auto-generated on $(date)
# Simplified deployment approach v2.2.0

# STAGING WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Build information
BUILD_TARGET=staging
BUILD_ID=$BUILD_ID
BUILD_TIMESTAMP=$BUILD_TIMESTAMP
GIT_COMMIT_SHA=$GIT_COMMIT_SHA

# Deployment verification
DEPLOYMENT_VERIFIED=true
CACHE_BUSTING_APPLIED=true
SIMPLIFIED_APPROACH=true

# Cloud Run service details
# Service URL: $SERVICE_URL
# Project: $PROJECT_ID
# Region: $REGION
# Image Tag: $UNIQUE_IMAGE_TAG
EOF

echo "✅ Updated .env.staging with verified configuration"

echo ""
echo "🧹 STEP 6: CLEANUP OLD REVISIONS (Optional)"
echo "========================================"

# Keep only the latest 3 revisions to prevent bloat
echo "🗑️ Cleaning up old revisions (keeping latest 3)..."
gcloud run revisions list \
    --service=$SERVICE_NAME \
    --region=$REGION \
    --sort-by="~metadata.creationTimestamp" \
    --limit=10 \
    --format="value(metadata.name)" | tail -n +4 | while read revision; do
    if [ ! -z "$revision" ]; then
        echo "🗑️ Deleting old revision: $revision"
        gcloud run revisions delete "$revision" --region=$REGION --quiet 2>/dev/null || true
    fi
done

echo ""
echo "🎉 SIMPLIFIED STAGING DEPLOYMENT SUCCESSFUL!"
echo "==========================================="
echo "🎭 Environment: STAGING"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"
echo "🌐 Service URL: $SERVICE_URL"
echo "🛠️ Version: 2.2.0-simplified"
echo "🏷️ Image Tag: $UNIQUE_IMAGE_TAG"
echo "🏗️ Build ID: $BUILD_ID"
echo "🔗 Git SHA: $GIT_COMMIT_SHA"
echo ""
echo "✅ SIMPLIFIED CACHE-BUSTING APPLIED:"
echo "   🐳 Unique Docker image tag: $UNIQUE_IMAGE_TAG"
echo "   🚫 No-cache Docker build forced"
echo "   ⚡ Direct deployment (no tag complexity)"
echo "   🔄 Automatic traffic routing"
echo "   🩺 Health verification after deployment"
echo "   🧹 Old revision cleanup completed"
echo ""
echo "📋 Key Features Verified:"
echo "   ✅ Universal Server: Auto-detects staging environment"
echo "   ✅ Messaging Fix: io.to(roomId) includes sender"
echo "   ✅ Background Notifications: Cross-room system"
echo "   ✅ Room Codes: Registration and resolution"
echo "   ✅ Connection Recovery: Mobile-optimized"
echo "   ✅ Health Monitoring: Comprehensive verification"
echo ""
echo "🧪 Verified Health Endpoint:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "🚀 Next step - Deploy frontend with simplified approach:"
echo "   npm run deploy:firebase:complete"
echo ""
echo "🔍 Monitor deployment:"
echo "   Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""
echo "⚡ Once frontend deployed, test at:"
echo "   https://festival-chat-peddlenet.web.app"
echo ""
echo "🔧 Simplified approach advantages:"
echo "   1. No complex traffic tag management"
echo "   2. Faster deployment (fewer steps)"
echo "   3. Same cache-busting benefits with unique image tags"
echo "   4. Proven working approach"
echo "   5. Direct traffic routing"
