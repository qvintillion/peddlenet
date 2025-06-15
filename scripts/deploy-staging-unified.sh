#!/bin/bash
# 🎯 SIMPLIFIED UNIFIED STAGING DEPLOYMENT SCRIPT
# ================================================
# Deploys WebSocket server + Frontend preview using the proven simplified approach
# Ensures everything is synchronized with reliable cache-busting

set -e

CHANNEL_NAME=${1:-"staging-$(date +%m%d-%H%M)"}

echo "🎯 🚀 SIMPLIFIED UNIFIED STAGING DEPLOYMENT 🚀"
echo "==============================================="
echo "🏷️  Channel: $CHANNEL_NAME"
echo "📅 Date: $(date)"
echo "🔧 Mode: SIMPLIFIED CACHE BUSTING"
echo ""

# Function to print colored status
print_status() {
    echo "🔹 $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_simplified() {
    echo "🚀 $1"
}

# Step 1: Deploy WebSocket Server to Staging using simplified approach
print_status "Step 1: Deploying WebSocket server to staging (simplified)..."
echo "🔧 This ensures backend is ready before frontend deployment"
echo ""

./scripts/deploy-websocket-staging.sh

if [ $? -ne 0 ]; then
    print_error "WebSocket staging deployment failed!"
    exit 1
fi

print_success "WebSocket server deployed to staging"
echo ""

# Step 2: Wait for server to be fully ready
print_status "Step 2: Waiting for server to be fully ready..."
echo "⏱️  Giving server 20 seconds to fully initialize..."
sleep 20

# Get the WebSocket URL from the staging file (just created by deploy-websocket-staging.sh)
if [ -f ".env.staging" ]; then
    WEBSOCKET_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging | cut -d'=' -f2)
    print_success "WebSocket URL: $WEBSOCKET_URL"
else
    print_error ".env.staging not found - something went wrong with WebSocket deployment"
    exit 1
fi

# Step 3: Test the WebSocket server health
print_status "Step 3: Testing WebSocket server health..."
HTTP_URL="https://${WEBSOCKET_URL#wss://}"

echo "🧪 Testing: $HTTP_URL/health"
if curl -s --fail "$HTTP_URL/health" > /dev/null; then
    print_success "WebSocket server is healthy and ready"
else
    print_warning "WebSocket server health check failed, but continuing..."
    print_warning "Server might still be starting up - frontend will retry connections"
fi
echo ""

# Step 4: Backup current .env.local
print_status "Step 4: Setting up frontend environment..."
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "📦 Backed up .env.local"
fi

# Step 5: Create preview environment with simplified cache busting
CACHE_BUST_TIME=$(date +%s)
DEPLOY_ID="$CHANNEL_NAME-$CACHE_BUST_TIME"
BUILD_HASH=$(openssl rand -hex 8)

print_simplified "Creating simplified cache-busting environment..."

cat > .env.local << EOF
# 🚀 SIMPLIFIED UNIFIED STAGING PREVIEW Environment 🚀
# Auto-generated on $(date)

# WebSocket server from CURRENT staging deployment
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Preview environment flags
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_CHANNEL=$CHANNEL_NAME
BUILD_TARGET=staging
NODE_ENV=production

# Firebase project
FIREBASE_PROJECT_ID=festival-chat-peddlenet

# 🚀 SIMPLIFIED CACHE BUSTING - Effective without complexity
NEXT_PUBLIC_BUILD_TIME=$CACHE_BUST_TIME
NEXT_PUBLIC_DEPLOY_ID=$DEPLOY_ID
NEXT_PUBLIC_CACHE_BUSTER=$CACHE_BUST_TIME
NEXT_PUBLIC_BUILD_HASH=$BUILD_HASH
NEXT_PUBLIC_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EOF

print_success "Environment configured for simplified staging deployment"
echo "   📡 WebSocket: $WEBSOCKET_URL"
echo "   🏷️  Channel: $CHANNEL_NAME"
echo "   🕐 Build time: $CACHE_BUST_TIME"
echo "   🔑 Build hash: $BUILD_HASH"
echo ""

