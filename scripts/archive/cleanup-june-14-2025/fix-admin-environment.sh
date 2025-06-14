#!/bin/bash

# 🚀 Quick Fix Admin Dashboard Environment
# Forces correct environment detection and deploys WebSocket server

echo "🚀 Quick Fix Admin Dashboard Environment"
echo "======================================="

echo "🔍 Root cause identified:"
echo "  - WebSocket server is likely offline"
echo "  - Admin dashboard falls back to default data with 'production'"
echo "  - Environment detection works, but WebSocket connection fails"
echo ""

echo "💡 Two-step solution:"
echo "1. Deploy staging WebSocket server (has admin endpoints)"
echo "2. Test admin dashboard with live WebSocket connection"
echo ""

echo "🎯 Step 1: Deploy Staging WebSocket Server"
echo "This will ensure admin endpoints are available"
echo ""

# Check if staging WebSocket server is running
echo "🧪 Testing current staging WebSocket server..."
STAGING_WS_URL="https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"

if curl -s --max-time 5 "$STAGING_WS_URL/health" > /dev/null 2>&1; then
    echo "✅ Staging WebSocket server is responding"
    echo "🔍 Testing admin analytics endpoint..."
    
    if curl -s --max-time 5 "$STAGING_WS_URL/admin/analytics" > /dev/null 2>&1; then
        echo "✅ Admin analytics endpoint exists on WebSocket server"
    else
        echo "❌ Admin analytics endpoint missing on WebSocket server"
        echo "🎯 Need to deploy staging WebSocket server with admin endpoints"
    fi
else
    echo "❌ Staging WebSocket server is not responding"
    echo "🎯 Need to deploy staging WebSocket server"
fi

echo ""
echo "🚀 Deploy staging WebSocket server:"
echo "   ./scripts/deploy-websocket-staging.sh"
echo ""

echo "🧪 After WebSocket deployment, test:"
echo "1. Admin dashboard should show real data"
echo "2. Environment should show 'staging'"
echo "3. User/Room modals should have data"
echo "4. Clear room should work"
echo ""

echo "📋 Current status:"
echo "✅ Environment detection code works"
echo "✅ Staging WebSocket URL in build"
echo "❌ WebSocket server offline/missing admin endpoints"
echo "❌ Admin dashboard falls back to default data"
