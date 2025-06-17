#!/bin/bash

# 🎭 DEPLOY CLEAN STAGING WITH FIXED ENVIRONMENT DETECTION
# ========================================================

set -e

echo "🎭 DEPLOYING CLEAN STAGING WITH FIXED ENVIRONMENT DETECTION"
echo "==========================================================="
echo ""

# Check if we're ready
echo "🔍 Pre-deployment checks..."
if [ ! -f ".env.staging" ]; then
    echo "❌ .env.staging not found"
    exit 1
fi

if [ ! -f "scripts/deploy-websocket-staging.sh" ]; then
    echo "❌ staging WebSocket deployment script not found"
    exit 1
fi

echo "✅ All files present"
echo ""

# Step 1: Deploy WebSocket server with fixed environment detection
echo "📦 Step 1: Deploy staging WebSocket server with environment fix..."
echo "This will deploy the server with enhanced BUILD_TARGET=staging detection"
echo ""
./scripts/deploy-websocket-staging.sh

if [ $? -ne 0 ]; then
    echo "❌ Staging WebSocket server deployment failed!"
    exit 1
fi

echo ""
echo "⏳ Waiting 15 seconds for WebSocket server to stabilize..."
sleep 15

# Step 2: Deploy frontend to Vercel staging
echo ""
echo "🌐 Step 2: Deploy frontend to Vercel staging (preview)..."
echo "This will use .env.staging and create a Vercel preview URL"
echo ""

# Deploy to Vercel with staging environment
vercel --target preview --env .env.staging

if [ $? -ne 0 ]; then
    echo "❌ Vercel staging deployment failed!"
    exit 1
fi

echo ""
echo "🎉 CLEAN STAGING DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "🧪 NOW TEST THE ENVIRONMENT DETECTION FIX:"
echo ""
echo "1. 🔍 Find your staging URL in the Vercel output above"
echo "2. 🌐 Go to: https://your-staging-url.vercel.app/admin-analytics"
echo "3. 🔐 Login with: th3p3ddl3r / letsmakeatrade"
echo "4. 📊 Check the 'Network Monitoring' section:"
echo ""
echo "   ✅ EXPECTED RESULTS:"
echo "   - Environment: STAGING (yellow text)"
echo "   - Frontend Detected: staging"
echo "   - Server Reports: staging"
echo "   - Platform: vercel-preview"
echo ""
echo "   ❌ IF YOU STILL SEE 'PRODUCTION':"
echo "   - Check the debug info in login form"
echo "   - Look at both 'Frontend Detected' and 'Server Reports'"
echo "   - This will tell us exactly where the mismatch is!"
echo ""
echo "🚀 Next step: If staging shows correctly, deploy to production:"
echo "   npm run deploy:vercel:complete"
echo ""
echo "🎯 The clean environment structure is now implemented!"
echo "   - Staging = Vercel preview (.vercel.app)"
echo "   - Production = Vercel production (peddlenet.app)"
echo "   - No more Firebase confusion!"
