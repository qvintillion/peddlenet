#!/bin/bash

echo "🧹 QUICK FIX: Manual Static Export for Firebase"
echo "=============================================="

# Set environment for static export
export BUILD_TARGET=staging
export NODE_ENV=production
export FIREBASE_PROJECT_ID=festival-chat-peddlenet

echo "🔧 Environment variables set:"
echo "   BUILD_TARGET=$BUILD_TARGET"
echo "   NODE_ENV=$NODE_ENV"
echo "   FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"

# Build with static export
echo ""
echo "🔨 Building with static export..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "📁 Checking output directory..."
    
    if [ -d "out" ]; then
        echo "✅ 'out' directory exists with $(find out -name "*.html" | wc -l) HTML files"
        echo "📋 Contents:"
        ls -la out/ | head -10
    else
        echo "❌ 'out' directory still missing"
        echo "🔍 Available directories:"
        ls -la | grep "^d"
    fi
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🚀 Now you can deploy to Firebase:"
echo "   npx firebase hosting:channel:deploy mesh-fix6 --expires 7d"
