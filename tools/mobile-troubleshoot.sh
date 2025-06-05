#!/bin/bash

echo "🔧 Festival Chat - Mobile Connection Troubleshooter"
echo "=================================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get local IP
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig en0 | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        ip route get 1.1.1.1 | grep -oP 'src \K\S+' | head -1
    else
        echo "unknown"
    fi
}

# Get local IP
LOCAL_IP=$(get_local_ip)
if [ "$LOCAL_IP" = "unknown" ] || [ -z "$LOCAL_IP" ]; then
    echo "⚠️  Could not auto-detect IP address"
    echo ""
    echo "🔍 Please find your IP manually:"
    echo "  • Mac: System Preferences → Network → WiFi"
    echo "  • Linux: ip addr show"
    echo "  • Windows: ipconfig"
    echo ""
    read -p "Enter your IP address: " LOCAL_IP
fi

echo "🌐 Using IP address: $LOCAL_IP"
echo ""

# Check if Node.js is available
if ! command_exists node; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js is available"

# Check if the project directory is correct
if [ ! -f "signaling-server.js" ]; then
    echo "❌ signaling-server.js not found"
    echo "   Please run this script from the festival-chat project root"
    exit 1
fi

echo "✅ Project files found"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies installed"

# Kill any existing processes on ports 3000-3005
echo "🛑 Killing existing processes..."
for port in 3000 3001 3002 3003 3004 3005; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill -9 $pid 2>/dev/null
        echo "   Killed process on port $port"
    fi
done

echo "✅ Ports cleared"

# Test network connectivity
echo "🔍 Testing network connectivity..."
ping -c 1 $LOCAL_IP >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Local IP is reachable"
else
    echo "⚠️  Local IP may not be reachable"
fi

# Start signaling server
echo "📡 Starting signaling server..."
node signaling-server.js &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

# Test server health
echo "🏥 Testing server health..."
for port in 3001 3002 3003 3004 3005; do
    curl -s http://$LOCAL_IP:$port/health >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Server responding on port $port"
        SERVER_PORT=$port
        break
    fi
done

if [ -z "$SERVER_PORT" ]; then
    echo "❌ Server not responding on any port"
    kill $SERVER_PID 2>/dev/null
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "  1. Check firewall settings"
    echo "  2. Ensure WiFi allows local connections"
    echo "  3. Try running: node signaling-server.js manually"
    exit 1
fi

# Start Next.js dev server
echo "🌐 Starting Next.js development server..."
npm run dev &
DEV_PID=$!
echo "   Dev server PID: $DEV_PID"

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 10

# Test Next.js health
curl -s http://$LOCAL_IP:3000 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Next.js server responding"
else
    echo "⚠️  Next.js server may not be ready yet"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📱 Mobile-accessible URLs:"
echo "   App: http://$LOCAL_IP:3000"
echo "   Server: http://$LOCAL_IP:$SERVER_PORT"
echo ""
echo "🧪 Testing Steps:"
echo "   1. Open http://$LOCAL_IP:3000 on your computer"
echo "   2. Create or join a room"
echo "   3. Click '📱 Invite' button"
echo "   4. Scan QR code with your mobile device"
echo "   5. Both devices should connect!"
echo ""
echo "🔍 If mobile doesn't work:"
echo "   • Check both devices are on same WiFi"
echo "   • Try disabling firewall temporarily"
echo "   • Check mobile browser console for errors"
echo "   • Use the debug panel in the app"
echo ""
echo "🛑 To stop servers: Ctrl+C or kill $SERVER_PID $DEV_PID"
echo ""

# Function to clean up on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $DEV_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up cleanup on script exit
trap cleanup INT TERM

# Keep script running
echo "✋ Press Ctrl+C to stop both servers"
wait
