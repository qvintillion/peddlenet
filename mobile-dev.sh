#!/bin/bash

# Super simple ngrok mobile access
echo "📱 Simple Mobile Access with ngrok"
echo "================================="

# Kill any existing processes
pkill -f "ngrok"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "🚀 Starting Next.js..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 10

# Start ngrok
echo "🌐 Starting ngrok tunnel..."
ngrok http 3000 &
NGROK_PID=$!

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 To get your mobile URL:"
echo "   1. Open: http://localhost:4040"
echo "   2. Copy the https:// URL (something like https://abc123.ngrok.io)"
echo "   3. Open that URL on your phone"
echo "   4. Create room, generate QR, test connections"
echo ""
echo "🎪 The enhanced P2P will work much better now with:"
echo "   • Multiple server fallbacks"
echo "   • Better STUN/TURN configuration"  
echo "   • Stable connections (no more cycling)"
echo ""
echo "Press Ctrl+C to stop everything"

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Shutting down..."
    kill $NEXTJS_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    pkill -f "ngrok"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep running
while true; do
    sleep 10
done