#!/bin/bash

echo "🧨 NUCLEAR BUILD: Force clean preview deployment"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Step 1: Nuclear clean everything...${NC}"
rm -rf .next/
rm -rf .firebase/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/
echo -e "${GREEN}✅ All caches nuked${NC}"

echo ""
echo -e "${YELLOW}📋 Step 2: Verify environment...${NC}"
echo "Current .env.preview:"
cat .env.preview

echo ""
echo "Current .env.local:"
cat .env.local

echo ""
echo "❌ PROBLEM: .env.production contains production server URL!"
echo "Current .env.production:"
cat .env.production

echo ""
echo -e "${YELLOW}🔧 Step 3: Temporarily disable .env.production...${NC}"
mv .env.production .env.production.disabled
echo -e "${GREEN}✅ Moved .env.production to .env.production.disabled${NC}"

echo ""
echo -e "${YELLOW}🔧 Step 4: Set explicit environment for build...${NC}"
export NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app"
export BUILD_TARGET="preview"

echo "Set NEXT_PUBLIC_SIGNALING_SERVER=$NEXT_PUBLIC_SIGNALING_SERVER"
echo "Set BUILD_TARGET=$BUILD_TARGET"

echo ""
echo -e "${YELLOW}🏗️ Step 5: Build with explicit environment...${NC}"
NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
BUILD_TARGET="preview" \
npm run build

echo ""
echo -e "${YELLOW}🔍 Step 6: Verify build contains correct URL...${NC}"
if grep -r "preview-433318323150" .next/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Preview server URL found in build!${NC}"
else
    echo -e "${RED}❌ Preview server URL NOT found in build${NC}"
    echo "Searching for any peddlenet URLs..."
    grep -r "peddlenet" .next/ | head -3 || echo "No peddlenet URLs found"
fi

# Check what URL is actually in the build
echo ""
echo -e "${YELLOW}🔍 Step 7: What server URL is actually in the build?${NC}"
if grep -r "padyxgyv5a" .next/ >/dev/null 2>&1; then
    echo -e "${RED}❌ STILL FOUND PRODUCTION URL IN BUILD!${NC}"
else
    echo -e "${GREEN}✅ No production URL found in build${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Step 8: Deploy to Firebase...${NC}"
CHANNEL_NAME="nuclear-fix-$(date +%H%M)"
echo "Deploying to channel: $CHANNEL_NAME"

firebase hosting:channel:deploy "$CHANNEL_NAME" \
    --project "festival-chat-peddlenet" \
    --expires "2h"

echo ""
echo -e "${YELLOW}🔄 Step 9: Restore .env.production...${NC}"
mv .env.production.disabled .env.production
echo -e "${GREEN}✅ Restored .env.production${NC}"

echo ""
echo -e "${GREEN}🎉 Nuclear deployment complete!${NC}"
echo -e "${YELLOW}Test the preview URL and check console for correct server URL${NC}"
