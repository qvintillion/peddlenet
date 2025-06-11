#!/bin/bash

# Super Quick Firebase Deploy - Minimal steps for faster iteration
# Use for rapid iteration during development
# FIXED: Now deploys hosting + functions with cache-busting

set -e

echo "⚡ SUPER QUICK Firebase Deploy (Fixed + Cache-Bust)"
echo "=================================================="

# Cache bust - clear builds to ensure fresh deployment
echo "🧹 Cache bust: clearing builds..."
rm -rf .next/ > /dev/null 2>&1 || true
rm -rf functions/.next/ > /dev/null 2>&1 || true
rm -rf functions/lib/ > /dev/null 2>&1 || true

# Just copy the existing environment (assuming it's correct)
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "✅ Using existing environment variables"
else
    echo "⚠️ No .env.firebase found, environment might not be set"
fi

# Skip health checks, skip Cloud Run checks - just build and deploy
echo "🏗️ Building Next.js (minimal output)..."
npm run build > /dev/null 2>&1

echo "🔧 Building Functions (minimal output)..."
cd functions
npm run build > /dev/null 2>&1
cd ..

# Deploy BOTH hosting and functions (this was the missing piece!)
echo "🚀 Deploying hosting + functions..."
firebase deploy --only hosting,functions

echo ""
echo "✅ Super Quick Deploy Complete!"
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo "⚡ Time saved by skipping health checks and verbosity"
echo "🧹 Cache-bust applied - fresh deployment guaranteed"
