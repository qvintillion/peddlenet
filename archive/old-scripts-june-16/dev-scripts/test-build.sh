#!/bin/bash

echo "🧪 Testing Next.js build for static export compatibility..."
echo "=============================================="

# Set environment for Firebase static export
export NODE_ENV=production
export BUILD_TARGET=staging

echo "🔧 Environment variables:"
echo "   NODE_ENV=$NODE_ENV"
echo "   BUILD_TARGET=$BUILD_TARGET"
echo ""

echo "🔨 Running Next.js build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful! Firebase static export should work now."
    echo ""
    echo "📂 Generated files:"
    ls -la out/ | head -10
    echo ""
    echo "🎯 Now you can run your staging deployment:"
    echo "   npm run staging:unified your-channel-name"
else
    echo ""
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
