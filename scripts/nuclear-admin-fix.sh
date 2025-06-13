#!/bin/bash

# NUCLEAR ADMIN DASHBOARD FIX
# Specifically targets the admin dashboard cache/URL issue
# Clears everything and forces fresh build with correct URLs

set -e

echo "💥 NUCLEAR ADMIN DASHBOARD FIX"
echo "=============================="
echo "This will completely reset and redeploy with verified URLs"
echo ""

# Get current WebSocket URL from staging environment
if [ -f ".env.staging" ]; then
    source .env.staging
    echo "🔍 Found WebSocket URL: $NEXT_PUBLIC_SIGNALING_SERVER"
else
    echo "❌ No .env.staging found. Run deploy-complete-enhanced.sh first"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SIGNALING_SERVER" ]; then
    echo "❌ NEXT_PUBLIC_SIGNALING_SERVER not set in .env.staging"
    exit 1
fi

echo "🧹 NUCLEAR CACHE CLEARING"
echo "========================="

# Stop all processes
echo "🛑 Stopping all development processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "signaling-server" 2>/dev/null || true
sleep 2

# Nuclear cache clearing
echo "💥 Nuclear cache clearing..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf out/
rm -rf node_modules/.cache/
rm -rf functions/node_modules/.cache/ 2>/dev/null || true

# Clear npm cache
npm cache clean --force

# Clear Firebase cache
rm -rf .firebase/

# Clear browser caches (instructions)
echo "🌐 CRITICAL: You must also clear browser cache manually:"
echo "  - Chrome/Edge: Ctrl+Shift+Del, select 'All time'"
echo "  - Firefox: Ctrl+Shift+Del, select 'Everything'"
echo "  - Safari: Develop > Empty Caches"
echo "  - Or use Incognito/Private browsing"

echo ""
echo "🔧 FORCING FRESH BUILD WITH CORRECT URLS"
echo "========================================"

# Set environment for build
cp .env.staging .env.local
export NODE_ENV=production  # Use production for staging builds
export BUILD_TARGET=staging  # Our custom variable
export NEXT_PUBLIC_SIGNALING_SERVER="$NEXT_PUBLIC_SIGNALING_SERVER"

echo "✅ Environment set:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - NEXT_PUBLIC_SIGNALING_SERVER: $NEXT_PUBLIC_SIGNALING_SERVER"

# Force fresh install
echo "📦 Fresh dependency install..."
npm ci

# Build with verbose output
echo "🏗️ Building with fresh environment..."
npm run build:firebase

# Verify admin dashboard build
echo "🔍 Verifying admin dashboard in build..."
if [ -f ".next/server/app/admin-analytics/page.js" ]; then
    echo "✅ Admin dashboard page exists in build"
    
    # Check for placeholder URLs
    if grep -q "\[hash\]" ".next/server/app/admin-analytics/page.js" 2>/dev/null; then
        echo "❌ STILL CONTAINS PLACEHOLDER URLs!"
        echo "🔍 Found placeholders:"
        grep -n "\[hash\]" ".next/server/app/admin-analytics/page.js" || true
        exit 1
    else
        echo "✅ No placeholder URLs found in build"
    fi
    
    # Check for correct URL
    if grep -q "$NEXT_PUBLIC_SIGNALING_SERVER" ".next/server/app/admin-analytics/page.js" 2>/dev/null; then
        echo "✅ Correct WebSocket URL found in build"
    else
        echo "⚠️  Correct WebSocket URL not found in build"
        echo "🔍 Searching for any WebSocket URLs..."
        grep -n "wss://" ".next/server/app/admin-analytics/page.js" | head -5 || echo "No WSS URLs found"
    fi
else
    echo "❌ Admin dashboard page not found in build!"
    exit 1
fi

# Build functions
echo "⚡ Building functions..."
cd functions
npm run build
cd ..

# Deploy only hosting (faster)
echo "🚀 Deploying fresh build to Firebase..."
firebase deploy --only hosting

# Test deployment
FIREBASE_URL="https://festival-chat-peddlenet.web.app"
echo ""
echo "🧪 TESTING DEPLOYMENT"
echo "===================="

echo "🌐 Testing main site..."
if curl -s --max-time 10 --fail "$FIREBASE_URL" > /dev/null; then
    echo "✅ Main site accessible"
else
    echo "⚠️  Main site test failed"
fi

echo "🎛️ Testing admin dashboard..."
if curl -s --max-time 10 --fail "$FIREBASE_URL/admin-analytics" > /dev/null; then
    echo "✅ Admin dashboard accessible"
else
    echo "⚠️  Admin dashboard test failed"
fi

# Restore development environment
echo ""
echo "🔄 Restoring development environment..."
if [ -f ".env.local.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    cp "$LATEST_BACKUP" .env.local
    echo "✅ Restored development environment"
else
    rm -f .env.local
    echo "✅ Cleared .env.local for development"
fi

echo ""
echo "💥 NUCLEAR FIX COMPLETE!"
echo "========================"
echo "🎯 Admin Dashboard: $FIREBASE_URL/admin-analytics"
echo "🔌 Should use WebSocket: $NEXT_PUBLIC_SIGNALING_SERVER"
echo ""
echo "🧪 VERIFICATION STEPS:"
echo "1. CLEAR YOUR BROWSER CACHE (critical!)"
echo "2. Visit $FIREBASE_URL/admin-analytics"
echo "3. Open browser developer tools (F12)"
echo "4. Check Console tab for URL being used"
echo "5. Check Network tab for WebSocket connections"
echo ""
echo "✅ If you see 'Connected' status, the fix worked!"
echo "❌ If still shows placeholder URLs, contact support"
echo ""
echo "🔧 To restart development: npm run dev:mobile"
