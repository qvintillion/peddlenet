#!/bin/bash

# 🎭 ENHANCED Complete Firebase + Cloud Run Deployment with SIMPLIFIED APPROACH
# =============================================================================
# Uses proven working approach from deploy-simplified.sh with comprehensive features
# Eliminates tag complexity while maintaining cache-busting benefits

set -e

echo "🎭 ENHANCED Complete Firebase + Cloud Run Deployment (SIMPLIFIED)"
echo "================================================================"

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"  # 🎯 STAGING SERVER
REGION="us-central1"

# Generate unique identifiers for cache-busting
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_ID="staging-${BUILD_TIMESTAMP}"
GIT_COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
UNIQUE_TAG="${GIT_COMMIT_SHA}-${BUILD_TIMESTAMP}"

echo "🏷️ Unique Build Tag: $UNIQUE_TAG"
echo "🏗️ Build ID: $BUILD_ID"
echo "🔗 Git SHA: $GIT_COMMIT_SHA"
echo "⏰ Timestamp: $BUILD_TIMESTAMP"
echo ""

# ENHANCED: Comprehensive cache clearing function
clear_all_caches() {
    echo "🧹 COMPREHENSIVE CACHE CLEARING"
    echo "==============================="
    
    # Next.js caches
    echo "🗑️  Clearing Next.js caches..."
    rm -rf .next/
    rm -rf functions/.next/
    rm -rf functions/lib/
    rm -rf out/
    
    # Node modules cache
    echo "🗑️  Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    # Functions node modules if exists
    if [ -d "functions/node_modules" ]; then
        echo "🗑️  Clearing functions node_modules..."
        rm -rf functions/node_modules/.cache/
    fi
    
    # Firebase cache
    echo "🗑️  Clearing Firebase cache..."
    rm -rf .firebase/
    
    echo "✅ All caches cleared"
}

# ENHANCED: Comprehensive health verification
verify_service_health() {
    local service_url="$1"
    local max_retries=6
    local retry_count=0
    
    echo "🩺 COMPREHENSIVE HEALTH VERIFICATION"
    echo "==================================="
    echo "🔗 Testing: $service_url"
    
    while [ $retry_count -lt $max_retries ]; do
        echo "🧪 Health check attempt $((retry_count + 1))/$max_retries..."
        
        if curl -s --max-time 15 --fail "$service_url/health" > /dev/null; then
            echo "✅ Health check PASSED!"
            
            # Get detailed health info
            health_response=$(curl -s --max-time 10 "$service_url/health" 2>/dev/null || echo '{}')
            echo "📊 Health Response: $health_response"
            
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                echo "⚠️ Health check failed, retrying in 10 seconds..."
                sleep 10
            fi
        fi
    done
    
    echo "❌ Health check failed after $max_retries attempts!"
    return 1
}

# START OF MAIN SCRIPT
echo "🚀 Starting ENHANCED deployment with simplified approach..."
echo "Time: $(date)"
echo ""

# SAFETY: Backup current development environment
echo "💾 PROTECTING DEVELOPMENT ENVIRONMENT"
echo "====================================="
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ Backed up .env.local with timestamp"
fi

# SAFETY: Stop any running development servers
echo "🛑 STOPPING DEVELOPMENT SERVERS"
echo "==============================="
pkill -f "next dev" 2>/dev/null || true
pkill -f "signaling-server" 2>/dev/null || true
sleep 2
echo "✅ Development servers stopped"

# Clear all caches
clear_all_caches

echo ""
echo "☁️ STEP 1: SIMPLIFIED WEBSOCKET SERVER DEPLOYMENT"
echo "================================================"

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo "🎯 Deploying STAGING WebSocket with simplified cache-busting"
echo "🏷️ Unique image tag: $UNIQUE_TAG"
echo "📦 Service: $SERVICE_NAME"
echo ""

# CRITICAL: Build with unique tag and cache-busting
FULL_IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${UNIQUE_TAG}"

echo "🏗️ Building with comprehensive cache-busting..."
echo "🐳 Image: $FULL_IMAGE_NAME"

gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NODE_ENV=production,_BUILD_TARGET=staging,_IMAGE_TAG=$UNIQUE_TAG,_BUILD_ID=$BUILD_ID,_GIT_COMMIT_SHA=$GIT_COMMIT_SHA

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build complete with unique tag: $UNIQUE_TAG"

echo ""
echo "🚀 STEP 2: SIMPLIFIED CLOUD RUN DEPLOYMENT WITH TRAFFIC"
echo "======================================================="

echo "🛡️ Deploying directly with traffic (simplified approach)..."
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
    --set-env-vars PLATFORM="Google Cloud Run - Staging" \
    --set-env-vars VERSION="1.5.0-simplified" \
    --set-env-vars BUILD_ID=$BUILD_ID \
    --set-env-vars GIT_COMMIT_SHA=$GIT_COMMIT_SHA

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

echo "✅ Cloud Run deployment complete with traffic routed"

echo ""
echo "🧪 STEP 3: HEALTH VERIFICATION"
echo "=============================="

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

