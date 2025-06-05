#!/bin/bash
# debug-signaling.sh - Debug signaling server connectivity

echo "🔍 PeddleNet Signaling Debug Tool"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from the festival-chat root directory"
    exit 1
fi

# Function to test URL connectivity
test_url() {
    local url=$1
    local name=$2
    echo -n "Testing $name ($url)... "
    
    if curl -s --max-time 5 "$url/health" > /dev/null 2>&1; then
        echo "✅ REACHABLE"
        return 0
    else
        echo "❌ UNREACHABLE"
        return 1
    fi
}

# Function to check environment variables
check_env() {
    echo ""
    echo "📋 Environment Variables:"
    
    # Check if Next.js process has the variable
    if pgrep -f "next" > /dev/null; then
        echo "ℹ️  Next.js is running - checking runtime environment"
    fi
    
    echo "NEXT_PUBLIC_SIGNALING_SERVER: ${NEXT_PUBLIC_SIGNALING_SERVER:-'Not set'}"
    
    if [ -f ".env.local" ]; then
        echo "Found .env.local:"
        local env_value=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.local 2>/dev/null || echo "  No signaling config found")
        echo "  $env_value"
        
        # Extract the URL for testing
        if [[ $env_value == *"=https://"* ]]; then
            ENV_SIGNALING_URL=$(echo "$env_value" | cut -d'=' -f2)
            echo "  ✅ Found signaling URL in .env.local: $ENV_SIGNALING_URL"
        fi
    fi
    
    if [ -f ".env" ]; then
        echo "Found .env:"
        grep -E "SIGNALING|signaling" .env 2>/dev/null || echo "  No signaling config found"
    fi
}

# Function to test common signaling URLs
test_signaling_servers() {
    echo ""
    echo "🌐 Testing Signaling Servers:"
    
    # Production server (from your logs)
    test_url "https://peddlenet-signaling-433318323150.us-central1.run.app" "Production Server"
    
    # Local development
    test_url "http://localhost:3001" "Local Development"
    
    # Check if local signaling server is running
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "  ℹ️  Local server detected on port 3001"
    else
        echo "  ⚠️  No local server running on port 3001"
    fi
    
    # Environment variable URL
    if [ ! -z "$NEXT_PUBLIC_SIGNALING_SERVER" ]; then
        test_url "$NEXT_PUBLIC_SIGNALING_SERVER" "Environment Config"
    elif [ ! -z "$ENV_SIGNALING_URL" ]; then
        echo "Testing .env.local URL..."
        test_url "$ENV_SIGNALING_URL" "Env Local Config"
    fi
}

# Function to check network connectivity
check_network() {
    echo ""
    echo "🌍 Network Connectivity:"
    
    # Test basic internet
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        echo "✅ Internet connectivity: OK"
    else
        echo "❌ Internet connectivity: FAILED"
    fi
    
    # Test DNS
    if nslookup google.com > /dev/null 2>&1; then
        echo "✅ DNS resolution: OK"
    else
        echo "❌ DNS resolution: FAILED"
    fi
    
    # Check firewall/network restrictions
    echo "ℹ️  Current IP address:"
    curl -s https://ipinfo.io/ip 2>/dev/null || echo "  Could not detect IP"
}

# Function to restart Next.js with environment reload
restart_nextjs() {
    echo ""
    echo "🔄 Restarting Next.js to reload environment variables..."
    
    # Kill existing Next.js processes
    echo "Stopping existing Next.js processes..."
    pkill -f "next" 2>/dev/null || true
    sleep 2
    
    # Check if mobile-dev.sh exists for mobile development
    if [ -f "mobile-dev.sh" ]; then
        echo "📱 Starting mobile development server..."
        echo "Run: ./mobile-dev.sh"
        echo "(Or press Enter to start it now)"
        read -p "Press Enter to continue..."
        ./mobile-dev.sh &
    else
        echo "💻 Starting standard development server..."
        echo "Run: npm run dev"
        echo "(Or press Enter to start it now)"
        read -p "Press Enter to continue..."
        npm run dev &
    fi
    
    echo "✅ Development server starting..."
    echo "🔍 Check browser console for: process.env.NEXT_PUBLIC_SIGNALING_SERVER"
}

