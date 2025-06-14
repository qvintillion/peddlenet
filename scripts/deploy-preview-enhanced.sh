#!/bin/bash

# 🎪 Festival Chat - Enhanced Preview Deploy with Better URL Detection
# Fixed URL extraction and better debugging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="festival-chat-peddlenet"
DEFAULT_CHANNEL="preview-$(date +%Y%m%d-%H%M)"
EXPIRES="7d"

echo -e "${PURPLE}🎪 Festival Chat Enhanced Preview Deploy${NC}"
echo -e "${BLUE}=====================================${NC}"

# SAFETY: Check if dev server is running and warn user
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ WARNING: Development server running on port 3000${NC}"
    echo -e "${YELLOW}This may cause deployment conflicts and environment corruption.${NC}"
    echo -e "${RED}Strongly recommend closing dev server before preview deployment.${NC}"
    echo ""
    read -p "Stop dev server and continue? (y/N): " stop_dev
    
    if [[ $stop_dev =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🛑 Stopping development servers...${NC}"
        pkill -f "next dev" 2>/dev/null || true
        pkill -f "signaling-server" 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✅ Development servers stopped${NC}"
    else
        echo -e "${RED}❌ Preview deployment cancelled${NC}"
        echo -e "${YELLOW}💡 Close dev servers manually and retry${NC}"
        exit 1
    fi
fi

# SAFETY: Stop WebSocket server if running on dev port
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${BLUE}🛑 Stopping WebSocket development server...${NC}"
    pkill -f "signaling-server" 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ WebSocket server stopped${NC}"
fi

echo ""
if [ -z "$1" ]; then
    CHANNEL_ID="$DEFAULT_CHANNEL"
    echo -e "${YELLOW}📋 Using default channel ID: ${CHANNEL_ID}${NC}"
else
    CHANNEL_ID="$1"
    echo -e "${GREEN}📋 Using provided channel ID: ${CHANNEL_ID}${NC}"
fi

echo ""
echo -e "${BLUE}🏗️ Building project for Firebase with preview environment...${NC}"

# Backup current environment
echo -e "${YELLOW}💾 Backing up current environment...${NC}"
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.preview 2>/dev/null || true
    echo -e "${GREEN}✅ Backed up .env.local${NC}"
fi

# Copy preview environment variables for build
if [ -f ".env.preview" ]; then
    echo -e "${GREEN}📋 Using preview environment variables${NC}"
    echo -e "${YELLOW}📝 Preview .env.preview contents:${NC}"
    cat .env.preview
    echo ""
    
    cp .env.preview .env.local
    
    echo -e "${YELLOW}📝 Current .env.local after copy:${NC}"
    cat .env.local
    echo ""
    
    echo -e "${BLUE}🔧 Environment details:${NC}"
    echo -e "${YELLOW}   • WebSocket Server: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.preview | cut -d'=' -f2)${NC}"
    echo -e "${YELLOW}   • Build Target: preview${NC}"
else
    echo -e "${RED}❌ No .env.preview found!${NC}"
    echo -e "${RED}   This is required for preview deployment.${NC}"
    exit 1
fi

# Cache bust - clear builds to ensure fresh deployment with new environment
echo ""
echo -e "${YELLOW}🧹 NUCLEAR CACHE CLEARING...${NC}"
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/
rm -rf .firebase/

# Clear NPM cache
echo -e "${YELLOW}🗑️  Clearing npm cache...${NC}"
npm cache clean --force 2>/dev/null || true

# Clear Functions node modules cache if exists
if [ -d "functions/node_modules" ]; then
    echo -e "${YELLOW}🗑️  Clearing functions node_modules cache...${NC}"
    rm -rf functions/node_modules/.cache/
fi

# Firebase logout/login cycle to clear auth cache
echo -e "${YELLOW}🔄 Refreshing Firebase authentication...${NC}"
firebase logout --no-localhost 2>/dev/null || true
firebase login --no-localhost 2>/dev/null || true

echo -e "${GREEN}✅ NUCLEAR cache clearing complete${NC}"

echo ""
echo -e "${BLUE}🚀 Building with explicit environment variables...${NC}"

# Get the preview server URL from .env.preview
PREVIEW_SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.preview | cut -d'=' -f2)
echo -e "${GREEN}Using preview server: ${PREVIEW_SERVER_URL}${NC}"

# Build with explicit environment variable
export NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL"
export BUILD_TARGET="preview"

echo -e "${BLUE}Building with environment variable...${NC}"
echo "NEXT_PUBLIC_SIGNALING_SERVER: $NEXT_PUBLIC_SIGNALING_SERVER"
echo "BUILD_TARGET: $BUILD_TARGET"

NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL" BUILD_TARGET="preview" npm run build:firebase

# ENHANCED: Build verification
echo ""
echo -e "${BLUE}🔍 BUILD VERIFICATION${NC}"
echo -e "${BLUE}===================${NC}"

# Check if admin analytics page exists in build
if [ -f ".next/server/app/admin-analytics/page.js" ]; then
    echo -e "${GREEN}✅ Admin analytics page found in build${NC}"
else
    echo -e "${YELLOW}⚠️  Admin analytics page not found in build${NC}"
fi

# Check for environment detection in health route (it's minified)
if [ -f ".next/server/app/api/health/route.js" ]; then
    if grep -q "festival-chat-peddlenet.web.app" ".next/server/app/api/health/route.js" 2>/dev/null; then
        echo -e "${GREEN}✅ Environment detection code found in build (minified)${NC}"
    else
        echo -e "${YELLOW}⚠️  Environment detection code not found in health route${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Health route not found in build${NC}"
fi

# Check for the correct server URL (staging)
if grep -q "peddlenet-websocket-server-staging" ".next/server/app/api/health/route.js" 2>/dev/null; then
    echo -e "${GREEN}✅ Staging server URL found in build${NC}"
else
    echo -e "${YELLOW}⚠️  Staging server URL not found in build${NC}"
    echo -e "${YELLOW}Searching for any signaling server URLs...${NC}"
    grep -r "peddlenet-websocket-server" .next/ | head -3 || echo "No URLs found"
fi

# Verify the build
echo ""
echo -e "${YELLOW}🔍 Verifying build contains correct URL...${NC}"
if grep -r "peddlenet-websocket-server-staging" .next/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Found staging server URL in build${NC}"
else
    echo -e "${RED}❌ Staging server URL NOT found in build!${NC}"
    echo -e "${YELLOW}Searching for any signaling server URLs in build...${NC}"
    grep -r "peddlenet-websocket-server" .next/ | head -3 || echo "No URLs found"
fi

# Restore original environment
echo ""
echo -e "${BLUE}🔄 Restoring original environment...${NC}"
if [ -f ".env.local.backup.preview" ]; then
    mv .env.local.backup.preview .env.local
    echo -e "${GREEN}✅ Restored original .env.local${NC}"
else
    rm -f .env.local
    echo -e "${YELLOW}⚠️  No backup found - cleared .env.local${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Deploying to preview channel...${NC}"

# Clear Firebase cache
echo -e "${YELLOW}🧹 Clearing Firebase cache...${NC}"
rm -rf .firebase/
echo -e "${GREEN}✅ Firebase cache cleared${NC}"

# Create a temporary file to capture all output
TEMP_OUTPUT=$(mktemp)

echo -e "${BLUE}Running Firebase deployment...${NC}"

# Deploy and capture both stdout and stderr
if firebase hosting:channel:deploy "$CHANNEL_ID" \
    --project "$PROJECT_ID" \
    --expires "$EXPIRES" > "$TEMP_OUTPUT" 2>&1; then
    
    # Show the full output
    echo -e "${GREEN}📋 Firebase Deployment Output:${NC}"
    echo -e "${YELLOW}================================${NC}"
    cat "$TEMP_OUTPUT"
    echo -e "${YELLOW}================================${NC}"
    
    # Try multiple patterns to extract the URL
    echo ""
    echo -e "${BLUE}🔍 Searching for preview URL...${NC}"
    
    # Pattern 1: Look for "Channel URL" line
    PREVIEW_URL=$(grep -i "Channel URL" "$TEMP_OUTPUT" | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -z "$PREVIEW_URL" ]; then
        # Pattern 2: Look for any https URL with the project name
        PREVIEW_URL=$(grep -o "https://festival-chat-peddlenet--[^[:space:]]*" "$TEMP_OUTPUT" | head -1)
    fi
    
    if [ -z "$PREVIEW_URL" ]; then
        # Pattern 3: Look for any https URL in the output
        PREVIEW_URL=$(grep -o 'https://[^[:space:]]*\.web\.app[^[:space:]]*' "$TEMP_OUTPUT" | head -1)
    fi
    
    if [ -z "$PREVIEW_URL" ]; then
        # Pattern 4: Construct URL manually from channel ID
        PREVIEW_URL="https://festival-chat-peddlenet--${CHANNEL_ID}-$(date +%Y%m%d%H%M).web.app"
        echo -e "${YELLOW}⚠️  Could not extract URL from output, constructed: ${PREVIEW_URL}${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Preview deployment completed!${NC}"
    echo -e "${BLUE}📋 Channel ID: ${CHANNEL_ID}${NC}"
    echo -e "${BLUE}⏰ Expires: ${EXPIRES} from now${NC}"
    
    if [ -n "$PREVIEW_URL" ]; then
        echo ""
        echo -e "${GREEN}🔗 PREVIEW URL:${NC}"
        echo -e "${YELLOW}${PREVIEW_URL}${NC}"
        echo ""
        
        # Copy URL to clipboard
        echo -n "$PREVIEW_URL" | pbcopy 2>/dev/null && echo -e "${GREEN}✅ URL copied to clipboard!${NC}" || echo -e "${YELLOW}⚠️  Copy the URL manually${NC}"
        
        echo ""
        echo -e "${PURPLE}🔐 ACCESS INSTRUCTIONS:${NC}"
        echo -e "${BLUE}===================${NC}"
        echo ""
        echo -e "${YELLOW}1. Open browser (Chrome recommended)${NC}"
        echo -e "${YELLOW}2. Sign into th3p3ddl3r@gmail.com if needed${NC}"
        echo -e "${YELLOW}3. Visit: ${PREVIEW_URL}${NC}"
        echo -e "${YELLOW}4. Test admin dashboard: ${PREVIEW_URL}/admin-analytics${NC}"
        echo ""
        echo -e "${RED}📊 IMPORTANT: If you see OLD UI:${NC}"
        echo -e "${YELLOW}• Clear browser cache completely (Cmd+Shift+Delete)${NC}"
        echo -e "${YELLOW}• OR use Incognito/Private browsing mode${NC}"
        echo -e "${YELLOW}• OR hard refresh (Cmd+Shift+R / Ctrl+Shift+R)${NC}"
        echo -e "${YELLOW}• Check: Should show 'environment: staging' in admin dashboard${NC}"
        echo ""
        echo -e "${GREEN}✅ Preview should load without authentication issues!${NC}"
        echo ""
        echo -e "${BLUE}📱 MOBILE TESTING:${NC}"
        echo -e "${YELLOW}• Copy URL to phone: ${PREVIEW_URL}${NC}"
        echo -e "${YELLOW}• Ensure Google account is signed in on mobile${NC}"
        echo ""
        
        # Test the URL
        echo -e "${BLUE}🧪 Testing preview URL...${NC}"
        if curl -s --head "$PREVIEW_URL" | head -1 | grep -q "200 OK"; then
            echo -e "${GREEN}✅ Preview URL is responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Preview URL test failed (may need a moment to become available)${NC}"
        fi
        
    else
        echo -e "${RED}❌ Could not determine preview URL${NC}"
        echo -e "${YELLOW}Check Firebase Console for the preview channel:${NC}"
        echo -e "${YELLOW}https://console.firebase.google.com/project/$PROJECT_ID/hosting/main${NC}"
    fi
    
else
    echo -e "${RED}❌ Firebase deployment failed${NC}"
    echo -e "${YELLOW}📋 Error Output:${NC}"
    cat "$TEMP_OUTPUT"
fi

# Cleanup
rm -f "$TEMP_OUTPUT"

echo ""
echo -e "${PURPLE}🛠️ Management Commands:${NC}"
echo -e "${YELLOW}List channels:${NC} firebase hosting:channel:list --project $PROJECT_ID"
echo -e "${YELLOW}Delete channel:${NC} firebase hosting:channel:delete $CHANNEL_ID --project $PROJECT_ID"
echo -e "${YELLOW}View in console:${NC} https://console.firebase.google.com/project/$PROJECT_ID/hosting/main"
echo ""
echo -e "${GREEN}✅ Enhanced preview deployment complete!${NC}"
