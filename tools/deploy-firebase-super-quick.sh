#!/bin/bash

# Super Quick Firebase Deploy - Minimal steps for faster iteration
# Use this for frequent deployments during development

set -e

echo "⚡ SUPER QUICK Firebase Deploy"
echo "============================"

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

echo "🚀 Deploying Functions..."
firebase deploy --only functions

echo ""
echo "✅ Super Quick Deploy Complete!"
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo "⚡ Time saved by skipping health checks and verbosity"
