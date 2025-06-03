#!/bin/bash

echo "🔍 Manual Server Check and Startup"
echo "=================================="

# Check current port usage
echo "Current port usage:"
echo "Port 3000 (Next.js):"
lsof -i :3000 || echo "  ❌ Not in use"

echo "Port 3001 (Signaling):"  
lsof -i :3001 || echo "  ❌ Not in use"

echo "Port 9000 (PeerJS):"
lsof -i :9000 || echo "  ❌ Not in use"

echo ""
echo "🚀 Starting servers manually..."

echo "1. Starting PeerJS server on port 9000..."
echo "   Run: node peerjs-server.js"
echo ""

echo "2. Starting Signaling server on port 3001..."  
echo "   Run: node signaling-server.js"
echo ""

echo "3. Next.js seems to be running already on port 3000"
echo "   If not, run: npm run dev"
echo ""

echo "Then test with: npm run test:connection"