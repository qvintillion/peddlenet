#!/bin/bash

echo "🎯 SIMPLE SSR FIX: Set Firebase environment and redeploy"
echo "======================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m' 
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Setting preview server URL in Firebase Functions...${NC}"

# Set environment variable for Firebase Functions runtime
firebase functions:config:set \
  next_public.signaling_server="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
  --project "festival-chat-peddlenet"

echo -e "${GREEN}✅ Firebase Functions environment configured${NC}"

echo ""
echo -e "${YELLOW}🚀 Redeploying functions with new environment...${NC}"

# Redeploy functions to pick up new environment
firebase deploy --only functions --project "festival-chat-peddlenet"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${YELLOW}The preview environment should now use the correct server URL${NC}"
