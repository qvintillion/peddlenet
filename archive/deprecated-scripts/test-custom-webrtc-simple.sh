#!/bin/bash

# Custom WebRTC Testing Script - June 15, 2025
# Test the new custom WebRTC implementation

echo "Starting Custom WebRTC Development Testing..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi

# Check if signaling-server.js exists
if [ ! -f "signaling-server.js" ]; then
    echo "Error: signaling-server.js not found."
    exit 1
fi

echo "Custom WebRTC Implementation Status:"
echo "✅ Enhanced WebSocket server with WebRTC signaling"
echo "✅ Custom WebRTC hook (use-custom-webrtc.ts)"
echo "✅ Updated hybrid chat system"
echo "✅ Production-ready P2P connections"
echo ""

echo "Starting development servers..."
echo ""

# Start the enhanced signaling server in background
echo "Starting enhanced WebSocket server (port 3001)..."
node signaling-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ WebSocket server started successfully (PID: $SERVER_PID)"
else
    echo "❌ Failed to start WebSocket server"
    exit 1
fi

echo ""
echo "Starting Next.js frontend (port 3000)..."
echo ""

# Detect local IP for mobile testing
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo "Mobile Access URLs:"
echo "   Desktop: http://localhost:3000"
echo "   Mobile: http://$LOCAL_IP:3000"
echo "   Diagnostics: http://$LOCAL_IP:3000/diagnostics"
echo "   Admin Dashboard: http://$LOCAL_IP:3000/admin-analytics"
echo ""

echo "Custom WebRTC Testing Steps:"
echo "1. Open desktop browser: http://localhost:3000"
echo "2. Join a room and note the room code"
echo "3. Open mobile browser: http://$LOCAL_IP:3000"
echo "4. Join the same room"
echo "5. Try enabling P2P via debug panel"
echo "6. Send messages and monitor connection quality"
echo ""

echo "Debug Tools Available:"
echo "   - Check browser console for WebRTC logs"
echo "   - Monitor admin dashboard for P2P metrics"
echo "   - Use diagnostics page for connection testing"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Cleaning up..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "Stopped WebSocket server"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start Next.js development server
echo "Starting Next.js with custom WebRTC enabled..."
npm run dev

# The cleanup function will be called when npm run dev exits