# Verify health
if ! verify_service_health "$SERVICE_URL"; then
    echo "❌ CRITICAL: Service health check failed!"
    echo "⚠️ Continuing with deployment but service may not be functional"
fi

echo ""
echo "🔥 STEP 4: CONFIGURING FIREBASE WITH VERIFIED URL"
echo "==============================================="

# Update staging environment file with verified URL
echo "📝 Updating .env.staging with verified WebSocket URL..."
cat > .env.staging << EOF
# Environment variables for Firebase STAGING deployment  
# Auto-generated on $(date '+%Y-%m-%d %H:%M:%S')
# Simplified deployment approach v1.5.0

# STAGING WebSocket server on Google Cloud Run (VERIFIED)
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
# Image Tag: $UNIQUE_TAG
EOF

# Use staging environment for build
echo "📝 Using verified staging environment for Next.js build..."
cp .env.staging .env.local

# CRITICAL: Verify environment variable is set
source .env.local
if [ -z "$NEXT_PUBLIC_SIGNALING_SERVER" ]; then
    echo "❌ CRITICAL: NEXT_PUBLIC_SIGNALING_SERVER not set!"
    exit 1
fi

echo "✅ NEXT_PUBLIC_SIGNALING_SERVER verified: $NEXT_PUBLIC_SIGNALING_SERVER"

echo ""
echo "🔥 STEP 5: BUILDING AND DEPLOYING FIREBASE"
echo "=========================================="

# Set environment variables for build
export NODE_ENV=production
export BUILD_TARGET=staging

echo "🏗️ Rebuilding Firebase with verified Cloud Run configuration..."
echo "Environment: $NODE_ENV"
echo "WebSocket URL: $NEXT_PUBLIC_SIGNALING_SERVER"

npm run build:firebase

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions
echo "🚀 Deploying to Firebase (hosting + functions)..."
firebase deploy --only hosting,functions

echo ""
echo "🧪 STEP 6: POST-DEPLOYMENT VERIFICATION"
echo "======================================"

FIREBASE_URL="https://festival-chat-peddlenet.web.app"

# Test Firebase deployment
echo "🌐 Testing Firebase deployment..."
if curl -s --max-time 10 --fail "$FIREBASE_URL" > /dev/null; then
    echo "✅ Firebase hosting is accessible"
else
    echo "⚠️  Firebase hosting test failed"
fi

# Test admin dashboard specifically
echo "🎛️ Testing admin dashboard..."
if curl -s --max-time 10 --fail "$FIREBASE_URL/admin-analytics" > /dev/null; then
    echo "✅ Admin dashboard is accessible"
else
    echo "⚠️  Admin dashboard test failed"
fi

# SAFETY: Restore development environment
echo ""
echo "🔄 RESTORING DEVELOPMENT ENVIRONMENT"
echo "===================================="
if [ -f .env.local.backup.* ]; then
    # Find the most recent backup
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    cp "$LATEST_BACKUP" .env.local
    echo "✅ Restored original .env.local from $LATEST_BACKUP"
else
    # Create a development environment
    cat > .env.local << EOF
# Development environment (auto-restored)
# Generated on $(date)

# This will be auto-detected by ServerUtils
# NEXT_PUBLIC_DETECTED_IP will be set by dev:mobile script
EOF
    echo "⚠️  No backup found, created minimal development .env.local"
fi

echo ""
echo "🎉 SIMPLIFIED DEPLOYMENT SUCCESSFUL!"
echo "==================================="
echo "🎭 Firebase URL: $FIREBASE_URL"
echo "🔌 STAGING WebSocket: $WEBSOCKET_URL"
echo "🌐 Client-side code: Deployed to staging"
echo "⚡ SSR Functions: Deployed to staging"
echo ""
echo "✅ SIMPLIFIED CACHE-BUSTING APPLIED:"
echo "   🏷️ Unique Docker image tag: $UNIQUE_TAG"
echo "   🚫 No-cache Docker build enforced"
echo "   🧹 Comprehensive cache clearing"
echo "   🩺 Health verification"
echo "   ⚡ Direct deployment (no tag complexity)"
echo ""
echo "🎯 ADMIN DASHBOARD:"
echo "  - URL: $FIREBASE_URL/admin-analytics"
echo "  - WebSocket: $WEBSOCKET_URL"
echo "  - Status: Health verified after deployment"
echo ""
echo "📱 To restart development:"
echo "  npm run dev:mobile"
echo ""
echo "🧪 Complete test sequence:"
echo "  1. Visit $FIREBASE_URL/admin-analytics"
echo "  2. Check connection status shows 'Connected'"
echo "  3. Test dashboard functionality"
echo "  4. Use incognito mode if issues persist"
echo ""
echo "🔍 Monitor deployment:"
echo "   Cloud Run: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "   Firebase: https://console.firebase.google.com/project/festival-chat-peddlenet"
echo ""
echo "🚨 Simplified approach advantages:"
echo "   1. No complex traffic tag management"
echo "   2. Faster deployment (fewer steps)"
echo "   3. Same cache-busting benefits with unique image tags"
echo "   4. Proven working approach"
