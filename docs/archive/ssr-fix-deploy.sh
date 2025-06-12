#!/bin/bash

echo "🎯 FIREBASE FUNCTIONS SSR FIX: Set runtime environment variables"
echo "=================================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🔍 DISCOVERY: Your app uses Firebase Functions SSR, not static hosting!${NC}"
echo -e "${YELLOW}This means environment variables are read at RUNTIME by the function.${NC}"
echo ""

echo -e "${YELLOW}🧹 Step 1: Nuclear clean everything...${NC}"
rm -rf .next/
rm -rf .firebase/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/
echo -e "${GREEN}✅ All caches nuked${NC}"

echo ""
echo -e "${YELLOW}🔧 Step 2: Set Firebase Function environment variables...${NC}"
echo "Setting NEXT_PUBLIC_SIGNALING_SERVER for Firebase Functions runtime..."

# Set the environment variable for Firebase Functions
firebase functions:config:set \
  app.signaling_server="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
  --project "festival-chat-peddlenet"

echo -e "${GREEN}✅ Firebase Function environment variable set${NC}"

echo ""
echo -e "${YELLOW}📋 Step 3: Create function-specific .env file...${NC}"
cat > functions/.env.local << EOF
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app
BUILD_TARGET=preview
EOF

echo "Created functions/.env.local:"
cat functions/.env.local
echo -e "${GREEN}✅ Functions environment file created${NC}"

echo ""
echo -e "${YELLOW}🔧 Step 4: Temporarily disable .env.production...${NC}"
if [ -f ".env.production" ]; then
    mv .env.production .env.production.disabled
    echo -e "${GREEN}✅ Moved .env.production to .env.production.disabled${NC}"
fi

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
fi

echo ""
echo -e "${YELLOW}📦 Step 7: Build Firebase Functions...${NC}"
cd functions
NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
npm run build
cd ..
echo -e "${GREEN}✅ Functions built${NC}"

echo ""
echo -e "${YELLOW}🚀 Step 8: Deploy everything to Firebase...${NC}"
CHANNEL_NAME="ssr-fix-$(date +%H%M)"
echo "Deploying to channel: $CHANNEL_NAME"

# Deploy both functions and hosting
firebase deploy --only functions,hosting:festival-chat-peddlenet:$CHANNEL_NAME \
    --project "festival-chat-peddlenet"

echo ""
echo -e "${YELLOW}🔄 Step 9: Restore .env.production...${NC}"
if [ -f ".env.production.disabled" ]; then
    mv .env.production.disabled .env.production
    echo -e "${GREEN}✅ Restored .env.production${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SSR deployment complete!${NC}"
echo -e "${BLUE}💡 The environment variable is now set in Firebase Functions runtime${NC}"
echo -e "${YELLOW}Test the preview URL and check console for correct server URL${NC}"
