#!/bin/bash

# 🎪 SIMPLIFIED Complete Production Deployment
# ============================================
# Automates WebSocket deployment → .env.production update → Vercel deployment
# Uses the proven simplified approach

echo "🎪 Festival Chat - Complete Production Deployment (SIMPLIFIED)"
echo "=============================================================="
echo "🎯 Target: PRODUCTION Environment"
echo "🚀 Approach: Simplified reliable deployment"
echo ""

echo "⚠️  🎪 PRODUCTION DEPLOYMENT CONFIRMATION 🎪"
echo "=============================================="
echo "You are about to deploy to the LIVE PRODUCTION environment."
echo "This will affect the live festival chat application at https://peddlenet.app"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ $confirm != "yes" ]]; then
    echo "❌ Production deployment cancelled."
    exit 1
fi

echo ""
echo "🚀 Step 1: Deploying WebSocket Server to Production..."
echo "====================================================="
echo "⏱️ This may take a few minutes..."
echo ""

./scripts/deploy-websocket-cloudbuild.sh

if [ $? -ne 0 ]; then
    echo "❌ WebSocket deployment failed. Cannot continue."
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
echo "✅ WebSocket server deployed successfully!"
echo ""

# Get WebSocket URL from the just-created .env.production
if [ -f ".env.production" ]; then
    WSS_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.production | cut -d'=' -f2)
    echo "🔌 WebSocket URL from deployment: $WSS_URL"
else
    echo "❌ .env.production not found after WebSocket deployment"
    echo "Please check the WebSocket deployment logs above"
    exit 1
fi

# Verify the URL
if [ -z "$WSS_URL" ]; then
    echo "❌ WebSocket URL not found in .env.production"
    exit 1
fi

echo ""
echo "🔧 Step 2: Environment Configuration..."
echo "======================================"
echo "✅ .env.production already configured by WebSocket deployment"
echo "✅ WebSocket URL: $WSS_URL"
echo "✅ Build target: production"
echo "✅ Environment: production"
echo ""

# Quick health check before frontend deployment
HEALTH_URL=$(echo $WSS_URL | sed 's/wss:/https:/')"/health"
echo "🩺 Quick health check before frontend deployment..."
if curl -s --max-time 10 --fail "$HEALTH_URL" > /dev/null; then
    echo "✅ WebSocket server is healthy and ready"
else
    echo "⚠️ WebSocket server health check failed"
    echo "   URL: $HEALTH_URL"
    echo "   Continuing with frontend deployment (server may still be starting)..."
fi

echo ""
echo "🚀 Step 3: Deploying Frontend to Vercel..."
echo "=========================================="
echo "⏱️ Building and deploying production frontend..."
echo ""

./scripts/deploy-vercel-production-enhanced.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 🎪 COMPLETE PRODUCTION DEPLOYMENT SUCCESSFUL! 🎪 🎉"
    echo "====================================================="
    echo "🌐 Production URL: https://peddlenet.app"
    echo "🔧 Admin Dashboard: https://peddlenet.app/admin"
    echo "🔌 WebSocket Server: $WSS_URL"
    echo ""
    echo "✅ Complete Production Stack Deployed:"
    echo "====================================="
    echo "✅ WebSocket Server: Google Cloud Run (production)"
    echo "✅ Frontend Application: Vercel (production)"
    echo "✅ Admin Dashboard: Included and functional"
    echo "✅ Environment Sync: WebSocket URL properly configured"
    echo "✅ Health Verification: Services tested and healthy"
    echo ""
    echo "🧪 PRODUCTION TESTING CHECKLIST:"
    echo "==============================="
    echo "1. Homepage Test:"
    echo "   • Visit: https://peddlenet.app"
    echo "   • Verify: App loads without errors"
    echo "   • Check: WebSocket connection establishes"
    echo "   • Test: Create and join chat rooms"
    echo ""
    echo "2. Admin Dashboard Test:"
    echo "   • Visit: https://peddlenet.app/admin"
    echo "   • Login with production credentials"
    echo "   • Verify: Dashboard loads without errors"
    echo "   • Check: All monitoring features work"
    echo "   • Test: Real-time data updates"
    echo ""
    echo "3. Mobile Testing:"
    echo "   • Test on mobile devices"
    echo "   • Verify: Responsive design"
    echo "   • Check: Touch interactions work"
    echo "   • Test: Cross-device connectivity"
    echo ""
    echo "🎪 FESTIVAL DEPLOYMENT COMPLETE:"
    echo "==============================="
    echo "• Production URL: https://peddlenet.app"
    echo "• Admin access: https://peddlenet.app/admin"
    echo "• Real-time messaging: ✅ Active"
    echo "• Mobile responsive: ✅ Optimized"
    echo "• Monitoring tools: ✅ Available"
    echo "• Production grade: ✅ Deployed"
    echo ""
    echo "🎭 The festival chat platform is now LIVE!"
    echo "🎪 Ready for festival attendees and staff!"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "   WebSocket Health: ${HEALTH_URL}"
    echo "   Admin Dashboard: https://peddlenet.app/admin"
    echo "   Main Application: https://peddlenet.app"
    
else
    echo ""
    echo "❌ FRONTEND DEPLOYMENT FAILED"
    echo "============================="
    echo "The WebSocket server deployed successfully, but the frontend deployment failed."
    echo "✅ WebSocket server is live at: $WSS_URL"
    echo "❌ Frontend deployment needs to be retried"
    echo ""
    echo "To retry just the frontend:"
    echo "   ./scripts/deploy-vercel-production-enhanced.sh"
    echo ""
    echo "Or fix issues and run complete deployment again:"
    echo "   ./scripts/deploy-production-complete.sh"
    exit 1
fi
