#!/bin/bash
# Enhanced Mobile Development Script for Festival Chat
# Fixes mobile timeout issues with proper dual ngrok tunnel setup

echo "🎵 Festival Chat - Enhanced Mobile Development"
echo "=============================================="
echo "🎯 Fixes: Mobile timeouts, room discovery, host refresh resilience"
echo ""

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    if ! command -v ngrok &> /dev/null; then
        print_error "ngrok is not installed or not in PATH"
        echo "Please install ngrok:"
        echo "  1. Sign up at https://ngrok.com"
        echo "  2. Download and install ngrok"
        echo "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Please install Node.js first"
        exit 1
    fi

    if [ ! -f "package.json" ]; then
        print_error "Not in festival-chat directory"
        echo "Please run this script from the festival-chat directory"
        exit 1
    fi

    print_status "All prerequisites met"
}

# Clean up any existing processes
cleanup_existing() {
    print_step "Cleaning up existing processes..."
    
    # Kill ngrok processes
    pkill -f "ngrok" 2>/dev/null || true
    
    # Kill processes on our ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    # Clean up log files
    rm -f /tmp/ngrok-*.log
    
    print_status "Cleanup complete"
    sleep 2
}

# Install dependencies if needed
ensure_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
        print_status "Dependencies installed"
    fi
}

# Start the signaling server
start_signaling_server() {
    print_step "Starting signaling server on port 3001..."
    
    # Check if signaling server file exists
    if [ ! -f "signaling-server.js" ]; then
        print_error "signaling-server.js not found"
        exit 1
    fi
    
    node signaling-server.js &
    SIGNALING_PID=$!
    
    # Wait and test if signaling server is responding
    sleep 3
    
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Signaling server running (PID: $SIGNALING_PID)"
    else
        print_error "Signaling server failed to start"
        exit 1
    fi
}

# Start Next.js development server
start_nextjs_server() {
    print_step "Starting Next.js development server on port 3000..."
    
    npm run dev &
    NEXTJS_PID=$!
    
    # Wait and test if Next.js server is responding
    sleep 5
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Next.js server running (PID: $NEXTJS_PID)"
    else
        print_error "Next.js server failed to start"
        exit 1
    fi
}

# Create ngrok tunnels with retry logic
create_ngrok_tunnels() {
    print_step "Creating ngrok tunnels for mobile access..."
    
    # Start first tunnel for main app
    print_info "Creating tunnel for main app (port 3000)..."
    ngrok http 3000 --log=stdout --log-level=info > /tmp/ngrok-app.log &
    NGROK_APP_PID=$!
    
    # Wait a bit before starting second tunnel
    sleep 3
    
    # Start second tunnel for signaling server
    print_info "Creating tunnel for signaling server (port 3001)..."
    # Use a different method to avoid port conflicts
    ngrok http 3001 --log=stdout --log-level=info > /tmp/ngrok-signaling.log &
    NGROK_SIGNALING_PID=$!
    
    print_info "Waiting for ngrok tunnels to establish..."
    sleep 10
}

