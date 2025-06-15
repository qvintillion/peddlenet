#!/bin/bash

echo "🚀 Phase 1: Installing mesh networking dependencies..."

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install the mesh networking dependencies
npm install socket.io-p2p socket.io-p2p-server simple-peer
npm install @types/simple-peer --save-dev

echo "✅ Dependencies installed successfully!"
echo ""
echo "📦 Installed packages:"
echo "  - socket.io-p2p: P2P extension for Socket.IO"  
echo "  - socket.io-p2p-server: Server-side P2P coordination"
echo "  - simple-peer: WebRTC wrapper for direct connections"
echo "  - @types/simple-peer: TypeScript definitions"
echo ""
echo "🎯 Phase 1 ready to proceed with server and client modifications!"
