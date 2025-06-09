#!/bin/bash

echo "🎯 Festival Chat - Mobile Development Setup (Enhanced)"
echo "===================================================="
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

# Auto-detect IP using the proven method
echo "🌐 Detecting network configuration..."
IP_OUTPUT=$(node tools/find-ip.js 2>/dev/null)
IP=$(echo "$IP_OUTPUT" | grep "Recommended IP:" | awk '{print $3}')

if [ -z "$IP" ] || [ "$IP" = "localhost" ]; then
    echo -e "${YELLOW}⚠️  Auto-detection failed, trying fallback...${NC}"
    # Fallback to detect-ip.js
    IP=$(node tools/detect-ip.js 2>/dev/null)
    
    if [ -z "$IP" ] || [ "$IP" = "localhost" ]; then
        echo -e "${RED}❌ Could not detect IP, using manual fallback${NC}"
        echo ""
        echo "Please run this command to find your IP:"
        echo "  node tools/find-ip.js"
        echo ""
        IP="192.168.1.100"  # Final fallback
    fi
fi

echo -e "${GREEN}✅ Using IP: $IP${NC}"

# Set up environment for both signaling server AND QR code generation
echo "📝 Setting up development environment..."
echo "NEXT_PUBLIC_SIGNALING_SERVER=http://${IP}:3001" > .env.local
echo "NEXT_PUBLIC_DETECTED_IP=${IP}" >> .env.local
echo -e "${BLUE}📡 Signaling server: http://${IP}:3001${NC}"
echo -e "${BLUE}🌐 Detected IP for QR codes: ${IP}${NC}"

# Start signaling server (configured for all interfaces)
echo "📡 Starting signaling server on all interfaces..."
node signaling-server.js &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for signaling server to start
sleep 3

# Start Next.js (will pick up both environment variables)
echo "🌐 Starting Next.js with enhanced mobile support..."
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
echo "🎉 Enhanced mobile development setup complete!"
echo ""

if [ "$NEXTJS_OK" = true ] && [ "$SERVER_OK" = true ]; then
    echo -e "${GREEN}✅ All servers accessible from mobile devices!${NC}"
    echo ""
    echo -e "${BLUE}🎯 QR Code Magic:${NC}"
    echo -e "   • App will ${GREEN}automatically${NC} use IP: ${GREEN}$IP${NC}"
    echo -e "   • Works from ${GREEN}any URL${NC}: localhost:3000 or $IP:3000"
    echo -e "   • QR codes will ${GREEN}always${NC} use the detected IP"
    echo ""
    echo -e "${BLUE}📱 Access Methods:${NC}"
    echo "   🖥️  Desktop: http://localhost:3000 (works perfectly)"
    echo "   📱 Mobile:  http://$IP:3000 (for direct access)"
    echo "   📸 QR Code: Will automatically use $IP (from any access method)"
else
    echo -e "${YELLOW}⚠️  Some servers may not be accessible from mobile${NC}"
    echo "   Check your firewall settings if mobile devices can't connect"
fi

echo ""
echo -e "${BLUE}🧪 Testing Steps:${NC}"
echo "   1. 🖥️  Open http://localhost:3000 (your usual workflow)"
echo "   2. 🏠 Create/join a room"
echo "   3. 📱 Click 'Invite' button"
echo -e "   4. 🎯 QR code will ${GREEN}automatically${NC} show: http://$IP:3000/..."
echo "   5. 📱 Mobile: Scan QR code to join instantly"
echo "   6. 💬 Test messaging between devices!"

echo ""
echo -e "${BLUE}💡 Enhanced Features:${NC}"
echo "   ✅ Automatic IP detection for QR codes"
echo "   ✅ Works from localhost OR IP address"
echo "   ✅ No manual navigation to IP required"
echo "   ✅ Cross-device chat (mobile ↔ desktop)"
echo "   ✅ Real-time message sync"
echo "   ✅ Persistent chat rooms"

echo ""
echo -e "${YELLOW}🛑 Stop servers: Press Ctrl+C${NC}"

# Show detected IP info for verification
echo ""
echo -e "${BLUE}🔍 IP Detection Results:${NC}"
node tools/find-ip.js

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $NEXTJS_PID 2>/dev/null
    echo "✅ Servers stopped"
    
    # Clean up environment file
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
