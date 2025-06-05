#!/bin/bash

echo "🚨 Fixing Infinite Loop Issue"
echo "============================="
echo ""

# Kill all processes to stop the infinite loop
echo "🛑 Stopping all festival chat processes..."
pkill -f "signaling-server" 2>/dev/null
pkill -f "next" 2>/dev/null
pkill -f "node" 2>/dev/null

# Wait for processes to fully stop
sleep 5

# Clear any cached states
echo "🧹 Clearing browser caches and states..."
echo "   Please also clear your browser cache or use incognito mode"

echo ""
echo "🚀 Starting fresh servers (fixed infinite loop)..."

# Start signaling server
echo "📡 Starting WebSocket server..."
node signaling-server.js &
SERVER_PID=$!
sleep 3

# Start Next.js with clean state
echo "🌐 Starting Next.js (fixed hook dependencies)..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Servers restarted with infinite loop fix!"
echo ""
echo "🎯 Changes made to prevent infinite loop:"
echo "   • Fixed useEffect dependencies in WebSocket hook"
echo "   • Prevented multiple simultaneous connections"
echo "   • Simplified forceReconnect to avoid dependency cycles"
echo ""
echo "📱 Test URLs:"
echo "   Desktop: http://192.168.0.154:3000"
echo "   Mobile: http://192.168.0.154:3000"
echo ""
echo "💡 If infinite loop persists:"
echo "   • Hard refresh browsers (Ctrl+Shift+R)"
echo "   • Use incognito/private mode"
echo "   • Clear browser cache completely"
echo ""
echo "🛑 Stop servers: Ctrl+C"

cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $NEXTJS_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM
wait
