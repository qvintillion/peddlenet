#!/bin/bash

# dev-mobile.sh - Start development with IP detection and SQLite persistence for mobile access

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
echo "🚀 Starting development servers with SQLite persistence..."
echo "📱 Mobile URLs:"
echo "   App: http://$LOCAL_IP:3000"
echo "   Diagnostics: http://$LOCAL_IP:3000/diagnostics"
echo "🔌 Server URL: http://$LOCAL_IP:3001"
echo "   Health check: http://$LOCAL_IP:3001/health"
echo "   Debug rooms: http://$LOCAL_IP:3001/debug/rooms"
echo "💾 Database: ./data/festival-chat.db"
echo ""
echo "📝 Instructions:"
echo "   1. Connect your mobile device to the same WiFi network"
echo "   2. Open http://$LOCAL_IP:3000/diagnostics on mobile to test"
echo "   3. If diagnostics pass, QR codes should work for chat rooms"
echo "   4. Messages will persist across server restarts!"
echo ""

# Check if required packages are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if sqlite3 is installed
echo "🔍 Checking dependencies..."
if ! node -e "require('sqlite3')" 2>/dev/null; then
    echo "📦 Installing SQLite3 dependency..."
    npm install sqlite3
fi

# Determine which server file to use
SERVER_FILE="signaling-server-sqlite.js"
if [ ! -f "$SERVER_FILE" ]; then
    echo "⚠️  SQLite server not found, falling back to memory-only server"
    SERVER_FILE="signaling-server.js"
    if [ ! -f "$SERVER_FILE" ]; then
        echo "❌ No server file found. Make sure you're in the project root directory."
        exit 1
    fi
fi

echo "🔧 Using server: $SERVER_FILE"

# Create data directory if it doesn't exist
mkdir -p data

# Start both servers concurrently with optional auto-restart
if command -v concurrently &> /dev/null; then
# Use concurrently - restart disabled for better development control
concurrently \
--names "Next,SQLite-Server" \
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
            --names "Next,SQLite-Server" \
            --prefix-colors "blue,green" \
            "NEXT_PUBLIC_DETECTED_IP=$LOCAL_IP npm run dev" \
            "node $SERVER_FILE"
    else
        # Fallback: start server in background, then Next.js
        echo "Starting signaling server in background..."
        node "$SERVER_FILE" &
        SERVER_PID=$!
        
        echo "Starting Next.js development server..."
        NEXT_PUBLIC_DETECTED_IP="$LOCAL_IP" npm run dev
        
        # Clean up on exit
        trap "kill $SERVER_PID 2>/dev/null" EXIT
    fi
fi