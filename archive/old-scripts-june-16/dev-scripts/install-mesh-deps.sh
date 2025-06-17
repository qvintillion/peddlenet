#!/bin/bash
# Install mesh networking dependencies for Phase 1

echo "🚀 Installing mesh networking dependencies..."

# Install socket.io-p2p and simple-peer for mesh capabilities
npm install socket.io-p2p socket.io-p2p-server simple-peer

# Install additional mesh networking utilities
npm install @types/simple-peer --save-dev

echo "✅ Mesh networking dependencies installed successfully!"
echo "📦 Added packages:"
echo "  - socket.io-p2p: P2P extension for Socket.IO"
echo "  - socket.io-p2p-server: Server-side P2P coordination"
echo "  - simple-peer: WebRTC wrapper for direct connections"
echo "  - @types/simple-peer: TypeScript definitions"

echo ""
echo "🔄 Next steps:"
echo "  1. Run this script: chmod +x install-mesh-deps.sh && ./install-mesh-deps.sh"
echo "  2. Backup existing files before modifications"
echo "  3. Update signaling server with P2P support"
echo "  4. Create hybrid chat hook"
