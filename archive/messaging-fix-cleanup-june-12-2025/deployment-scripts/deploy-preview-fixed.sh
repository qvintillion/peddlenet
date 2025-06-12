#!/bin/bash

# 🎪 Festival Chat - Fixed Preview Deploy
# Ensures environment variables are properly embedded in the build

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
DEFAULT_CHANNEL="fixed-$(date +%Y%m%d-%H%M)"
EXPIRES="7d"

echo -e "${PURPLE}🎪 Festival Chat Fixed Preview Deploy${NC}"
echo -e "${BLUE}====================================${NC}"

# Get channel name from user or use default
if [ -z "$1" ]; then
    CHANNEL_ID="$DEFAULT_CHANNEL"
    echo -e "${YELLOW}📋 Using default channel ID: ${CHANNEL_ID}${NC}"
else
    CHANNEL_ID="$1"
    echo -e "${GREEN}📋 Using provided channel ID: ${CHANNEL_ID}${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Checking preview environment...${NC}"

# Verify .env.preview exists
if [ ! -f ".env.preview" ]; then
    echo -e "${RED}❌ No .env.preview found!${NC}"
    echo -e "${RED}   This is required for preview deployment.${NC}"
    exit 1
fi

# Display preview environment
echo -e "${GREEN}📋 Preview environment (.env.preview):${NC}"
cat .env.preview
echo ""

# Get the preview server URL
PREVIEW_SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.preview | cut -d'=' -f2)
echo -e "${GREEN}🎯 Target server: ${PREVIEW_SERVER_URL}${NC}"

# Backup current environment
echo ""
echo -e "${YELLOW}💾 Backing up current environment...${NC}"
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.preview 2>/dev/null || true
    echo -e "${GREEN}✅ Backed up .env.local${NC}"
fi

# Cache bust - clear everything to ensure fresh build
echo ""
echo -e "${YELLOW}🧹 Complete cache bust...${NC}"
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf .firebase/
echo -e "${GREEN}✅ All caches cleared${NC}"

# Set up preview environment for build
echo ""
echo -e "${BLUE}🏗️ Setting up preview environment for build...${NC}"
cp .env.preview .env.local

# Verify environment is set correctly
echo -e "${YELLOW}📝 Verifying .env.local for build:${NC}"
cat .env.local
echo ""

# Build with explicit environment variables to ensure they're embedded
echo -e "${BLUE}🚀 Building with explicit environment variables...${NC}"
echo -e "${YELLOW}NEXT_PUBLIC_SIGNALING_SERVER=${PREVIEW_SERVER_URL}${NC}"
echo -e "${YELLOW}BUILD_TARGET=preview${NC}"

# Build with environment variables explicitly set
NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL" \
BUILD_TARGET="preview" \
NODE_ENV="production" \
npm run build

# Keep the environment for Firebase Functions build
echo ""
echo -e "${BLUE}🔧 Building Firebase Functions with preview environment...${NC}"
cd functions
npm run build
cd ..

# Verify the build contains the correct URL
echo ""
echo -e "${YELLOW}🔍 Verifying build contains preview server URL...${NC}"
if grep -r "peddlenet-websocket-server-preview" .next/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Found preview server URL in build${NC}"
    echo -e "${BLUE}Preview URL references:${NC}"
    grep -r "peddlenet-websocket-server-preview" .next/ | head -3
else
    echo -e "${RED}❌ Preview server URL NOT found in build!${NC}"
    echo -e "${YELLOW}Searching for any signaling server URLs in build...${NC}"
    grep -r "NEXT_PUBLIC_SIGNALING_SERVER\|peddlenet-websocket-server" .next/ | head -5 || echo "No URLs found"
    echo ""
    echo -e "${RED}BUILD FAILED: Environment variables not properly embedded${NC}"
    exit 1
fi