# Function to start local signaling server
start_local_signaling() {
    echo ""
    echo "🚀 Starting Local Signaling Server:"
    
    if [ ! -f "signaling-server.js" ]; then
        echo "❌ signaling-server.js not found"
        return 1
    fi
    
    # Check if already running
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "⚠️  Port 3001 already in use. Stopping existing process..."
        pkill -f "node.*signaling-server.js" 2>/dev/null || true
        sleep 2
    fi
    
    echo "Starting signaling server on port 3001..."
    node signaling-server.js &
    local pid=$!
    
    # Wait a moment for startup
    sleep 3
    
    # Test if it started successfully
    if test_url "http://localhost:3001" "Local Server"; then
        echo "✅ Local signaling server started successfully (PID: $pid)"
        echo "📝 To use local server, update your .env.local:"
        echo "NEXT_PUBLIC_SIGNALING_SERVER=http://localhost:3001"
        return 0
    else
        echo "❌ Failed to start local signaling server"
        kill $pid 2>/dev/null || true
        return 1
    fi
}

# Function to fix environment configuration
fix_env_config() {
    echo ""
    echo "🔧 Fixing Environment Configuration:"
    
    # Backup existing config
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        echo "📄 Backed up .env.local to .env.local.backup"
    fi
    
    # Use production server (we know it's reachable)
    local signaling_url="https://peddlenet-signaling-433318323150.us-central1.run.app"
    
    echo "✅ Using production signaling server: $signaling_url"
    
    # Update .env.local
    if [ -f ".env.local" ]; then
        # Remove existing signaling config
        grep -v "NEXT_PUBLIC_SIGNALING_SERVER" .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    fi
    
    echo "NEXT_PUBLIC_SIGNALING_SERVER=$signaling_url" >> .env.local
    echo "✅ Updated .env.local with: $signaling_url"
    
    echo ""
    echo "🔄 Next steps:"
    echo "1. Restart your development server to reload environment variables"
    echo "2. Check browser console for the signaling server URL"
    echo "3. Both mobile and desktop should now use the same signaling server"
    
    read -p "Would you like me to restart the development server now? (y/n): " restart_choice
    if [[ $restart_choice =~ ^[Yy]$ ]]; then
        restart_nextjs
    fi
}

# Function to test both mobile and desktop
test_cross_platform() {
    echo ""
    echo "📱💻 Cross-Platform Test Instructions:"
    echo "1. Ensure both devices are on the same network"
    echo "2. Start the development server: ./mobile-dev.sh"
    echo "3. Open the ngrok URL on both devices"
    echo "4. Check browser console for signaling connection logs"
    echo ""
    echo "Expected logs:"
    echo "  ✅ '🔌 Using configured signaling server: ...'"
    echo "  ✅ '✅ Connected to signaling server for room discovery'"
    echo "  ✅ '👥 Discovered room peers: X'"
    echo ""
    echo "Debug in browser console:"
    echo "  console.log('Signaling:', process.env.NEXT_PUBLIC_SIGNALING_SERVER);"
    echo "  window.P2PDebug?.getConnections?.();"
}

# Main execution
main() {
    check_env
    check_network
    test_signaling_servers
    
    echo ""
    echo "🤔 What would you like to do?"
    echo "1) Fix environment configuration automatically"
    echo "2) Restart Next.js to reload environment variables"
    echo "3) Start local signaling server"
    echo "4) Show cross-platform testing guide"
    echo "5) Show debug information for developer"
    echo "6) Exit"
    
    read -p "Choose an option (1-6): " choice
    
    case $choice in
        1)
            fix_env_config
            ;;
        2)
            restart_nextjs
            ;;
        3)
            start_local_signaling
            ;;
        4)
            test_cross_platform
            ;;
        5)
            echo ""
            echo "📊 Debug Information for Developer:"
            echo "Copy this information when reporting issues:"
            echo "======================================"
            echo "OS: $(uname -s)"
            echo "Node: $(node --version 2>/dev/null || echo 'Not installed')"
            echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
            echo "Current directory: $(pwd)"
            echo "Environment variables:"
            env | grep -E "(SIGNALING|NODE_ENV|PORT)" | sort
            echo "Network interfaces:"
            ifconfig 2>/dev/null | grep -E "(inet|en0|eth0)" | head -5
            echo "Next.js processes:"
            pgrep -f "next" | wc -l || echo "0"
            echo "======================================"
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            ;;
    esac
}

# Run main function
main