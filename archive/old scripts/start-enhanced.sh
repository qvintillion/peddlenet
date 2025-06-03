#!/bin/bash

# Enhanced startup script for Festival Chat with reliable P2P
# This script starts both the PeerJS server and the signaling server

echo "🎵 Starting Festival Chat with Enhanced P2P..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing any existing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and install dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Install peer package if not present
if ! npm list peer &> /dev/null; then
    echo -e "${YELLOW}Installing peer package...${NC}"
    npm install peer
fi

# Clean up any existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
kill_port 3000  # Next.js dev server
kill_port 3001  # Signaling server
kill_port 9000  # PeerJS server

# Wait a moment for cleanup
sleep 2

# Start PeerJS server in background
echo -e "${GREEN}Starting PeerJS server on port 9000...${NC}"
node peerjs-server.js &
PEERJS_PID=$!

# Wait for PeerJS server to start
sleep 2

# Check if PeerJS server started successfully
if check_port 9000; then
    echo -e "${GREEN}✅ PeerJS server started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start PeerJS server${NC}"
    kill $PEERJS_PID 2>/dev/null || true
    exit 1
fi

# Start signaling server in background
echo -e "${GREEN}Starting signaling server on port 3001...${NC}"
node signaling-server.js &
SIGNALING_PID=$!

# Wait for signaling server to start
sleep 2

# Check if signaling server started successfully
if check_port 3001; then
    echo -e "${GREEN}✅ Signaling server started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start signaling server${NC}"
    kill $PEERJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true
    exit 1
fi

# Start Next.js development server
echo -e "${GREEN}Starting Next.js development server on port 3000...${NC}"
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo -e "${YELLOW}Waiting for Next.js to start...${NC}"
sleep 5

# Check if Next.js server started successfully
if check_port 3000; then
    echo -e "${GREEN}✅ Next.js server started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start Next.js server${NC}"
    kill $PEERJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    exit 1
fi

# Show status
echo ""
echo -e "${GREEN}🎉 All servers started successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Server Status:${NC}"
echo -e "${GREEN}  ✅ PeerJS Server:    http://localhost:9000/peerjs${NC}"
echo -e "${GREEN}  ✅ Signaling Server: http://localhost:3001${NC}"
echo -e "${GREEN}  ✅ Festival Chat:    http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}🔧 Health Checks:${NC}"
echo -e "${YELLOW}  🏥 PeerJS Health:    http://localhost:9000/health${NC}"
echo -e "${YELLOW}  🏥 Signaling Health: http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}📱 Enhanced Features:${NC}"
echo -e "${GREEN}  ✅ Multiple STUN/TURN servers for better NAT traversal${NC}"
echo -e "${GREEN}  ✅ Automatic fallback between different PeerJS configurations${NC}"
echo -e "${GREEN}  ✅ Local PeerJS server for reliability${NC}"
echo -e "${GREEN}  ✅ Enhanced connection quality with TURN servers${NC}"
echo -e "${GREEN}  ✅ Auto-reconnection when connections drop${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Shutting down servers...${NC}"
    kill $PEERJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    
    # Give processes time to shutdown gracefully
    sleep 2
    
    # Force kill if still running
    kill_port 3000
    kill_port 3001
    kill_port 9000
    
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Trap interrupt signals
trap cleanup SIGINT SIGTERM

# Keep script running and monitor servers
while true; do
    sleep 10
    
    # Check if servers are still running
    if ! check_port 9000; then
        echo -e "${RED}❌ PeerJS server stopped unexpectedly${NC}"
        cleanup
    fi
    
    if ! check_port 3001; then
        echo -e "${RED}❌ Signaling server stopped unexpectedly${NC}"
        cleanup
    fi
    
    if ! check_port 3000; then
        echo -e "${RED}❌ Next.js server stopped unexpectedly${NC}"
        cleanup
    fi
done