# Also verify in functions build
if [ -d "functions/.next" ]; then
    echo ""
    echo -e "${YELLOW}🔍 Verifying functions build contains preview server URL...${NC}"
    if grep -r "peddlenet-websocket-server-preview" functions/.next/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Found preview server URL in functions build${NC}"
    else
        echo -e "${RED}❌ Preview server URL NOT found in functions build!${NC}"
        grep -r "NEXT_PUBLIC_SIGNALING_SERVER\|peddlenet-websocket-server" functions/.next/ | head -3 || echo "No URLs found"
    fi
fi

# Deploy to Firebase while keeping the preview environment
echo ""
echo -e "${BLUE}🚀 Deploying to Firebase preview channel...${NC}"
echo -e "${YELLOW}Note: Keeping preview environment during deployment${NC}"

# Deploy with the current environment still active
DEPLOY_OUTPUT=$(firebase hosting:channel:deploy "$CHANNEL_ID" \
    --project "$PROJECT_ID" \
    --expires "$EXPIRES" 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract the preview URL from the output
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*' | head -1)

# Now restore original environment
echo ""
echo -e "${BLUE}🔄 Restoring original environment...${NC}"
if [ -f ".env.local.backup.preview" ]; then
    mv .env.local.backup.preview .env.local
    echo -e "${GREEN}✅ Restored original .env.local${NC}"
else
    # If no backup, remove the preview env from .env.local
    rm -f .env.local
    echo -e "${YELLOW}⚠️  No backup found - cleared .env.local${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Fixed preview deployment completed!${NC}"
echo -e "${BLUE}📋 Channel ID: ${CHANNEL_ID}${NC}"
echo -e "${BLUE}⏰ Expires: ${EXPIRES} from now${NC}"
echo -e "${BLUE}🎯 Should connect to: ${PREVIEW_SERVER_URL}${NC}"

if [ -n "$PREVIEW_URL" ]; then
    echo ""
    echo -e "${GREEN}🔗 PREVIEW URL:${NC}"
    echo -e "${YELLOW}${PREVIEW_URL}${NC}"
    echo ""
    
    # Copy URL to clipboard
    echo -n "$PREVIEW_URL" | pbcopy 2>/dev/null && echo -e "${GREEN}✅ URL copied to clipboard!${NC}" || echo -e "${YELLOW}⚠️  Copy the URL manually${NC}"
    
    echo ""
    echo -e "${PURPLE}🔐 HOW TO ACCESS:${NC}"
    echo -e "${BLUE}===============${NC}"
    echo ""
    echo -e "${YELLOW}1. Open browser and sign into th3p3ddl3r@gmail.com${NC}"
    echo -e "${YELLOW}2. Paste URL: ${PREVIEW_URL}${NC}"
    echo -e "${YELLOW}3. Open browser console (F12) to verify connection${NC}"
    echo -e "${YELLOW}4. Look for: 'Using production HTTP URL: https://peddlenet-websocket-server-preview-433318323150.us-central1.run.app'${NC}"
    echo ""
    echo -e "${GREEN}✅ If you see 'preview' in the URL, the fix worked!${NC}"
    echo -e "${RED}❌ If you see 'padyxgyv5a-uc.a.run.app', there's still an issue${NC}"
    
else
    echo -e "${YELLOW}⚠️  Could not extract preview URL from output${NC}"
    echo -e "${YELLOW}Check the deployment output above for the URL${NC}"
fi

echo ""
echo -e "${PURPLE}🛠️ Management Commands:${NC}"
echo -e "${YELLOW}List channels:${NC} firebase hosting:channel:list --project $PROJECT_ID"
echo -e "${YELLOW}Delete channel:${NC} firebase hosting:channel:delete $CHANNEL_ID --project $PROJECT_ID"
echo ""
echo -e "${GREEN}✅ Fixed preview deployment complete!${NC}"
echo -e "${BLUE}💡 This script ensures environment variables are properly embedded in the build${NC}"
