#!/bin/bash

# Quick start script that handles common issues
echo "🚀 Quick Start - Enhanced Festival Chat"

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true  
lsof -ti:9000 | xargs kill -9 2>/dev/null || true

sleep 2

# Check if peer package is installed
if ! npm list peer &> /dev/null; then
    echo "📦 Installing peer package..."
    npm install peer
fi

echo "🚀 Starting PeerJS server..."
node peerjs-server.js &
PEERJS_PID=$!

sleep 3

echo "🚀 Starting Signaling server..."
node signaling-server.js &
SIGNALING_PID=$!

sleep 3

echo "🚀 Starting Next.js..."
npm run dev &
NEXTJS_PID=$!

sleep 5

echo ""
echo "✅ All servers should be starting..."
echo "🔍 Running connection test..."
echo ""

# Run the test
node scripts/test-p2p-connection.js

# If we get here, keep servers running
echo ""
echo "🎉 Servers are running! Press Ctrl+C to stop."

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Shutting down..."
    kill $PEERJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true  
    kill $NEXTJS_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep running
while true; do
    sleep 10
done