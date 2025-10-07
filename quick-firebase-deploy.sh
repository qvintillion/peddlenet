#!/bin/bash
# Quick Firebase Staging Deploy - Fixed for Static Export
# Simplified version that actually builds the app

set -e

CHANNEL_NAME=${1:-"test-$(date +%Y%m%d)"}

echo "🚀 Firebase Staging Deployment"
echo "==============================="
echo "📦 Channel: $CHANNEL_NAME"
echo ""

# Step 1: Set environment for static export
echo "📝 Setting up environment..."
export BUILD_TARGET=staging
export NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app

# Step 2: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Step 3: Build for static export
echo "🔨 Building for Firebase..."
npx next build && npx next export

if [ ! -d "out" ]; then
    echo "❌ Error: Build failed - 'out' directory not created"
    exit 1
fi

echo "✅ Build complete"
echo ""

# Step 4: Deploy to Firebase
echo "🚀 Deploying to Firebase preview channel..."
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Preview URL: https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
    echo "⏰ Expires: 7 days"
else
    echo "❌ Deployment failed"
    exit 1
fi
