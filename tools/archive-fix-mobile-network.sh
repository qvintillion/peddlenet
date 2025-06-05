#!/bin/bash

echo "🔧 Fixing Mobile Network Access"
echo "==============================="
echo ""

# Kill existing processes
echo "🛑 Stopping existing servers..."
pkill -f "next-server" 2>/dev/null
pkill -f "signaling-server" 2>/dev/null
sleep 2

# Start WebSocket server (already configured for 0.0.0.0)
echo "📡 Starting WebSocket server on all interfaces..."
node signaling-server.js &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

# Start Next.js with network binding
echo "🌐 Starting Next.js on all interfaces..."
npm run dev &
NEXTJS_PID=$!
echo "   Next.js PID: $NEXTJS_PID"

echo ""
echo "⏳ Waiting for servers to start..."
sleep 10

# Test network accessibility
echo "🧪 Testing network accessibility..."
IP="192.168.0.154"

echo -n "   📱 Next.js app: "
curl -s -I "http://$IP:3000" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Accessible at http://$IP:3000"
else
    echo "❌ Not accessible"
fi

echo -n "   📡 WebSocket server: "
curl -s "http://$IP:3001/health" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Accessible at http://$IP:3001"
else
    echo "❌ Not accessible"
fi

echo ""
echo "🎉 Mobile network setup complete!"
echo ""
echo "📱 Mobile URLs:"
echo "   App: http://$IP:3000"
echo "   Server: http://$IP:3001"
echo ""
echo "🧪 Test from mobile:"
echo "   1. Connect to same WiFi network"
echo "   2. Open mobile browser"
echo "   3. Go to: http://$IP:3000"
echo "   4. Should load the app!"
echo ""
echo "🛑 To stop servers: Ctrl+C or run:"
echo "   kill $SERVER_PID $NEXTJS_PID"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $NEXTJS_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT TERM
echo "✋ Press Ctrl+C to stop servers"
wait
