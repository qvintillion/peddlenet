#!/bin/bash
# Make executable with: chmod +x dev-with-signaling.sh

# Festival Chat - Development with Room Discovery
# This script starts both the Next.js app and signaling server for testing

echo "🎵 Starting Festival Chat with Room Discovery..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the festival-chat directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to cleanup processes on exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    kill $SIGNALING_PID $NEXTJS_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start signaling server in background
echo "🔌 Starting signaling server on port 3001..."
node signaling-server.js &
SIGNALING_PID=$!

# Wait a moment for signaling server to start
sleep 2

# Check if signaling server started successfully
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Signaling server running on http://localhost:3001"
else
    echo "⚠️  Signaling server may not be running (this is okay - app will work in direct P2P mode)"
fi

# Start Next.js development server
echo "🚀 Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "🎉 Festival Chat is starting up!"
echo ""
echo "📱 Main app: http://localhost:3000"
echo "🔌 Signaling: http://localhost:3001/health"
echo ""
echo "💡 To test room discovery:"
echo "   1. Open two browser windows/tabs"
echo "   2. Create room in first window"  
echo "   3. Join via QR code in second window"
echo "   4. Refresh first window (host refresh test)"
echo "   5. Both should reconnect automatically!"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Wait for processes to finish
wait