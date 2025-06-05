#!/bin/bash

# Start the signaling server with automatic port detection
echo "🚀 Starting Festival Chat Server..."

# First, check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ signaling-server.js not found. Please run this from the project root."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎵 Starting server (will try ports 3001-3005)..."
node signaling-server.js
