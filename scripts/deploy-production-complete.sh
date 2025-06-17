#!/bin/bash

# 🚀 Complete Production Deployment Helper
# Automates WebSocket deployment → .env.production update → Vercel deployment

echo "🎪 Festival Chat - Complete Production Deployment"
echo "================================================"
echo ""

# Step 1: Deploy WebSocket Server
echo "🚀 Step 1: Deploying WebSocket Server to Production..."
echo "====================================================="
npm run deploy:websocket:production

if [ $? -ne 0 ]; then
    echo "❌ WebSocket deployment failed. Cannot continue."
    exit 1
fi

echo ""
echo "🔍 Please copy the WebSocket Server URL from the output above."
echo ""

# Step 2: Prompt for WebSocket URL
read -p "📝 Enter the WebSocket Server URL (e.g., https://peddlenet-websocket-server-...): " WS_URL

if [ -z "$WS_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

# Convert https to wss
WSS_URL=$(echo $WS_URL | sed 's/https:/wss:/')

echo ""
echo "🔧 Step 2: Creating .env.production..."
echo "====================================="

# Create .env.production
cat > .env.production << EOF
# Production environment for Vercel deployment
NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL
BUILD_TARGET=production
NODE_ENV=production
PLATFORM=vercel
EOF

echo "✅ Created .env.production with:"
echo "   NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL"
echo "   BUILD_TARGET=production"
echo "   NODE_ENV=production"
echo ""

# Step 3: Deploy to Vercel
echo "🚀 Step 3: Deploying Frontend to Vercel..."
echo "=========================================="
npm run deploy:vercel:complete

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 COMPLETE PRODUCTION DEPLOYMENT SUCCESSFUL!"
    echo "============================================"
    echo "🌐 Production URL: https://peddlenet.app"
    echo "🔧 Admin Dashboard: https://peddlenet.app/admin"
    echo "🔌 WebSocket Server: $WSS_URL"
    echo ""
    echo "✅ Production Testing URLs:"
    echo "   Homepage: https://peddlenet.app (should have clean console)"
    echo "   Admin: https://peddlenet.app/admin (login: th3p3ddl3r / letsmakeatrade)"
    echo ""
    echo "🎪 Festival Chat is now LIVE in production! 🎪"
else
    echo "❌ Frontend deployment failed. Check the error messages above."
    exit 1
fi
