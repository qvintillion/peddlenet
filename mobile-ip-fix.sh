#!/bin/bash
# Mobile IP Fix - Make signaling server accessible from mobile on same network

echo "🎵 Festival Chat - Mobile IP Network Fix"
echo "======================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

# Get local IP
get_local_ip() {
    # Try different methods to get local IP
    LOCAL_IP=""
    
    # Method 1: route command (most reliable)
    if command -v route >/dev/null 2>&1; then
        LOCAL_IP=$(route get default | grep interface | awk '{print $2}' | xargs ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    
    # Method 2: ifconfig (backup)
    if [ -z "$LOCAL_IP" ] && command -v ifconfig >/dev/null 2>&1; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi
    
    # Method 3: ip command (Linux)
    if [ -z "$LOCAL_IP" ] && command -v ip >/dev/null 2>&1; then
        LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
    fi
    
    echo "$LOCAL_IP"
}

# Clean up
cleanup_existing() {
    print_step "Cleaning up existing processes..."
    pkill -f "ngrok" 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    print_status "Cleanup complete"
    sleep 2
}

# Start signaling server
start_signaling_server() {
    print_step "Starting signaling server..."
    node signaling-server.js &
    SIGNALING_PID=$!
    sleep 3
    
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Signaling server running (PID: $SIGNALING_PID)"
    else
        echo "❌ Signaling server failed to start"
        exit 1
    fi
}

# Start Next.js with mobile-accessible signaling URL
start_nextjs_server() {
    local local_ip=$1
    print_step "Starting Next.js with mobile-accessible signaling..."
    
    # Set signaling server to use local IP so mobile can reach it
    echo "NEXT_PUBLIC_SIGNALING_SERVER=http://${local_ip}:3001" > .env.local
    print_info "Signaling URL set to: http://${local_ip}:3001"
    
    npm run dev &
    NEXTJS_PID=$!
    sleep 5
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Next.js server running (PID: $NEXTJS_PID)"
    else
        echo "❌ Next.js server failed to start"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_step "Shutting down..."
    kill $NEXTJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true
    print_status "Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
LOCAL_IP=$(get_local_ip)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not determine local IP address"
    echo "Please find your IP manually with 'ifconfig' and set:"
    echo "NEXT_PUBLIC_SIGNALING_SERVER=http://YOUR_IP:3001"
    exit 1
fi

print_info "Detected local IP: $LOCAL_IP"

cleanup_existing
start_signaling_server  
start_nextjs_server $LOCAL_IP

echo ""
print_status "Festival Chat ready for mobile testing!"
echo ""
echo -e "${BLUE}🖥️  Desktop Access:${NC} http://localhost:3000"
echo -e "${BLUE}📱 Mobile Access:${NC} http://${LOCAL_IP}:3000"
echo -e "${BLUE}🔌 Signaling Server:${NC} http://${LOCAL_IP}:3001"
echo ""
echo -e "${PURPLE}🧪 Mobile Testing Steps:${NC}"
echo "1. Desktop: Open http://localhost:3000"
echo "2. Desktop: Create/join room 'main-stage-chat'"
echo "3. Mobile: Open http://${LOCAL_IP}:3000"
echo "4. Mobile: Join SAME room name 'main-stage-chat'"
echo "5. Should see auto-connection logs on both devices!"
echo ""
echo -e "${BLUE}🔍 Test signaling from mobile:${NC}"
echo "Open mobile browser console and run:"
echo "fetch('http://${LOCAL_IP}:3001/health').then(r=>r.json()).then(console.log)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Keep running with health checks
while true; do
    sleep 10
    
    if ! kill -0 $SIGNALING_PID 2>/dev/null; then
        echo "❌ Signaling server died, restarting..."
        start_signaling_server
    fi
    
    if ! kill -0 $NEXTJS_PID 2>/dev/null; then
        echo "❌ Next.js server died, restarting..."
        start_nextjs_server $LOCAL_IP
    fi
done