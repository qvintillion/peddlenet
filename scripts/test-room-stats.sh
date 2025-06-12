#!/bin/bash

# 🔍 Room Stats Diagnostic Tool
# Tests the /room-stats endpoint across different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔍 Room Stats Endpoint Diagnostic${NC}"
echo -e "${BLUE}==================================${NC}"

# Test room ID
TEST_ROOM_ID="main-stage-chat"

echo ""
echo -e "${BLUE}🧪 Testing room stats endpoint...${NC}"
echo -e "${YELLOW}Room ID: ${TEST_ROOM_ID}${NC}"

# Test local server
echo ""
echo -e "${YELLOW}1️⃣ Testing localhost server:${NC}"
LOCAL_URL="http://localhost:3001/room-stats/${TEST_ROOM_ID}"
echo -e "${BLUE}URL: ${LOCAL_URL}${NC}"

if curl -s -f -m 10 "$LOCAL_URL" > /tmp/local_response.json 2>/dev/null; then
    echo -e "${GREEN}✅ Local server responded${NC}"
    echo -e "${BLUE}Response:${NC}"
    cat /tmp/local_response.json | jq '.' 2>/dev/null || cat /tmp/local_response.json
else
    echo -e "${RED}❌ Local server failed or not running${NC}"
fi

# Test staging server  
echo ""
echo -e "${YELLOW}2️⃣ Testing staging server:${NC}"
STAGING_URL="https://peddlenet-websocket-server-staging-433318323150.us-central1.run.app/room-stats/${TEST_ROOM_ID}"
echo -e "${BLUE}URL: ${STAGING_URL}${NC}"

if curl -s -f -m 10 "$STAGING_URL" > /tmp/staging_response.json 2>/dev/null; then
    echo -e "${GREEN}✅ Staging server responded${NC}"
    echo -e "${BLUE}Response:${NC}"
    cat /tmp/staging_response.json | jq '.' 2>/dev/null || cat /tmp/staging_response.json
else
    echo -e "${RED}❌ Staging server failed${NC}"
    echo -e "${YELLOW}Trying with verbose output:${NC}"
    curl -v -f -m 10 "$STAGING_URL" 2>&1 | head -20
fi

# Test preview server
echo ""
echo -e "${YELLOW}3️⃣ Testing preview server:${NC}"
PREVIEW_URL="https://peddlenet-websocket-server-preview-433318323150.us-central1.run.app/room-stats/${TEST_ROOM_ID}"
echo -e "${BLUE}URL: ${PREVIEW_URL}${NC}"

if curl -s -f -m 10 "$PREVIEW_URL" > /tmp/preview_response.json 2>/dev/null; then
    echo -e "${GREEN}✅ Preview server responded${NC}"
    echo -e "${BLUE}Response:${NC}"
    cat /tmp/preview_response.json | jq '.' 2>/dev/null || cat /tmp/preview_response.json
else
    echo -e "${RED}❌ Preview server failed${NC}"
    echo -e "${YELLOW}Trying with verbose output:${NC}"
    curl -v -f -m 10 "$PREVIEW_URL" 2>&1 | head -20
fi

# Test health endpoints
echo ""
echo -e "${YELLOW}4️⃣ Testing health endpoints:${NC}"

echo ""
echo -e "${BLUE}Local health:${NC}"
curl -s -f "http://localhost:3001/health" 2>/dev/null | jq '.status' 2>/dev/null || echo "Failed"

echo ""
echo -e "${BLUE}Staging health:${NC}"
curl -s -f "https://peddlenet-websocket-server-staging-433318323150.us-central1.run.app/health" 2>/dev/null | jq '.status' 2>/dev/null || echo "Failed"

echo ""
echo -e "${BLUE}Preview health:${NC}"
curl -s -f "https://peddlenet-websocket-server-preview-433318323150.us-central1.run.app/health" 2>/dev/null | jq '.status' 2>/dev/null || echo "Failed"

# Test with different room IDs
echo ""
echo -e "${YELLOW}5️⃣ Testing with different room IDs:${NC}"

TEST_ROOMS=("main-stage-chat" "food-court-meetup" "lost-found" "nonexistent-room")

for room in "${TEST_ROOMS[@]}"; do
    echo ""
    echo -e "${BLUE}Testing room: ${room}${NC}"
    if curl -s -f -m 5 "http://localhost:3001/room-stats/${room}" > /tmp/test_response.json 2>/dev/null; then
        ACTIVE_USERS=$(cat /tmp/test_response.json | jq '.activeUsers' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ ${room}: ${ACTIVE_USERS} active users${NC}"
    else
        echo -e "${RED}❌ ${room}: Failed${NC}"
    fi
done

# Clean up temp files
rm -f /tmp/local_response.json /tmp/staging_response.json /tmp/preview_response.json /tmp/test_response.json

echo ""
echo -e "${PURPLE}🔧 Next Steps:${NC}"
echo -e "${YELLOW}1. If local works but staging/preview fail:${NC}"
echo -e "${YELLOW}   - Check if Cloud Run servers are running the correct version${NC}"
echo -e "${YELLOW}   - Verify CORS configuration${NC}"
echo -e "${YELLOW}2. If all fail:${NC}"
echo -e "${YELLOW}   - Check if signaling server is running${NC}"
echo -e "${YELLOW}   - Verify the endpoint exists in current server code${NC}"
echo -e "${YELLOW}3. Test in browser console:${NC}"
echo -e "${YELLOW}   - ServerUtils.getHttpServerUrl()${NC}"
echo -e "${YELLOW}   - fetch(\`\${ServerUtils.getHttpServerUrl()}/room-stats/main-stage-chat\`)${NC}"

echo ""
echo -e "${GREEN}✅ Room stats diagnostic complete!${NC}"
