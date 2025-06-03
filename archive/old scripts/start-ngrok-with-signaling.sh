#!/bin/bash

# Script to start both app and signaling server for ngrok testing
# This creates two separate ngrok tunnels for proper cross-device testing

echo "🚀 Starting Festival Chat with ngrok tunnels..."

# Kill any existing processes
pkill -f "node signaling-server.js"
pkill -f "next dev"
pkill -f "ngrok"

# Start the signaling server in background
echo "📡 Starting signaling server on port 3001..."
node signaling-server.js &
SIGNALING_PID=$!

# Wait for signaling server to start
sleep 3

# Start the Next.js app in background
echo "⚛️  Starting Next.js app on port 3000..."
npm run dev &
APP_PID=$!

# Wait for Next.js to start
sleep 5

# Start ngrok tunnels
echo "🌐 Creating ngrok tunnels..."

# Start ngrok for main app (port 3000)
ngrok http 3000 --log=stdout > /tmp/ngrok-app.log &
NGROK_APP_PID=$!

# Start ngrok for signaling server (port 3001)
ngrok http 3001 --log=stdout > /tmp/ngrok-signaling.log &
NGROK_SIGNALING_PID=$!

# Wait for ngrok to start
sleep 10

# Extract URLs from ngrok logs
APP_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.ngrok-free\.app' /tmp/ngrok-app.log | head -1)
SIGNALING_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.ngrok-free\.app' /tmp/ngrok-signaling.log | head -1)

echo ""
echo "✅ Festival Chat is ready!"
echo "📱 Main App URL: $APP_URL"
echo "📡 Signaling Server URL: $SIGNALING_URL"
echo ""
echo "🔧 Set this environment variable:"
echo "export NEXT_PUBLIC_SIGNALING_SERVER=$SIGNALING_URL"
echo ""
echo "💡 Or add to .env.local:"
echo "NEXT_PUBLIC_SIGNALING_SERVER=$SIGNALING_URL"
echo ""
echo "🛑 To stop all services, run: kill $APP_PID $SIGNALING_PID $NGROK_APP_PID $NGROK_SIGNALING_PID"

# Keep script running
trap "kill $APP_PID $SIGNALING_PID $NGROK_APP_PID $NGROK_SIGNALING_PID" EXIT
wait
