#!/bin/bash
# 🎯 NUCLEAR UNIFIED STAGING DEPLOYMENT SCRIPT
# =============================================
# Deploys WebSocket server + Frontend preview with NUCLEAR CACHE BUSTING
# Ensures everything is synchronized and completely cache-busted

set -e

CHANNEL_NAME=${1:-"staging-$(date +%m%d-%H%M)"}

echo "🎯 💥 NUCLEAR UNIFIED STAGING DEPLOYMENT 💥"
echo "============================================"
echo "🏷️  Channel: $CHANNEL_NAME"
echo "📅 Date: $(date)"
echo "💥 Mode: NUCLEAR CACHE BUSTING ENABLED"
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

print_nuclear() {
    echo "💥 $1"
}

# Step 1: Deploy WebSocket Server to Staging
print_status "Step 1: Deploying WebSocket server to staging..."
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
echo "⏱️  Giving server 30 seconds to fully initialize..."
sleep 30

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

# Step 5: Create preview environment with NUCLEAR cache busting
CACHE_BUST_TIME=$(date +%s)
DEPLOY_ID="$CHANNEL_NAME-$CACHE_BUST_TIME"
BUILD_HASH=$(openssl rand -hex 8)

print_nuclear "Creating NUCLEAR cache-busting environment..."

cat > .env.local << EOF
# 💥 NUCLEAR UNIFIED STAGING PREVIEW Environment 💥
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

# 💥 NUCLEAR CACHE BUSTING - Multiple variables to force refresh
NEXT_PUBLIC_BUILD_TIME=$CACHE_BUST_TIME
NEXT_PUBLIC_DEPLOY_ID=$DEPLOY_ID
NEXT_PUBLIC_CACHE_BUSTER=$CACHE_BUST_TIME
NEXT_PUBLIC_BUILD_HASH=$BUILD_HASH
NEXT_PUBLIC_FORCE_RELOAD=$CACHE_BUST_TIME
NEXT_PUBLIC_VERSION=$CACHE_BUST_TIME
NEXT_PUBLIC_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EOF

print_success "Environment configured for NUCLEAR staging deployment"
echo "   📡 WebSocket: $WEBSOCKET_URL"
echo "   🏷️  Channel: $CHANNEL_NAME"
echo "   🕐 Build time: $CACHE_BUST_TIME"
echo "   💥 Cache buster: $DEPLOY_ID"
echo "   🔑 Build hash: $BUILD_HASH"
echo ""

# Step 6: 💥 NUCLEAR CACHE CLEARING
print_nuclear "Step 6: 💥 NUCLEAR CACHE ANNIHILATION 💥"
echo "🗑️  Removing ALL caches for completely fresh deployment..."

# Clear Next.js caches
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# Clear any Vercel caches if present
rm -rf .vercel

# Clear any additional build artifacts
rm -rf dist
rm -rf build

# Clear npm cache (if using npm)
npm cache clean --force 2>/dev/null || true

# Clear any Firebase cache
rm -rf .firebase/cache 2>/dev/null || true

print_nuclear "💥 ALL CACHES ANNIHILATED - GUARANTEED FRESH BUILD 💥"
echo ""

# Step 7: Build with staging environment
print_status "Step 7: Building frontend with NUCLEAR cache busting..."
echo "🔨 Building with multiple cache-busting environment variables..."

npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_success "Frontend build completed with NUCLEAR cache busting"
echo ""

# Step 8: 💥 NUCLEAR FIREBASE DEPLOYMENT with aggressive cache headers
print_nuclear "Step 8: 💥 NUCLEAR Firebase deployment with NO-CACHE headers 💥"
echo "🚀 Deploying with the most aggressive cache-busting possible..."

# Backup original firebase.json
if [ -f "firebase.json" ]; then
    cp firebase.json firebase.json.backup.$(date +%Y%m%d-%H%M%S)
fi

# Create firebase.json with NUCLEAR cache busting
cat > firebase.json << EOF
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|html|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
          },
          {
            "key": "Pragma",
            "value": "no-cache"
          },
          {
            "key": "Expires",
            "value": "0"
          },
          {
            "key": "X-Cache-Buster",
            "value": "$CACHE_BUST_TIME"
          },
          {
            "key": "X-Deploy-ID", 
            "value": "$DEPLOY_ID"
          },
          {
            "key": "X-Build-Hash",
            "value": "$BUILD_HASH"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate, max-age=0"
          },
          {
            "key": "X-Nuclear-Cache-Bust",
            "value": "$CACHE_BUST_TIME"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
EOF

print_nuclear "Firebase config updated with NUCLEAR no-cache headers"

# Deploy with NUCLEAR cache busting
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -ne 0 ]; then
    print_error "Firebase preview deployment failed"
    exit 1
