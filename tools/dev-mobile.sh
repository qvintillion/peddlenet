#!/bin/bash

echo "🎯 Festival Chat - Mobile Development Setup"
echo "========================================="
echo ""

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kill existing processes first
echo "🛑 Stopping any existing servers..."
pkill -f "signaling-server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Auto-detect IP using our improved script
echo "🌐 Detecting current network IP..."
DETECTED_IP=$(node tools/detect-ip.js 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$DETECTED_IP" ]; then
    echo -e "${GREEN}✅ Detected IP: $DETECTED_IP${NC}"
    IP="$DETECTED_IP"
else
    echo -e "${YELLOW}⚠️  Could not auto-detect IP, trying fallback methods...${NC}"
    
    # Fallback method 1: route command (macOS)
    if command -v route >/dev/null 2>&1; then
        FALLBACK_IP=$(route get default 2>/dev/null | grep interface | awk '{print $2}' | xargs ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    
    # Fallback method 2: ifconfig
    if [ -z "$FALLBACK_IP" ] && command -v ifconfig >/dev/null 2>&1; then
        FALLBACK_IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi
    
    # Fallback method 3: ip command (Linux)
    if [ -z "$FALLBACK_IP" ] && command -v ip >/dev/null 2>&1; then
        FALLBACK_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    if [ -n "$FALLBACK_IP" ]; then
        echo -e "${YELLOW}✅ Fallback detected: $FALLBACK_IP${NC}"
        IP="$FALLBACK_IP"
    else
        echo -e "${RED}❌ Could not detect IP address automatically${NC}"
        echo "Please run manually: ifconfig | grep 'inet '"
        echo "And update the script with your IP address"
        IP="192.168.1.100"  # Final fallback
        echo -e "${YELLOW}Using fallback IP: $IP${NC}"
    fi
fi

echo ""

# Clear any existing environment file and set fresh signaling URL
echo "📝 Setting up environment for current session..."
echo "NEXT_PUBLIC_SIGNALING_SERVER=http://${IP}:3001" > .env.local
echo -e "${BLUE}📡 Signaling server will be accessible at: http://${IP}:3001${NC}"

# Start signaling server (bound to all interfaces for network access)
echo "📡 Starting signaling server on all interfaces..."
node signaling-server.js &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for signaling server to start
sleep 3

# Start Next.js (will pick up the new environment variable)
echo "🌐 Starting Next.js with network-accessible signaling..."
npm run dev &
NEXTJS_PID=$!
echo "   Next.js PID: $NEXTJS_PID"

echo ""
echo "⏳ Waiting for servers to initialize..."
sleep 8

# Test accessibility
echo "🧪 Testing network accessibility..."

# Test Next.js
echo -n "   📱 Next.js app: "
if curl -s -I "http://$IP:3000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible at http://$IP:3000${NC}"
    NEXTJS_OK=true
else
    echo -e "${YELLOW}⚠️  May not be accessible from mobile${NC}"
    NEXTJS_OK=false
fi

# Test signaling server
echo -n "   📡 Signaling server: "
if curl -s "http://$IP:3001/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible at http://$IP:3001${NC}"
    SERVER_OK=true
else
    echo -e "${YELLOW}⚠️  May not be accessible from mobile${NC}"
    SERVER_OK=false
fi

echo ""
echo "🎉 Mobile development setup complete!"
echo ""

if [ "$NEXTJS_OK" = true ] && [ "$SERVER_OK" = true ]; then
    echo -e "${GREEN}✅ Both servers are accessible from mobile devices!${NC}"
else
    echo -e "${YELLOW}⚠️  Some servers may not be accessible from mobile${NC}"
    echo "   Check your firewall settings if mobile devices can't connect"
fi

echo ""
echo -e "${BLUE}📱 Access URLs:${NC}"
echo "   🖥️  Desktop: http://localhost:3000"
echo "   📱 Mobile:  http://${IP}:3000"
echo "   🔗 Share:   http://${IP}:3000"
echo ""
echo -e "${BLUE}🔧 Development URLs:${NC}"
echo "   📡 Signaling: http://${IP}:3001/health"
echo "   🌐 Current IP: $IP"
echo ""
echo -e "${BLUE}🧪 Mobile Testing Steps:${NC}"
echo "   1. 🖥️  Desktop: Open http://localhost:3000"
echo "   2. 🏠 Create/join a room (e.g., 'main-stage-chat')"
echo "   3. 📱 Mobile: Connect to same WiFi network"
echo "   4. 📱 Mobile: Open http://${IP}:3000"
echo "   5. 🏠 Mobile: Join the SAME room name"
echo "   6. 💬 Test messaging between devices!"
echo ""
echo -e "${BLUE}💡 Features enabled:${NC}"
echo "   ✅ Cross-device chat (mobile ↔ desktop)"
echo "   ✅ QR code room sharing with current IP"
echo "   ✅ Real-time message sync"
echo "   ✅ Persistent chat rooms"
echo "   ✅ Automatic IP detection on startup"
echo ""

# Show detailed IP info if verbose flag is used
if [ "$1" = "--verbose" ] || [ "$1" = "-v" ]; then
    echo ""
    echo -e "${BLUE}🔍 Detailed Network Information:${NC}"
    node tools/detect-ip.js --verbose
    echo ""
fi

echo -e "${YELLOW}🛑 Stop servers: Press Ctrl+C${NC}"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $NEXTJS_PID 2>/dev/null
    echo "✅ Servers stopped"
    
    # Optional: clear the environment file
    if [ -f .env.local ]; then
        echo "🧹 Cleaning up environment file..."
        rm .env.local
    fi
    
    exit 0
}

trap cleanup INT TERM
echo ""
echo "✋ Servers running... Press Ctrl+C to stop"
wait
