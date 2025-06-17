#!/bin/bash

echo "🚨 CRITICAL FIX: Deploying null safety fixes for Array.from operations"
echo "📝 This fixes the TypeError: Cannot read properties of undefined (reading 'length')"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Cannot deploy."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel (staging first)
echo "🚀 Deploying to staging..."
npm run staging:vercel:complete

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    echo "🔍 Test the staging environment to verify the fix works."
    echo ""
    echo "If staging works correctly, run:"
    echo "  npm run deploy:vercel:complete"
    echo ""
    echo "🩹 FIXES APPLIED:"
    echo "  - Added null safety for connectionsRef.current.entries()"
    echo "  - Added null safety for connectionsRef.current.values()"
    echo "  - Added null safety for connections.keys()"
    echo "  - Added iterator validation before Array.from calls"
    echo "  - Added try-catch blocks around Map operations"
    echo ""
    echo "🎯 This should resolve the line 631 error in production!"
else
    echo "❌ Staging deployment failed!"
    exit 1
fi
