#!/bin/bash
# Make executable with: chmod +x mobile-dev-with-signaling.sh

# Festival Chat - Mobile Development with Room Discovery
# This script starts both servers AND creates ngrok tunnels for HTTPS mobile testing

echo "🎵 Starting Festival Chat with Room Discovery + Mobile Support..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install ngrok first:"
    echo "   1. Sign up at https://ngrok.com"
    echo "   2. Download and install ngrok"
    echo "   3. Run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

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
    echo "🧹 Cleaning up all processes..."
    kill $SIGNALING_PID $NEXTJS_PID $NGROK_APP_PID $NGROK_SIGNALING_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "🔌 Starting signaling server on port 3001..."
node signaling-server.js &
SIGNALING_PID=$!

echo "🚀 Starting Next.js development server on port 3000..."
npm run dev &
NEXTJS_PID=$!

# Wait for servers to start
echo "⏳ Waiting for servers to start..."
sleep 5

# Check if servers are running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Signaling server failed to start on port 3001"
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Next.js server failed to start on port 3000"
    exit 1
fi

echo "✅ Both servers are running"

# Start ngrok tunnels
echo "🌐 Creating ngrok tunnels for HTTPS mobile access..."

# Create ngrok tunnel for main app (port 3000)
ngrok http 3000 --log=stdout > /tmp/ngrok-app.log &
NGROK_APP_PID=$!

# Create ngrok tunnel for signaling server (port 3001) 
ngrok http 3001 --log=stdout > /tmp/ngrok-signaling.log &
NGROK_SIGNALING_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok tunnels to initialize..."
sleep 8

# Extract ngrok URLs
APP_URL=""
SIGNALING_URL=""

# Try to get URLs from ngrok API
for i in {1..10}; do
    if command -v jq &> /dev/null; then
        # If jq is available, use the API
        APP_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.config.addr=="http://localhost:3000") | .public_url' | grep https)
        SIGNALING_URL=$(curl -s http://localhost:4041/api/tunnels | jq -r '.tunnels[] | select(.config.addr=="http://localhost:3001") | .public_url' | grep https)
    else
        # Fallback: parse from log files
        if [ -f /tmp/ngrok-app.log ]; then
            APP_URL=$(grep -o 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-app.log | head -1)
        fi
        if [ -f /tmp/ngrok-signaling.log ]; then
            SIGNALING_URL=$(grep -o 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-signaling.log | head -1)
        fi
    fi
    
    if [ -n "$APP_URL" ] && [ -n "$SIGNALING_URL" ]; then
        break
    fi
    
    echo "⏳ Still waiting for ngrok URLs... (attempt $i/10)"
    sleep 2
done

if [ -z "$APP_URL" ] || [ -z "$SIGNALING_URL" ]; then
    echo "❌ Failed to get ngrok URLs. Please check:"
    echo "   1. ngrok is properly authenticated"
    echo "   2. No other ngrok processes are running"
    echo "   3. Ports 3000 and 3001 are available"
    echo ""
    echo "🔧 Manual setup:"
    echo "   1. Open new terminal: ngrok http 3000"
    echo "   2. Open another terminal: ngrok http 3001" 
    echo "   3. Use the HTTPS URLs for mobile testing"
    exit 1
fi

# Update environment variable for signaling server
echo "NEXT_PUBLIC_SIGNALING_SERVER=$SIGNALING_URL" > .env.local.ngrok
echo "📝 Created .env.local.ngrok with signaling URL"

echo ""
echo "🎉 Festival Chat is ready for mobile testing!"
echo ""
echo "📱 Main app (mobile): $APP_URL"
echo "🔌 Signaling server: $SIGNALING_URL"
echo "🖥️  Local (desktop): http://localhost:3000"
echo ""
echo "📋 To update signaling URL in your app:"
echo "   cp .env.local.ngrok .env.local"
echo "   # Then restart this script"
echo ""
echo "💡 Mobile testing steps:"
echo "   1. Copy .env.local.ngrok to .env.local" 
echo "   2. Restart this script"
echo "   3. Open $APP_URL on mobile"
echo "   4. Create room on desktop: http://localhost:3000"
echo "   5. Scan QR code with mobile"
echo "   6. Test host refresh - mobile should auto-reconnect!"
echo ""
echo "🛑 Press Ctrl+C to stop all servers and tunnels"
echo ""

# Wait for processes to finish
wait