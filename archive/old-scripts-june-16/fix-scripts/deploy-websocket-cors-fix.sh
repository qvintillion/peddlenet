#!/bin/bash

# 🚨 CRITICAL FIX: Deploy WebSocket server with updated CORS for Vercel domain
# This fixes the CORS error: https://festival-chat-5x4hx04q3-thepeddlers-projects-d74f9d42.vercel.app

echo "🚨 DEPLOYING WEBSOCKET SERVER WITH CORS FIX"
echo "======================================"
echo "📅 Date: $(date)"
echo ""
echo "🔹 Target: festival-chat-5x4hx04q3-thepeddlers-projects-d74f9d42.vercel.app"
echo "🔹 Fix: Updated CORS origins to include current Vercel deployment domain"
echo ""

# Deploy to staging first
echo "🔹 Step 1: Deploying to STAGING..."
./scripts/deploy-websocket-staging.sh

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    echo ""
    echo "🔹 Step 2: Testing staging server CORS..."
    
    # Test the staging server
    STAGING_URL="https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
    echo "🧪 Testing: ${STAGING_URL}/health"
    
    HEALTH_RESPONSE=$(curl -s "${STAGING_URL}/health" || echo "FAILED")
    if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
        echo "✅ Staging server is healthy and ready"
        echo ""
        echo "🎉 CORS FIX DEPLOYED TO STAGING!"
        echo "================================="
        echo ""
        echo "📊 FIXED CORS ORIGINS:"
        echo "   ✅ https://festival-chat-5x4hx04q3-thepeddlers-projects-d74f9d42.vercel.app"
        echo "   ✅ https://festival-chat-d08ae0jyo-thepeddlers-projects-d74f9d42.vercel.app"
        echo "   ✅ More permissive regex for complex Vercel domains"
        echo ""
        echo "⚡ NEXT STEPS:"
        echo "   1. Test the Vercel deployment - WebSocket connections should now work"
        echo "   2. If successful, deploy to production: ./scripts/deploy-websocket-cloudbuild.sh"
        echo ""
        echo "🧪 TEST THE FIX:"
        echo "   Visit: https://festival-chat-5x4hx04q3-thepeddlers-projects-d74f9d42.vercel.app"
        echo "   Check: No more CORS errors in browser console"
        echo "   Verify: WebSocket connection successful"
    else
        echo "❌ Staging server health check failed"
        echo "Response: $HEALTH_RESPONSE"
        exit 1
    fi
else
    echo "❌ Staging deployment failed"
    exit 1
fi
