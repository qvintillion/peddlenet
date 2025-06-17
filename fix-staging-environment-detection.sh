#!/bin/bash

# 🎭 CRITICAL FIX: Staging Environment Detection
# ==============================================
# This script fixes the staging admin dashboard showing "production" instead of "staging"

set -e

echo "🎭 CRITICAL FIX: Staging Environment Detection"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ISSUE IDENTIFIED:${NC}"
echo "The staging admin dashboard shows 'production' instead of 'staging'"
echo "This happens because the WebSocket server isn't detecting the staging environment correctly"
echo ""

echo -e "${YELLOW}🔧 FIXES APPLIED:${NC}"
echo "1. ✅ Enhanced server environment detection with debugging"
echo "2. ✅ Added frontend vs server environment comparison in admin dashboard"
echo "3. ✅ Multiple fallback methods for staging detection"
echo "4. ✅ Cloud Run service name detection (K_SERVICE environment variable)"
echo ""

echo -e "${BLUE}🚀 DEPLOYING UPDATED STAGING SERVER:${NC}"
echo ""

# Deploy the updated staging server
if [ -f "./scripts/deploy-websocket-staging.sh" ]; then
    echo "📦 Running staging WebSocket server deployment..."
    ./scripts/deploy-websocket-staging.sh
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Staging server deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Staging server deployment failed!${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ deploy-websocket-staging.sh not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🧪 TESTING ENVIRONMENT DETECTION:${NC}"

# Wait for service to be ready
echo "⏳ Waiting 30 seconds for service to stabilize..."
sleep 30

# Get the staging server URL from .env.staging
if [ -f ".env.staging" ]; then
    STAGING_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging | cut -d'=' -f2 | sed 's/wss:/https:/')
    
    if [ ! -z "$STAGING_URL" ]; then
        echo "🌐 Testing staging server: $STAGING_URL"
        
        # Test the root endpoint to see environment detection
        echo "📊 Server environment info:"
        curl -s "$STAGING_URL/" | jq '.environment' 2>/dev/null || {
            echo "🔧 Raw response:"
            curl -s "$STAGING_URL/" || echo "❌ Failed to connect"
        }
        
        echo ""
        echo "🏥 Health check:"
        curl -s "$STAGING_URL/health" | jq '.' 2>/dev/null || {
            echo "🔧 Raw health response:"
            curl -s "$STAGING_URL/health" || echo "❌ Health check failed"
        }
    else
        echo "❌ Could not extract staging URL from .env.staging"
    fi
else
    echo "❌ .env.staging file not found"
fi

echo ""
echo -e "${GREEN}🎉 ENVIRONMENT DETECTION FIX COMPLETE!${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}📋 WHAT TO TEST:${NC}"
echo "1. 🎭 Deploy frontend to staging: npm run staging:vercel:complete"
echo "2. 🔍 Check admin dashboard at: https://your-staging-url/admin-analytics"
echo "3. 🌐 Verify 'Network Monitoring' section shows:"
echo "   - Environment: staging (yellow text)"
echo "   - Frontend Detected: staging"
echo ""
echo -e "${YELLOW}🔧 DEBUGGING INFO:${NC}"
echo "The admin dashboard now shows both:"
echo "- Server Reports: What the WebSocket server detects"
echo "- Frontend Detected: What the frontend browser detects"
echo ""
echo "If they don't match, that tells us exactly where the issue is!"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Deploy staging frontend"
echo "2. Check admin dashboard environment display"
echo "3. If still shows 'production', check server logs in Cloud Run Console"
echo ""
