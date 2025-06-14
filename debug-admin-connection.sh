#!/bin/bash

# PeddleNet Admin Connection Diagnostic Script
# Tests all admin endpoints to identify connection issues

echo "🔧 PeddleNet Admin Connection Diagnostic"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Admin credentials
USERNAME="th3p3ddl3r"
PASSWORD="letsmakeatrade"
AUTH_HEADER=$(echo -n "$USERNAME:$PASSWORD" | base64)

echo -e "${BLUE}Testing admin endpoints...${NC}"
echo ""

# Test 1: Check WebSocket server staging
echo -e "${YELLOW}1. Testing WebSocket server (staging):${NC}"
STAGING_URL="https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
echo "   URL: $STAGING_URL/admin/analytics"

curl -X GET "$STAGING_URL/admin/analytics" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -w "\n   Status: %{http_code} | Time: %{time_total}s\n" \
  -s --max-time 10 \
  -o /tmp/staging_response.json

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓ Connection successful${NC}"
    echo "   Response preview:"
    head -c 200 /tmp/staging_response.json | sed 's/^/     /'
    echo ""
else
    echo -e "   ${RED}✗ Connection failed${NC}"
fi

echo ""

# Test 2: Check WebSocket server production
echo -e "${YELLOW}2. Testing WebSocket server (production):${NC}"
PROD_URL="https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app"
echo "   URL: $PROD_URL/admin/analytics"

curl -X GET "$PROD_URL/admin/analytics" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -w "\n   Status: %{http_code} | Time: %{time_total}s\n" \
  -s --max-time 10 \
  -o /tmp/prod_response.json

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓ Connection successful${NC}"
    echo "   Response preview:"
    head -c 200 /tmp/prod_response.json | sed 's/^/     /'
    echo ""
else
    echo -e "   ${RED}✗ Connection failed${NC}"
fi

echo ""

# Test 3: Check if local server is running
echo -e "${YELLOW}3. Testing local server (if running):${NC}"
LOCAL_URL="http://localhost:3001"
echo "   URL: $LOCAL_URL/admin/analytics"

curl -X GET "$LOCAL_URL/admin/analytics" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -w "\n   Status: %{http_code} | Time: %{time_total}s\n" \
  -s --max-time 5 \
  -o /tmp/local_response.json

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓ Connection successful${NC}"
    echo "   Response preview:"
    head -c 200 /tmp/local_response.json | sed 's/^/     /'
    echo ""
else
    echo -e "   ${RED}✗ Connection failed (normal if not running locally)${NC}"
fi

echo ""

# Test 4: Check current environment
echo -e "${YELLOW}4. Environment Check:${NC}"
echo "   Current directory: $(pwd)"
echo "   Node environment: ${NODE_ENV:-'undefined'}"

if [ -f ".env.local" ]; then
    echo "   .env.local exists:"
    grep NEXT_PUBLIC_SIGNALING_SERVER .env.local | sed 's/^/     /' || echo "     No SIGNALING_SERVER found"
else
    echo -e "   ${RED}✗ .env.local not found${NC}"
fi

if [ -f ".env.staging" ]; then
    echo "   .env.staging exists:"
    grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | sed 's/^/     /' || echo "     No SIGNALING_SERVER found"
else
    echo -e "   ${RED}✗ .env.staging not found${NC}"
fi

if [ -f ".env.production" ]; then
    echo "   .env.production exists:"
    grep NEXT_PUBLIC_SIGNALING_SERVER .env.production | sed 's/^/     /' || echo "     No SIGNALING_SERVER found"
else
    echo -e "   ${RED}✗ .env.production not found${NC}"
fi

echo ""

# Test 5: DNS Resolution
echo -e "${YELLOW}5. DNS Resolution Check:${NC}"
echo "   Staging server:"
nslookup peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app | grep -A 2 "Name:" | sed 's/^/     /'

echo "   Production server:"
nslookup peddlenet-websocket-server-hfttiarlja-uc.a.run.app | grep -A 2 "Name:" | sed 's/^/     /'

echo ""

# Test 6: CORS Preflight
echo -e "${YELLOW}6. CORS Preflight Check:${NC}"
echo "   Testing OPTIONS request:"

curl -X OPTIONS "$STAGING_URL/admin/analytics" \
  -H "Origin: https://peddlenet.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -w "\n   Status: %{http_code} | Time: %{time_total}s\n" \
  -s --max-time 10 \
  -v 2>&1 | grep -E "(< |> )" | sed 's/^/     /'

echo ""
echo -e "${BLUE}Diagnostic complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. If staging/production servers fail: Check WebSocket server deployment"
echo "2. If CORS errors: Check server CORS configuration"  
echo "3. If authentication fails: Verify admin credentials in server"
echo "4. Check browser DevTools Network tab while attempting login"
echo "5. If all servers fail: Check if WebSocket server is deployed and running"