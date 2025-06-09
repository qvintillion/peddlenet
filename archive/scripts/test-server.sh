#!/bin/bash

echo "🔍 Testing festival-chat server status..."

# Check if required files exist
if [ ! -f "signaling-server-sqlite.js" ]; then
    echo "❌ signaling-server-sqlite.js not found"
    echo "   Current directory: $(pwd)"
    echo "   Files available:"
    ls -la *.js 2>/dev/null || echo "   No .js files found"
    exit 1
fi

echo "✅ Server file found"

# Try to start just the SQLite server to test
echo "🚀 Testing SQLite server startup..."
timeout 10s node signaling-server-sqlite.js &
SERVER_PID=$!

# Wait a moment for startup
sleep 3

# Test if server is responding
echo "🌐 Testing server connection..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server is responding on port 3001"
    curl -s http://localhost:3001/health | head -5
else
    echo "❌ Server is not responding on port 3001"
    echo "   Check if port is already in use:"
    lsof -i :3001 || echo "   Port 3001 appears to be free"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null
echo "🧹 Test cleanup complete"
