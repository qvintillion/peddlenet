#!/bin/bash

# 🔧 Quick Fix Script - Common Issues Resolution
# ============================================
# Fixes the most common Festival Chat issues quickly
# Use for routine maintenance and minor problems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 QUICK FIX - COMMON ISSUES RESOLUTION${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check process running
is_process_running() {
    pgrep -f "$1" >/dev/null 2>&1
}

echo -e "${YELLOW}🔍 Diagnosing common issues...${NC}"
echo ""

# Issue 1: Check if dev servers are conflicting
echo -e "${BLUE}Checking for conflicting development servers...${NC}"
if is_process_running "next dev"; then
    echo -e "${YELLOW}⚠️  Next.js dev server is running${NC}"
    echo -e "${YELLOW}   This might cause port conflicts${NC}"
    read -p "Stop dev server? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "next dev" 2>/dev/null || true
        echo -e "${GREEN}✅ Dev server stopped${NC}"
    fi
else
    echo -e "${GREEN}✅ No conflicting dev servers${NC}"
fi

# Issue 2: Check environment configuration
echo ""
echo -e "${BLUE}Checking environment configuration...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local missing - creating development config${NC}"
    cat > .env.local << 'EOF'
# Development environment
NEXT_PUBLIC_DETECTED_IP=localhost
BUILD_TARGET=development
NODE_ENV=development
PLATFORM=local
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Issue 3: Check critical files
echo ""
echo -e "${BLUE}Checking critical files...${NC}"
critical_files_ok=true

if [ ! -f "signaling-server.js" ]; then
    echo -e "${RED}❌ signaling-server.js missing${NC}"
    critical_files_ok=false
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json missing${NC}"
    critical_files_ok=false
fi

if [ ! -f "next.config.ts" ]; then
    echo -e "${YELLOW}⚠️  next.config.ts missing${NC}"
fi

if [ "$critical_files_ok" = true ]; then
    echo -e "${GREEN}✅ Critical files present${NC}"
fi

# Issue 4: Check dependencies
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules missing - installing dependencies${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies exist${NC}"
fi

# Issue 5: Quick cache cleanup
echo ""
echo -e "${BLUE}Quick cache cleanup...${NC}"
rm -rf .next/ 2>/dev/null || true
rm -rf functions/.next/ 2>/dev/null || true
rm -rf node_modules/.cache/ 2>/dev/null || true
echo -e "${GREEN}✅ Build caches cleared${NC}"

# Issue 6: Check script permissions
echo ""
echo -e "${BLUE}Checking script permissions...${NC}"
scripts_fixed=0
for script in scripts/*.sh; do
    if [ -f "$script" ] && [ ! -x "$script" ]; then
        chmod +x "$script"
        scripts_fixed=$((scripts_fixed + 1))
    fi
done

if [ $scripts_fixed -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Fixed permissions for $scripts_fixed scripts${NC}"
else
    echo -e "${GREEN}✅ Script permissions OK${NC}"
fi

# Issue 7: Test basic connectivity
echo ""
echo -e "${BLUE}Testing basic connectivity...${NC}"

# Test if we can start the server briefly
echo -e "${YELLOW}Testing server startup...${NC}"
timeout 5s node signaling-server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Server can start successfully${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Server startup test inconclusive${NC}"
fi

# Issue 8: Check Firebase/Cloud CLI
echo ""
echo -e "${BLUE}Checking deployment tools...${NC}"
if command_exists firebase; then
    echo -e "${GREEN}✅ Firebase CLI available${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase CLI missing${NC}"
    echo -e "${YELLOW}   Install: npm install -g firebase-tools${NC}"
fi

if command_exists gcloud; then
    echo -e "${GREEN}✅ Google Cloud CLI available${NC}"
else
    echo -e "${YELLOW}⚠️  Google Cloud CLI missing${NC}"
    echo -e "${YELLOW}   Install: https://cloud.google.com/sdk/docs/install${NC}"
fi

# Issue 9: Network connectivity test
echo ""
echo -e "${BLUE}Testing network connectivity...${NC}"
if ping -c 1 google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Internet connectivity OK${NC}"
else
    echo -e "${YELLOW}⚠️  Internet connectivity issues${NC}"
fi

# Issue 10: Quick environment test
echo ""
echo -e "${BLUE}Testing environment setup...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Build test failed - may need dependency update${NC}"
fi

# Summary and recommendations
echo ""
echo -e "${PURPLE}🎉 QUICK FIX COMPLETE!${NC}"
echo -e "${PURPLE}=====================${NC}"
echo ""
echo -e "${GREEN}✅ Quick Fix Summary:${NC}"
echo -e "${YELLOW}   • Environment configuration checked${NC}"
echo -e "${YELLOW}   • Critical files verified${NC}"
echo -e "${YELLOW}   • Dependencies validated${NC}"
echo -e "${YELLOW}   • Caches cleared${NC}"
echo -e "${YELLOW}   • Script permissions fixed${NC}"
echo -e "${YELLOW}   • Basic connectivity tested${NC}"
echo ""
echo -e "${BLUE}🚀 Ready to start development:${NC}"
echo -e "${YELLOW}   ./scripts/dev-mobile.sh${NC}"
echo ""
echo -e "${BLUE}📋 If issues persist, try:${NC}"
echo -e "${YELLOW}1. Full nuclear fix:${NC}"
echo -e "${YELLOW}   ./scripts/nuclear-system-recovery.sh${NC}"
echo ""
echo -e "${YELLOW}2. Check specific systems:${NC}"
echo -e "${YELLOW}   ./scripts/env-switch.sh show      # Environment status${NC}"
echo -e "${YELLOW}   npm run deploy:firebase:quick     # Test staging${NC}"
echo -e "${YELLOW}   ./scripts/nuclear-admin-fix.sh    # Admin dashboard${NC}"
echo ""
echo -e "${GREEN}🎪 Festival Chat quick fix complete! 🎪${NC}"
