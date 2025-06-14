#!/bin/bash

# 🚀 NUCLEAR CACHE BUSTING ENVIRONMENT FIX DEPLOYMENT - FIXED
# Forces a completely fresh deployment with cache busting (preserves Firebase Functions)

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CURRENT_TIME=$(date +%Y%m%d-%H%M%S)
UNIQUE_VERSION="v4.5.0-env-fix-${CURRENT_TIME}"
CHANNEL_ID="env-fix-${CURRENT_TIME}"

echo -e "${BLUE}🚀 NUCLEAR CACHE BUSTING ENVIRONMENT FIX - FIXED${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""
echo -e "${GREEN}🎯 Target: Fix environment detection and admin dashboard version${NC}"
echo -e "${GREEN}📋 Version: ${UNIQUE_VERSION}${NC}"
echo -e "${GREEN}🌊 Channel: ${CHANNEL_ID}${NC}"
echo ""

# Kill all dev processes
echo -e "${YELLOW}🛑 Stopping all development processes...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "signaling-server" 2>/dev/null || true
sleep 2

# Nuclear cache clearing
echo -e "${YELLOW}💥 NUCLEAR CACHE CLEARING...${NC}"
rm -rf .next/
rm -rf .firebase/
rm -rf node_modules/.cache/
rm -rf out/
rm -rf dist/

# Update the admin dashboard with unique version
echo -e "${BLUE}🔧 Updating admin dashboard with unique version...${NC}"

# Create a temporary version of the admin page with dynamic version
ADMIN_PAGE="src/app/admin-analytics/page.tsx"
ADMIN_BACKUP="backup/admin-analytics-page-backup-${CURRENT_TIME}.tsx"

# Backup current version
cp "$ADMIN_PAGE" "$ADMIN_BACKUP"

# Update the version string in the footer dynamically
sed -i.bak "s/PeddleNet Admin Dashboard v4\.5\.0-env-fix/PeddleNet Admin Dashboard ${UNIQUE_VERSION}/g" "$ADMIN_PAGE"

echo -e "${GREEN}✅ Updated admin dashboard version to: ${UNIQUE_VERSION}${NC}"

# Set staging environment
if [ -f ".env.staging" ]; then
    echo -e "${BLUE}📋 Using staging environment:${NC}"
    cp .env.local .env.local.backup.nuclear 2>/dev/null || true
    cp .env.staging .env.local
    cat .env.staging
    echo ""
else
    echo -e "${RED}❌ .env.staging not found!${NC}"
    exit 1
fi

# Build with explicit environment variables and cache busting
echo -e "${BLUE}🚀 Building with environment detection and cache busting...${NC}"

SIGNALING_SERVER=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | cut -d'=' -f2)
BUILD_TARGET="staging"
NODE_ENV="production"

echo -e "${YELLOW}🔧 Build Configuration:${NC}"
echo -e "${YELLOW}   NEXT_PUBLIC_SIGNALING_SERVER: $SIGNALING_SERVER${NC}"
echo -e "${YELLOW}   BUILD_TARGET: $BUILD_TARGET${NC}"
echo -e "${YELLOW}   NODE_ENV: $NODE_ENV${NC}"
echo -e "${YELLOW}   VERSION: $UNIQUE_VERSION${NC}"
echo -e "${YELLOW}   CACHE_BUST: $CURRENT_TIME${NC}"
echo ""

# Build with all environment variables
NEXT_PUBLIC_SIGNALING_SERVER="$SIGNALING_SERVER" \
  BUILD_TARGET="$BUILD_TARGET" \
  NODE_ENV="$NODE_ENV" \
  VERSION="$UNIQUE_VERSION" \
  CACHE_BUST_TIMESTAMP="$CURRENT_TIME" \
  npm run build:firebase

# Verify build contains new version
echo -e "${YELLOW}🔍 Verifying build contains new version...${NC}"
if grep -r "$UNIQUE_VERSION" .next/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Found $UNIQUE_VERSION in build${NC}"
else
    echo -e "${RED}❌ $UNIQUE_VERSION NOT found in build!${NC}"
    echo -e "${YELLOW}Searching for version strings in build...${NC}"
    grep -r "PeddleNet Admin Dashboard" .next/ | head -5 || echo "No version strings found"
fi

# Deploy to Firebase with CORRECT configuration (preserve Functions)
echo -e "${BLUE}🚀 Deploying to Firebase with Functions support...${NC}"

