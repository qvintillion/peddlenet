#!/bin/bash

echo "🎯 Festival Chat - Mobile Development Setup"
echo "========================================="
echo ""

# Kill existing processes first
echo "🛑 Stopping any existing servers..."
pkill -f "signaling-server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Auto-detect IP
echo "🌐 Detecting network configuration..."
IP=$(node tools/find-ip.js 2>/dev/null | grep "Recommended IP:" | awk '{print $3}' || echo "192.168.0.154")

if [ -z "$IP" ] || [ "$IP" = "localhost" ]; then
    echo "⚠️  Could not auto-detect IP, using fallback..."
    IP="192.168.0.154"  # Use the IP we know works
fi

echo "✅ Using IP: $IP"

# Start WebSocket server (configured for all interfaces)
echo "📡 Starting WebSocket server on all interfaces..."
node signaling-server.js &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

# Start Next.js with network binding (configured for all interfaces)
echo "🌐 Starting Next.js on all interfaces..."
npm run dev &
NEXTJS_PID=$!
echo "   Next.js PID: $NEXTJS_PID"

echo ""
echo "⏳ Waiting for servers to start..."
sleep 10

# Test network accessibility
echo "🧪 Testing network accessibility..."

echo -n "   📱 Next.js app: "
curl -s -I "http://$IP:3000" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Accessible at http://$IP:3000"
    NEXTJS_OK=true
else
    echo "❌ Not accessible"
    NEXTJS_OK=false
fi

echo -n "   📡 WebSocket server: "
curl -s "http://$IP:3001/health" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Accessible at http://$IP:3001"
    SERVER_OK=true
else
    echo "❌ Not accessible"
    SERVER_OK=false
fi

echo ""
echo "🎉 Mobile development setup complete!"
echo ""

if [ "$NEXTJS_OK" = true ] && [ "$SERVER_OK" = true ]; then
    echo "✅ Both servers are accessible from mobile devices!"
    echo ""
    echo "📱 Mobile Testing URLs:"
    echo "   App: http://$IP:3000"
    echo "   Server: http://$IP:3001/health"
    echo ""
    echo "🧪 Test Steps:"
    echo "   1. Desktop: Open http://localhost:3000 or http://$IP:3000"
    echo "   2. Mobile: Connect to same WiFi network"
    echo "   3. Mobile: Open http://$IP:3000 in browser"
    echo "   4. Create/join a room and test QR codes"
    echo "   5. Messages should sync between devices!"
else
    echo "⚠️  Some servers may not be accessible from mobile"
    echo "   Desktop access: http://localhost:3000"
    echo "   Check firewall settings if mobile can't connect"
fi

echo ""
echo "💡 Features enabled:"
echo "   ✅ Cross-device chat (mobile ↔ desktop)"
echo "   ✅ QR code room sharing"
echo "   ✅ Real-time message sync"
echo "   ✅ Persistent chat rooms"
echo "   ✅ Auto IP detection for mobile"
echo ""
echo "🛑 Stop servers: Ctrl+C"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $NEXTJS_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT TERM
echo "✋ Press Ctrl+C to stop both servers"
wait