# Step 6: Standard cache clearing
print_simplified "Step 6: Standard cache clearing for fresh deployment..."
echo "🗑️  Removing key caches for fresh deployment..."

# Clear Next.js caches
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# Clear any Vercel caches if present
rm -rf .vercel

# Clear npm cache (if using npm)
npm cache clean --force 2>/dev/null || true

# Clear any Firebase cache
rm -rf .firebase/cache 2>/dev/null || true

print_simplified "✅ Key caches cleared - ready for fresh build"
echo ""

# Step 7: Build with staging environment
print_status "Step 7: Building frontend with simplified cache busting..."
echo "🔨 Building with cache-busting environment variables..."

npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_success "Frontend build completed with cache busting"
echo ""

# Step 8: Standard Firebase deployment
print_simplified "Step 8: Standard Firebase deployment with cache control..."
echo "🚀 Deploying with standard cache-busting approach..."

# Deploy with standard cache settings (no complex modifications)
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -ne 0 ]; then
    print_error "Firebase preview deployment failed"
    exit 1
fi

print_simplified "✅ Frontend deployed with standard cache busting!"
echo ""

# Step 9: Restore original .env.local
if [ -f ".env.local.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    mv "$LATEST_BACKUP" .env.local
    print_success "Restored original .env.local"
fi

# Step 10: Final verification
print_status "Step 10: Final verification..."
PREVIEW_URL="https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
ADMIN_URL="$PREVIEW_URL/admin-analytics"

echo "🧪 Testing preview deployment..."
echo "⏱️  Waiting 10 seconds for deployment to propagate..."
sleep 10

if curl -s --fail "$PREVIEW_URL" > /dev/null; then
    print_success "Preview deployment is accessible"
else
    print_warning "Preview deployment accessibility test failed (might be CDN delay)"
fi

echo ""
print_simplified "🎉 🚀 SIMPLIFIED UNIFIED STAGING DEPLOYMENT COMPLETE! 🚀 🎉"
echo "========================================================"
echo ""
echo "📊 DEPLOYMENT SUMMARY:"
echo "   🎭 Environment: Staging"
echo "   🔌 WebSocket URL: $WEBSOCKET_URL"
echo "   🌐 Preview URL: $PREVIEW_URL"
echo "   🛠️  Admin Dashboard: $ADMIN_URL"
echo "   🏷️  Channel: $CHANNEL_NAME"
echo "   🚀 Cache Buster: $CACHE_BUST_TIME"
echo "   🔑 Build Hash: $BUILD_HASH"
echo "   ⏰ Expires: 7 days"
echo ""
echo "🎯 🚀 SIMPLIFIED DEPLOYMENT FEATURES:"
echo "   ✅ WebSocket server deployed FIRST (backend ready)"
echo "   ✅ Frontend uses the JUST-DEPLOYED server (no URL mismatches)"
echo "   🚀 Standard cache clearing (effective without complexity)"
echo "   🚀 Reliable cache-busting variables"
echo "   🚀 Proven deployment approach"
echo "   ✅ Health checks before frontend deployment"
echo "   ✅ Single command deploys everything in sync"
echo ""
echo "🚀 SIMPLIFIED CACHE BUSTING:"
echo "   🗑️  Local: .next, out, node_modules/.cache, npm cache"
echo "   🚀 Firebase: Standard hosting with cache control"
echo "   🔄 Environment: Effective cache-busting variables"
echo "   ⚡ No complex header modifications"
echo ""
echo "🧪 WHAT TO TEST:"
echo "   1. Chat functionality: $PREVIEW_URL"
echo "   2. Admin dashboard: $ADMIN_URL"
echo "   3. 🔧 Mesh networking functionality"
echo "   4. 🔍 Browser console: Check for correct environment detection"
echo ""
echo "💪 IF YOU STILL SEE OLD CODE:"
echo "   1. Hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)"
echo "   2. Clear browser cache"
echo "   3. Open in incognito/private window"
echo ""
echo "⚡ NEXT TIME: Just run this simplified command:"
echo "   npm run staging:unified [channel-name]"
echo ""
print_simplified "🚀 DEPLOYMENT READY WITH SIMPLIFIED RELIABLE APPROACH! 🚀"
