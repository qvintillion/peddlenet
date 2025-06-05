#!/bin/bash

echo "🧹 Clearing Stuck Connections"
echo "============================="
echo ""

# Kill all Node.js processes related to the festival chat
echo "🛑 Killing all festival chat processes..."
pkill -f "signaling-server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Wait for processes to die
sleep 3

# Clear any stuck connections from memory
echo "🧹 Clearing browser caches..."
echo "   • Clear browser cache if possible"
echo "   • Or use Ctrl+Shift+R to hard refresh"

echo ""
echo "🚀 Starting fresh servers..."

# Start signaling server
echo "📡 Starting WebSocket server..."
node signaling-server.js &
SERVER_PID=$!
sleep 3

# Start Next.js
echo "🌐 Starting Next.js..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Fresh start complete!"
echo ""
echo "🎯 Now test with clean connections:"
echo "   1. Desktop: http://192.168.0.154:3000"
echo "   2. Mobile: http://192.168.0.154:3000"
echo "   3. Both should show correct user count"
echo ""
echo "💡 If count is still wrong:"
echo "   • Hard refresh both browsers (Ctrl+Shift+R)"
echo "   • Check console for duplicate connections"
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