# Create temporary firebase.json with cache-busting headers but preserve Functions
FIREBASE_BACKUP="firebase.json.backup.${CURRENT_TIME}"
cp firebase.json "$FIREBASE_BACKUP"

cat > firebase.json << EOF
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "function": "nextjsFunc"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          },
          {
            "key": "Pragma",
            "value": "no-cache"
          },
          {
            "key": "Expires",
            "value": "0"
          },
          {
            "key": "X-Cache-Bust",
            "value": "$CURRENT_TIME"
          },
          {
            "key": "X-Version",
            "value": "$UNIQUE_VERSION"
          }
        ]
      }
    ]
  },
  "functions": {
    "runtime": "nodejs20",
    "source": "functions"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
EOF

# Deploy with no-cache but proper Functions configuration
TEMP_OUTPUT=$(mktemp)

if firebase hosting:channel:deploy "$CHANNEL_ID" \
    --project "festival-chat-peddlenet" \
    --expires "4h" > "$TEMP_OUTPUT" 2>&1; then
    
    cat "$TEMP_OUTPUT"
    
    # Extract URL
    PREVIEW_URL=$(grep -o "https://festival-chat-peddlenet--[^[:space:]]*" "$TEMP_OUTPUT" | head -1)
    
    if [ -z "$PREVIEW_URL" ]; then
        PREVIEW_URL="https://festival-chat-peddlenet--${CHANNEL_ID}-$(date +%Y%m%d%H%M).web.app"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 NUCLEAR CACHE-BUSTED DEPLOYMENT SUCCESS!${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
    echo -e "${GREEN}🔗 FRESH URL (NO CACHE):${NC}"
    echo -e "${YELLOW}${PREVIEW_URL}${NC}"
    echo ""
    
    echo -n "$PREVIEW_URL" | pbcopy 2>/dev/null && echo -e "${GREEN}✅ URL copied to clipboard!${NC}"
    
    echo ""
    echo -e "${BLUE}🎯 VERIFICATION CHECKLIST:${NC}"
    echo -e "${YELLOW}1. Visit: ${PREVIEW_URL}${NC}"
    echo -e "${YELLOW}2. Then: ${PREVIEW_URL}/admin-analytics${NC}"
    echo -e "${YELLOW}3. Open Inspector Network tab${NC}"
    echo -e "${YELLOW}4. Hard refresh (Cmd+Shift+R)${NC}"
    echo -e "${YELLOW}5. Login: th3p3ddl3r / letsmakeatrade${NC}"
    echo -e "${YELLOW}6. Check footer version (should be ${UNIQUE_VERSION})${NC}"
    echo -e "${YELLOW}7. Verify headers show X-Version: ${UNIQUE_VERSION}${NC}"
    echo ""
    
    echo -e "${GREEN}🔍 Environment Detection Debug:${NC}"
    echo -e "${YELLOW}• Open browser console${NC}"
    echo -e "${YELLOW}• Look for '🔧 Environment detection' logs${NC}"
    echo -e "${YELLOW}• Verify WebSocket server URL is staging${NC}"
    echo -e "${YELLOW}• Check environment shows 'staging'${NC}"
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    cat "$TEMP_OUTPUT"
fi

# Restore files
echo -e "${BLUE}🔄 Restoring original files...${NC}"

# Restore admin page
mv "$ADMIN_PAGE.bak" "$ADMIN_PAGE" 2>/dev/null || true

# Restore firebase.json
mv "$FIREBASE_BACKUP" firebase.json

# Restore environment
if [ -f ".env.local.backup.nuclear" ]; then
    mv .env.local.backup.nuclear .env.local
else
    rm -f .env.local
fi

rm -f "$TEMP_OUTPUT"

echo ""
echo -e "${GREEN}✅ Nuclear cache-busting deployment complete!${NC}"
echo -e "${GREEN}📋 Version deployed: ${UNIQUE_VERSION}${NC}"
echo -e "${GREEN}🌐 Admin URL: ${PREVIEW_URL}/admin-analytics${NC}"
echo ""
echo -e "${BLUE}💡 If version is still wrong:${NC}"
echo -e "${YELLOW}• Try incognito mode${NC}"
echo -e "${YELLOW}• Clear ALL browser data${NC}"
echo -e "${YELLOW}• Check different browser${NC}"
echo -e "${YELLOW}• Use mobile device${NC}"