# Extract URLs from ngrok with better error handling
extract_ngrok_urls() {
    print_step "Extracting ngrok URLs..."
    
    local max_attempts=20
    local attempt=1
    
    APP_URL=""
    SIGNALING_URL=""
    
    while [ $attempt -le $max_attempts ]; do
        print_info "Attempt $attempt/$max_attempts..."
        
        # Try to get tunnels from ngrok API
        if command -v curl >/dev/null 2>&1; then
            local api_response=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
            
            if [ $? -eq 0 ] && echo "$api_response" | grep -q "tunnels"; then
                # Parse JSON response for tunnel URLs
                APP_URL=$(echo "$api_response" | grep -oE '"public_url":"[^"]*"' | grep -v ':3001' | head -1 | cut -d'"' -f4)
                SIGNALING_URL=$(echo "$api_response" | grep -oE '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
                
                # If we only got one URL, try to get both by parsing differently
                if [ -n "$APP_URL" ] && [ -z "$SIGNALING_URL" ]; then
                    # Look for all HTTPS URLs and try to distinguish them
                    local all_urls=$(echo "$api_response" | grep -oE 'https://[^"]*\.ngrok[^"]*')
                    if [ $(echo "$all_urls" | wc -l) -ge 2 ]; then
                        APP_URL=$(echo "$all_urls" | head -1)
                        SIGNALING_URL=$(echo "$all_urls" | tail -1)
                    fi
                fi
                
                # Validate URLs
                if [ -n "$APP_URL" ]; then
                    print_info "Found app URL: $APP_URL"
                    
                    if [ -n "$SIGNALING_URL" ] && [ "$APP_URL" != "$SIGNALING_URL" ]; then
                        print_info "Found signaling URL: $SIGNALING_URL"
                        print_status "Both ngrok tunnels detected!"
                        return 0
                    else
                        print_warning "Only one ngrok tunnel detected"
                        if [ $attempt -lt $max_attempts ]; then
                            print_info "Waiting for second tunnel..."
                        fi
                    fi
                fi
            fi
        fi
        
        # If API approach failed, try parsing log files
        if [ -z "$APP_URL" ] && [ -f /tmp/ngrok-app.log ]; then
            APP_URL=$(grep -oE 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-app.log | head -1)
        fi
        
        if [ -z "$SIGNALING_URL" ] && [ -f /tmp/ngrok-signaling.log ]; then
            SIGNALING_URL=$(grep -oE 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-signaling.log | head -1)
        fi
        
        # Check if we have both URLs
        if [ -n "$APP_URL" ] && [ -n "$SIGNALING_URL" ] && [ "$APP_URL" != "$SIGNALING_URL" ]; then
            print_status "Successfully extracted both URLs!"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # If we get here, we couldn't get both URLs
    if [ -n "$APP_URL" ]; then
        print_warning "Only got app URL, signaling will use localhost"
        SIGNALING_URL="http://localhost:3001"
        return 1
    else
        print_error "Failed to get any ngrok URLs"
        return 2
    fi
}

# Test URLs for accessibility
test_urls() {
    print_step "Testing URL accessibility..."
    
    if [ -n "$APP_URL" ]; then
        if curl -s "$APP_URL" >/dev/null 2>&1; then
            print_status "App URL is accessible"
        else
            print_warning "App URL may not be fully ready yet"
        fi
    fi
    
    if [ -n "$SIGNALING_URL" ] && [[ $SIGNALING_URL == https* ]]; then
        if curl -s "$SIGNALING_URL/health" >/dev/null 2>&1; then
            print_status "Signaling URL is accessible"
        else
            print_warning "Signaling URL may not be fully ready yet"
        fi
    fi
}

# Configure environment for mobile access
configure_environment() {
    print_step "Configuring environment for mobile access..."
    
    if [ -n "$SIGNALING_URL" ]; then
        echo "NEXT_PUBLIC_SIGNALING_SERVER=$SIGNALING_URL" > .env.local
        print_status "Updated .env.local with signaling URL"
        
        # Restart Next.js to pick up new environment
        print_info "Restarting Next.js to load new configuration..."
        kill $NEXTJS_PID 2>/dev/null || true
        sleep 3
        
        npm run dev &
        NEXTJS_PID=$!
        
        # Wait for restart
        sleep 5
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_status "Next.js restarted successfully"
        else
            print_error "Next.js failed to restart"
            return 1
        fi
    else
        print_warning "No signaling URL available, using localhost fallback"
        echo "NEXT_PUBLIC_SIGNALING_SERVER=http://localhost:3001" > .env.local
    fi
}

# Display final information
display_results() {
    echo ""
    echo -e "${GREEN}🎉 Festival Chat Mobile Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    
    if [ -n "$APP_URL" ]; then
        echo -e "${CYAN}📱 Mobile App URL:${NC} $APP_URL"
    else
        echo -e "${YELLOW}📱 Mobile App URL:${NC} Check http://localhost:4040"
    fi
    
    if [ -n "$SIGNALING_URL" ] && [[ $SIGNALING_URL == https* ]]; then
        echo -e "${CYAN}🔌 Signaling Server:${NC} $SIGNALING_URL"
        echo -e "${GREEN}🎯 Room Discovery:${NC} ENABLED (full cross-device)"
    elif [ -n "$SIGNALING_URL" ]; then
        echo -e "${CYAN}🔌 Signaling Server:${NC} $SIGNALING_URL"
        echo -e "${YELLOW}🎯 Room Discovery:${NC} ENABLED (localhost - same device only)"
    else
        echo -e "${YELLOW}🔌 Signaling Server:${NC} Not configured"
        echo -e "${YELLOW}🎯 Room Discovery:${NC} DISABLED (direct P2P only)"
    fi
    
    echo -e "${CYAN}🖥️  Desktop Access:${NC} http://localhost:3000"
    echo -e "${CYAN}🔍 Ngrok Dashboard:${NC} http://localhost:4040"
    echo ""
    
    echo -e "${PURPLE}🧪 Mobile Testing Steps:${NC}"
    echo "1. Desktop: Create room at http://localhost:3000"
    if [ -n "$APP_URL" ]; then
        echo "2. Mobile: Open $APP_URL"
    else
        echo "2. Mobile: Get URL from http://localhost:4040"
    fi
    echo "3. Mobile: Scan QR code or join same room name"
    echo "4. Test messaging between devices"
    echo "5. Desktop: Refresh browser (should maintain room)"
    echo "6. Mobile: Should auto-reconnect without new QR scan!"
    echo ""
    
    echo -e "${PURPLE}🔧 Debug Tools:${NC}"
    echo "• App health: http://localhost:3000"
    echo "• Signaling health: http://localhost:3001/health"
    echo "• Ngrok status: http://localhost:4040"
    echo ""
    
    echo -e "${BLUE}💡 Troubleshooting:${NC}"
    echo "• Mobile timeouts: Check browser console for errors"
    echo "• Room discovery: Monitor signaling server logs"
    echo "• Connection issues: Try different networks (WiFi vs cellular)"
    echo "• P2P fallback: Direct connections work even without signaling"
    echo ""
    
    print_warning "Press Ctrl+C to stop all servers and tunnels"
    echo ""
}

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    print_step "Shutting down all services..."
    
    kill $NEXTJS_PID 2>/dev/null || true
    kill $SIGNALING_PID 2>/dev/null || true
    kill $NGROK_APP_PID 2>/dev/null || true
    kill $NGROK_SIGNALING_PID 2>/dev/null || true
    
    pkill -f "ngrok" 2>/dev/null || true
    
    # Clean up temp files
    rm -f /tmp/ngrok-*.log
    
    print_status "Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution flow
main() {
    check_prerequisites
    cleanup_existing
    ensure_dependencies
    
    start_signaling_server
    start_nextjs_server
    
    create_ngrok_tunnels
    
    if extract_ngrok_urls; then
        test_urls
        configure_environment
        display_results
    else
        print_warning "Ngrok setup incomplete, but servers are running"
        print_info "You can still test locally or set up ngrok manually"
        display_results
    fi
    
    # Keep script running
    while true; do
        sleep 10
        
        # Basic health checks
        if ! kill -0 $SIGNALING_PID 2>/dev/null; then
            print_error "Signaling server died, restarting..."
            start_signaling_server
        fi
        
        if ! kill -0 $NEXTJS_PID 2>/dev/null; then
            print_error "Next.js server died, restarting..."
            start_nextjs_server
        fi
    done
}

# Run main function
main