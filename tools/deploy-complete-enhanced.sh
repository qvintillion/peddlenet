#!/bin/bash

# ENHANCED Complete Firebase + Cloud Run Deployment Script - STAGING VERSION
# Deploys WebSocket server to STAGING Cloud Run and rebuilds Firebase with the URL
# ENHANCED: Comprehensive debugging, cache clearing, and error detection
# FEATURES: Auto-detects environment variables, validates URLs, clears all caches
# CACHE-BUSTING: Uses BUILD_ID in Docker builds to force fresh server deployments

set -e

echo "🎭 ENHANCED Complete Firebase + Cloud Run Deployment (STAGING)"
echo "============================================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"  # 🎯 STAGING SERVER
REGION="us-central1"

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
    firebase logout --no-localhost 2>/dev/null || true
    firebase login --no-localhost 2>/dev/null || true
    
    # Browser cache instructions
    echo "🗑️  NOTE: After deployment, clear browser cache or use incognito mode"
    
    echo "✅ All caches cleared"
}

# ENHANCED: Environment debugging function
debug_environment() {
    echo "🔍 ENVIRONMENT DEBUGGING"
    echo "========================"
    
    echo "📁 Current directory: $(pwd)"
    echo "📊 Node version: $(node --version)"
    echo "📊 NPM version: $(npm --version)"
    echo "📊 Firebase CLI: $(firebase --version || echo 'Not installed')"
    echo "📊 gcloud CLI: $(gcloud --version | head -n1 || echo 'Not installed')"
    
    echo ""
    echo "🔧 Environment Variables:"
    echo "  - NODE_ENV: ${NODE_ENV:-not set}"
    echo "  - NEXT_PUBLIC_SIGNALING_SERVER: ${NEXT_PUBLIC_SIGNALING_SERVER:-not set}"
    echo "  - NEXT_PUBLIC_DETECTED_IP: ${NEXT_PUBLIC_DETECTED_IP:-not set}"
    
    echo ""
    echo "📁 Environment Files:"
    for env_file in .env .env.local .env.staging .env.production .env.preview; do
        if [ -f "$env_file" ]; then
            echo "  - $env_file: EXISTS"
            if [ "$env_file" = ".env.staging" ]; then
                echo "    Content preview:"
                head -n 3 "$env_file" | sed 's/^/      /'
            fi
        else
            echo "  - $env_file: missing"
        fi
    done
    
    echo ""
    echo "🌐 Network Info:"
    echo "  - Hostname: $(hostname)"
    echo "  - IP addresses:"
    ifconfig | grep "inet " | grep -v "127.0.0.1" | head -n 3 | sed 's/^/      /'
}

