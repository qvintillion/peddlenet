#!/bin/bash

# FIXED: Super Quick Firebase Deploy with hosting
# Ensures client-side code changes get deployed

set -e

echo "⚡ FIXED Super Quick Firebase Deploy (Hosting + Functions)"
echo "========================================================="

# Just copy the existing environment (assuming it's correct)
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "✅ Using existing environment variables"
else
    echo "⚠️ No .env.firebase found, environment might not be set"
fi

# Clear cached builds to ensure fresh deployment
echo "🧹 Clearing builds for fresh deployment..."
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

# Build Next.js
echo "🏗️ Building Next.js..."
npm run build

# Build Functions
echo "🔧 Building Functions..."
cd functions
npm run build
cd ..

# Deploy BOTH hosting and functions (this is the fix!)
echo "🚀 Deploying hosting + functions..."
firebase deploy --only hosting,functions

echo ""
echo "✅ FIXED Super Quick Deploy Complete!"
echo "===================================="
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo "📱 Client-side fixes: DEPLOYED"
echo "⚡ Time saved but proper deployment achieved"
echo ""
echo "🎯 Your notification debug logs should now appear!"
