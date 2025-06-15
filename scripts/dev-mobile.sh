#!/bin/bash

# dev-mobile.sh - Start development with IP detection and universal server for mobile access

echo "🌐 Detecting network IP for mobile development..."

# Detect the local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - try multiple methods
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(route get default | grep interface | awk '{print $2}' | xargs ifconfig | grep -Eo 'inet ([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | head -1)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    # Windows/Other
    LOCAL_IP=$(ipconfig | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' | grep -v '127.0.0.1' | head -1)
fi

# Fallback to localhost if no IP detected
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
    echo "⚠️  Could not detect local IP, using localhost"
    echo "   This means mobile devices won't be able to connect."
    echo "   Make sure you're connected to WiFi and try running again."
else
    echo "✅ Detected local IP: $LOCAL_IP"
fi

# Export environment variable for Next.js
export NEXT_PUBLIC_DETECTED_IP="$LOCAL_IP"

echo ""
echo "🚀 Starting development servers with in-memory persistence..."
echo "📱 Mobile URLs:"
echo "   App: http://$LOCAL_IP:3000"
echo "   Diagnostics: http://$LOCAL_IP:3000/diagnostics"
echo "🔌 Server URLs:"
echo "   WebSocket: http://$LOCAL_IP:3001"
echo "   PeerJS: Cloud Service (peerjs.com)"
echo "   Health check: http://$LOCAL_IP:3001/health"
echo "   Debug rooms: http://$LOCAL_IP:3001/debug/rooms"
echo "💾 Database: In-memory (no persistence)"
echo "🌐 Mesh Network: Cloud P2P + WebSocket fallback"
echo ""
echo "📝 Instructions:"
echo "   1. Connect your mobile device to the same WiFi network"
echo "   2. Open http://$LOCAL_IP:3000/diagnostics on mobile to test"
echo "   3. If diagnostics pass, QR codes should work for chat rooms"
echo "   4. Messages stored in memory (reset on server restart)"
echo ""

# Check if required packages are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Dependencies check
echo "🔍 Checking dependencies..."

# Use the universal server (skip local PeerJS for now)
SERVER_FILE="signaling-server.js"
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Universal server file not found. Make sure you're in the project root directory."
    exit 1
fi

echo "🔧 Using WebSocket server: $SERVER_FILE"
echo "🔧 Using PeerJS: Cloud service (automatic fallback)"

# Create data directory if it doesn't exist
mkdir -p data

# Start both servers concurrently
if command -v concurrently &> /dev/null; then
# Use concurrently - restart disabled for better development control
concurrently \
--names "Next,WebSocket" \
--prefix-colors "blue,green" \
--kill-others-on-fail \
            "NEXT_PUBLIC_DETECTED_IP=$LOCAL_IP npm run dev" \
            "node $SERVER_FILE"
else
    echo "💡 Installing concurrently for better development experience..."
    npm install --save-dev concurrently
    
    # Try again with concurrently
    if command -v npx concurrently &> /dev/null; then
        npx concurrently \
            --names "Next,WebSocket" \
            --prefix-colors "blue,green" \
            "NEXT_PUBLIC_DETECTED_IP=$LOCAL_IP npm run dev" \
            "node $SERVER_FILE"
    else
        # Fallback: start server in background, then Next.js
        echo "Starting WebSocket server in background..."
        node "$SERVER_FILE" &
        WS_PID=$!
        
        echo "Starting Next.js development server..."
        NEXT_PUBLIC_DETECTED_IP="$LOCAL_IP" npm run dev
        
        # Clean up on exit
        trap "kill $WS_PID 2>/dev/null" EXIT
    fi
fi