fi

# Restore original firebase.json
if [ -f "firebase.json.backup."* ]; then
    LATEST_FIREBASE_BACKUP=$(ls -t firebase.json.backup.* | head -n1)
    mv "$LATEST_FIREBASE_BACKUP" firebase.json
    print_success "Restored original firebase.json"
fi

print_nuclear "💥 Frontend deployed with NUCLEAR cache busting! 💥"
echo ""

# Step 9: Restore original .env.local
if [ -f ".env.local.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    mv "$LATEST_BACKUP" .env.local
    print_success "Restored original .env.local"
fi

# Step 10: Final verification with extra wait time
print_status "Step 10: Final verification..."
PREVIEW_URL="https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
ADMIN_URL="$PREVIEW_URL/admin-analytics"

echo "🧪 Testing preview deployment..."
echo "⏱️  Waiting 15 seconds for CDN to propagate NUCLEAR cache headers..."
sleep 15

if curl -s --fail "$PREVIEW_URL" > /dev/null; then
    print_success "Preview deployment is accessible"
else
    print_warning "Preview deployment accessibility test failed (might be CDN delay)"
fi

echo ""
print_nuclear "🎉 💥 NUCLEAR UNIFIED STAGING DEPLOYMENT COMPLETE! 💥 🎉"
echo "========================================================"
echo ""
echo "📊 DEPLOYMENT SUMMARY:"
echo "   🎭 Environment: Staging"
echo "   🔌 WebSocket URL: $WEBSOCKET_URL"
echo "   🌐 Preview URL: $PREVIEW_URL"
echo "   🛠️  Admin Dashboard: $ADMIN_URL"
echo "   🏷️  Channel: $CHANNEL_NAME"
echo "   💥 Cache Buster: $CACHE_BUST_TIME"
echo "   🔑 Build Hash: $BUILD_HASH"
echo "   ⏰ Expires: 7 days"
echo ""
echo "🎯 💥 NUCLEAR DEPLOYMENT FEATURES:"
echo "   ✅ WebSocket server deployed FIRST (backend ready)"
echo "   ✅ Frontend uses the JUST-DEPLOYED server (no URL mismatches)"
echo "   💥 NUCLEAR cache annihilation (all local caches cleared)"
echo "   💥 NO-CACHE headers (forces browser reload)"
echo "   💥 Multiple cache-busting variables"
echo "   💥 Timestamp-based cache invalidation"
echo "   ✅ Health checks before frontend deployment"
echo "   ✅ Single command deploys everything in sync"
echo ""
echo "💥 CACHE BUSTING OVERKILL:"
echo "   🗑️  Local: .next, out, node_modules/.cache, .vercel, npm cache"
echo "   🚀 Firebase: no-cache, no-store, must-revalidate headers"
echo "   🔄 Environment: 7 different cache-busting variables"
echo "   ⏰ Headers: X-Cache-Buster, X-Deploy-ID, X-Build-Hash"
echo ""
echo "🧪 WHAT TO TEST (should now work!):"
echo "   1. Chat functionality: $PREVIEW_URL"
echo "   2. Admin dashboard: $ADMIN_URL"
echo "   3. 🔧 Mesh networking: Should use /api/admin/mesh-status!"
echo "   4. 🔍 Browser console: Check for correct environment detection"
echo ""
echo "🔧 MESH NETWORKING FIX VERIFICATION:"
echo "   ❌ OLD: localhost:3001/admin/mesh-status (should be gone!)"
echo "   ✅ NEW: /api/admin/mesh-status (should see this in network tab)"
echo "   🧪 Test: Open DevTools > Network tab and watch the requests"
echo ""
echo "💪 IF YOU STILL SEE OLD CODE:"
echo "   1. Hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)"
echo "   2. Clear browser cache completely"
echo "   3. Open in incognito/private window"
echo "   4. Check DevTools > Application > Storage > Clear site data"
echo ""
echo "⚡ NEXT TIME: Just run this NUCLEAR command:"
echo "   npm run staging:unified [channel-name]"
echo ""
print_nuclear "💥 MESH NETWORKING SHOULD NOW WORK CORRECTLY! 💥"
