#!/bin/bash

# NUCLEAR Option - Clean Everything and Deploy
# Use when builds are cached or deployments aren't working

set -e

echo "🧨 NUCLEAR Firebase Deploy - Clean Everything"
echo "============================================="

# Kill all caches
echo "🧹 Cleaning all caches..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf functions/node_modules/.cache/
rm -rf node_modules/.next/
rm -rf node_modules/.cache/

# Update environment
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "✅ Environment copied"
fi

# Force rebuild node_modules in functions (nuclear option)
echo "💥 Rebuilding functions dependencies..."
cd functions
rm -rf node_modules/
npm install
cd ..

# Build with clean slate
echo "🏗️ Clean build..."
npm run build

# Build functions with clean slate
echo "🔧 Clean functions build..."
cd functions
npm run build
cd ..

# Deploy with force flag
echo "🚀 Force deploying hosting + functions..."
firebase deploy --only hosting,functions --force

echo ""
echo "🎯 NUCLEAR Deploy Complete!"
echo "==========================="
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo "💥 All caches cleared, everything rebuilt"
echo "🧪 Check for debug logs now!"
