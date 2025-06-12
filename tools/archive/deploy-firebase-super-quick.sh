#!/bin/bash

# Super Quick Firebase Deploy - Minimal steps for faster iteration
# Use for rapid iteration during development
# ENHANCED: Now includes dev server safety checks and environment protection

set -e

echo "⚡ SUPER QUICK Firebase Deploy (Safe + Cache-Bust)"
echo "=================================================="

# SAFETY: Backup current development environment
echo "💾 Protecting development environment..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up .env.local"
fi

# SAFETY: Check if dev server is running and warn user
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ WARNING: Development server running on port 3000"
    echo "This may cause deployment conflicts."
    read -p "Stop dev server and continue? (y/N): " stop_dev
    
    if [[ $stop_dev =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping development servers..."
        pkill -f "next dev" 2>/dev/null || true
        pkill -f "signaling-server" 2>/dev/null || true
        sleep 2
        echo "✅ Development servers stopped"
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# SAFETY: Stop WebSocket server if running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🛑 Stopping WebSocket server..."
    pkill -f "signaling-server" 2>/dev/null || true
    sleep 1
fi

# Cache bust - clear builds to ensure fresh deployment
echo "🧹 Cache bust: clearing builds..."
rm -rf .next/ > /dev/null 2>&1 || true
rm -rf functions/.next/ > /dev/null 2>&1 || true
rm -rf functions/lib/ > /dev/null 2>&1 || true

# Set up staging environment (temporarily)
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "✅ Using staging environment variables"
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

# SAFETY: Restore development environment
echo "🔄 Restoring development environment..."
if [ -f .env.local.backup ]; then
    mv .env.local.backup .env.local
    echo "✅ Restored original .env.local"
fi

echo ""
echo "✅ Super Quick Deploy Complete!"
echo "🔥 URL: https://festival-chat-peddlenet.web.app"
echo "⚡ Time saved by skipping health checks and verbosity"
echo "🧹 Cache-bust applied - fresh deployment guaranteed"
echo "🛡️ Development environment protected"
echo ""
echo "📱 To restart development: npm run dev:mobile"