# ENHANCED: URL validation function
validate_urls() {
    local service_url="$1"
    local websocket_url="$2"
    
    echo "🧪 URL VALIDATION"
    echo "================="
    
    echo "🔗 Service URL: $service_url"
    echo "🔗 WebSocket URL: $websocket_url"
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    if curl -s --max-time 10 --fail "$service_url/health" > /dev/null; then
        echo "✅ Health check PASSED"
    else
        echo "❌ Health check FAILED"
        echo "🧪 Trying alternative health check..."
        curl -s --max-time 10 "$service_url/health" || echo "Alternative check also failed"
    fi
    
    # Test WebSocket endpoint (basic connection test)
    echo "🔌 Testing WebSocket endpoint availability..."
    if curl -s --max-time 10 --fail "$service_url/" > /dev/null; then
        echo "✅ WebSocket endpoint accessible"
    else
        echo "❌ WebSocket endpoint not accessible"
    fi
    
    # Validate URL format
    if [[ "$websocket_url" =~ ^wss://[a-zA-Z0-9.-]+$ ]]; then
        echo "✅ WebSocket URL format is valid"
    else
        echo "⚠️  WebSocket URL format may be incorrect: $websocket_url"
    fi
}

# ENHANCED: Build verification function
verify_build() {
    echo "🔍 BUILD VERIFICATION"
    echo "===================="
    
    # Check if admin analytics page exists in build
    if [ -f ".next/server/app/admin-analytics/page.js" ]; then
        echo "✅ Admin analytics page found in build"
        
        # Check if it contains the placeholder URL
        if grep -q "peddlenet-websocket-server-\[hash\]" ".next/server/app/admin-analytics/page.js" 2>/dev/null; then
            echo "❌ CRITICAL: Build still contains placeholder URL!"
            echo "🔧 This indicates the environment variable wasn't picked up during build"
            return 1
        else
            echo "✅ No placeholder URLs detected in build"
        fi
    else
        echo "⚠️  Admin analytics page not found in build"
    fi
    
    # Check environment variable injection
    if [ -f ".next/server/app/admin-analytics/page.js" ]; then
        echo "🔍 Checking for environment variable injection..."
        if grep -q "NEXT_PUBLIC_SIGNALING_SERVER" ".next/server/app/admin-analytics/page.js" 2>/dev/null; then
            echo "✅ Environment variable reference found in build"
        else
            echo "⚠️  Environment variable reference not found in build"
        fi
    fi
}

# START OF MAIN SCRIPT
echo "🚀 Starting enhanced deployment process..."
echo "Time: $(date)"
echo ""

# SAFETY: Backup current development environment
echo "💾 PROTECTING DEVELOPMENT ENVIRONMENT"
echo "====================================="
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ Backed up .env.local with timestamp"
fi

# SAFETY: Check if dev server is running
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

# Run debugging
debug_environment

# Clear all caches
clear_all_caches

echo ""
echo "☁️ STEP 1: DEPLOYING WEBSOCKET SERVER TO CLOUD RUN"
echo "=================================================="

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install gcloud CLI."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo "🎯 Deploying to STAGING WebSocket server: $SERVICE_NAME"
echo "🛡️ Using proven working configuration"
echo "📦 Docker: Dockerfile.minimal"
echo "🔌 Server: signaling-server.js (universal server with auto-detection)"
echo ""

# Build and deploy to Cloud Run
echo "🏗️ Building container image for STAGING..."
echo "⚡ Using cache-busting for fresh server build..."
gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_BUILD_TARGET=staging

echo "🚀 Deploying to Cloud Run (STAGING)..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
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
    --set-env-vars VERSION="1.3.0-enhanced-deployment"

echo "✅ STAGING Cloud Run deployment complete!"

echo ""
echo "🔥 STEP 2: CONFIGURING FIREBASE WITH CLOUD RUN"
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

echo "✅ Found STAGING Cloud Run service: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Validate URLs
validate_urls "$SERVICE_URL" "$WEBSOCKET_URL"

# Update staging environment file
echo "📝 Updating .env.staging with new WebSocket URL..."
cat > .env.staging << EOF
# Environment variables for Firebase STAGING deployment  
# Auto-generated on $(date '+%Y-%m-%d %H:%M:%S')
# Enhanced deployment script v1.3.0

# STAGING WebSocket server on Google Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Build target
BUILD_TARGET=staging

# Next.js environment (use production for optimized builds)
NODE_ENV=production

# Deployment info
DEPLOYMENT_TIMESTAMP=$(date +%s)
DEPLOYMENT_DATE="$(date '+%Y-%m-%d %H:%M:%S')"

# Cloud Run service details
# Service URL: $SERVICE_URL
# Project: $PROJECT_ID
# Region: $REGION
# Service Name: $SERVICE_NAME
EOF

# Use staging environment for build
echo "📝 Using staging environment for Next.js build..."
cp .env.staging .env.local

# CRITICAL: Verify environment variable is set
echo "🔍 Verifying environment variable setup..."
source .env.local
if [ -n "$NEXT_PUBLIC_SIGNALING_SERVER" ]; then
    echo "✅ NEXT_PUBLIC_SIGNALING_SERVER is set: $NEXT_PUBLIC_SIGNALING_SERVER"
else
    echo "❌ CRITICAL: NEXT_PUBLIC_SIGNALING_SERVER is not set!"
    exit 1
fi

echo ""
echo "🔥 STEP 3: BUILDING AND DEPLOYING FIREBASE"
echo "=========================================="

# Set NODE_ENV for build (Next.js standard)
export NODE_ENV=production  # Use production for staging builds
export BUILD_TARGET=staging  # Our custom variable for environment detection

# Rebuild and deploy Firebase
echo "🏗️ Rebuilding Firebase with Cloud Run configuration..."
echo "Environment: $NODE_ENV"
echo "WebSocket URL: $NEXT_PUBLIC_SIGNALING_SERVER"

npm run build:firebase

# Verify build
verify_build || {
    echo "❌ Build verification failed - aborting deployment"
    exit 1
}

echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions
echo "🚀 Deploying to Firebase (hosting + functions)..."
firebase deploy --only hosting,functions

# ENHANCED: Post-deployment verification
echo ""
echo "🧪 POST-DEPLOYMENT VERIFICATION"
echo "==============================="

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
echo "🎉 ENHANCED STAGING DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo "🎭 Firebase URL: $FIREBASE_URL"
echo "🔌 STAGING WebSocket: $WEBSOCKET_URL"
echo "🌐 Client-side code: Deployed to staging"
echo "⚡ SSR Functions: Deployed to staging"
echo "🧹 Comprehensive cache clearing applied"
echo "🛡️ Development environment protected & restored"
echo "🔍 Build verification passed"
echo "🧪 URL validation completed"
echo ""
echo "🎯 ADMIN DASHBOARD DEBUGGING:"
echo "  - URL: $FIREBASE_URL/admin-analytics"
echo "  - Should now use: $WEBSOCKET_URL"
echo "  - No more placeholder URLs!"
echo ""
echo "📱 To restart development:"
echo "  npm run dev:mobile"
echo ""
echo "🧪 Complete test sequence:"
echo "  1. Visit $FIREBASE_URL/admin-analytics"
echo "  2. Check browser console for URL being used"
echo "  3. Verify connection status shows 'Connected'"
echo "  4. Test dashboard functionality"
echo ""
echo "☁️  Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "🏛️  Firebase Console: https://console.firebase.google.com/project/festival-chat-peddlenet"
echo ""
echo "🔧 If admin dashboard still fails:"
echo "  1. Clear browser cache completely"
echo "  2. Use incognito/private browsing mode"
echo "  3. Check browser developer tools for any cached files"
echo "  4. Run: firebase hosting:channel:deploy admin-debug"
