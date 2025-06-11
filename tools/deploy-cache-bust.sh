#!/bin/bash

# FORCE CACHE BUST - Deploy with version bump
# This will force browsers to download new JavaScript

set -e

echo "🧨 FORCE CACHE BUST Deploy"
echo "=========================="

# Add timestamp to force cache invalidation
TIMESTAMP=$(date +%s)
echo "📅 Deploy timestamp: $TIMESTAMP"

# Update environment to force rebuild
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "# Cache bust: $TIMESTAMP" >> .env.local
    echo "✅ Environment updated with cache bust"
fi

# Nuclear cache clear
echo "🧹 Nuclear cache clear..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/
rm -rf public/_next/

# Force fresh build
echo "🏗️ Force fresh build..."
npm run build

# Force fresh functions build
echo "🔧 Force fresh functions build..."
cd functions
npm run build
cd ..

# Deploy with cache invalidation headers
echo "🚀 Deploying with cache bust..."
firebase deploy --only hosting,functions --force

# Clear browser guidance
echo ""
echo "✅ CACHE BUST Deploy Complete!"
echo "=============================="
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo ""
echo "🧹 IMPORTANT: Clear browser cache!"
echo "   Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)"
echo "   Firefox: Ctrl+F5"
echo "   Safari: Cmd+Option+R"
echo ""
echo "💡 Or open in incognito/private mode"
echo "🎯 Look for the triple rocket: 🚀🚀🚀 SHOULDNOTIFY ENTRY"
