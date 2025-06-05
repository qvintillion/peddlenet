#!/bin/bash

echo "🚀 Quick Mobile Fix - Festival Chat"
echo "=================================="
echo ""

# Quick IP detection and server setup
IP=$(node tools/find-ip.js 2>/dev/null | grep "Recommended IP:" | awk '{print $3}' || echo "")

if [ -z "$IP" ]; then
    echo "🔍 Auto-detecting IP address..."
    # Try different methods to get IP
    if command -v ifconfig >/dev/null 2>&1; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    elif command -v ip >/dev/null 2>&1; then
        IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+')
    fi
fi

if [ -z "$IP" ] || [ "$IP" = "localhost" ]; then
    echo "❌ Could not detect IP. Please run tools/find-ip.js manually"
    exit 1
fi

echo "✅ Detected IP: $IP"

# Kill existing processes
echo "🛑 Cleaning up existing processes..."
pkill -f "signaling-server.js" 2>/dev/null
pkill -f "next-server" 2>/dev/null

# Setup environment
echo "⚙️  Configuring environment..."
node tools/setup-mobile-env.js

# Start servers
echo "🚀 Starting servers..."

# Start signaling server in background
node signaling-server.js &
SERVER_PID=$!
echo "📡 Signaling server started (PID: $SERVER_PID)"

# Wait for server
sleep 2

# Start Next.js
echo "🌐 Starting Next.js..."
npm run dev &
DEV_PID=$!

echo ""
echo "🎉 Quick setup complete!"
echo ""
echo "📱 URLs for mobile testing:"
echo "   App: http://$IP:3000"
echo "   Server Health: http://$IP:3001/health (or 3002, 3003...)"
echo ""
echo "🧪 Test steps:"
echo "   1. Wait for 'ready' message from Next.js"
echo "   2. Open app on computer: http://localhost:3000"
echo "   3. Create a room and click '📱 Invite'"
echo "   4. QR code should now work on mobile!"
echo ""
echo "💡 If still not working:"
echo "   • Both devices on same WiFi?"
echo "   • Try: chmod +x tools/mobile-troubleshoot.sh && ./tools/mobile-troubleshoot.sh"
echo ""
echo "🛑 Stop with: Ctrl+C"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $DEV_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM
wait
