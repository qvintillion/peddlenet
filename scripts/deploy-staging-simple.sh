#!/bin/bash

# 🎪 Festival Chat - Staging Deploy to Firebase Hosting
# Deploys to the main staging environment (not preview channels)

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

echo -e "${PURPLE}🎪 Festival Chat Staging Deploy${NC}"
echo -e "${BLUE}==============================${NC}"

echo ""
echo -e "${BLUE}🏗️ Building project for Firebase with staging environment...${NC}"

# Backup current environment
echo -e "${YELLOW}💾 Backing up current environment...${NC}"
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.staging 2>/dev/null || true
    echo -e "${GREEN}✅ Backed up .env.local${NC}"
fi

# Copy staging environment variables for build
if [ -f ".env.staging" ]; then
    echo -e "${GREEN}📋 Using staging environment variables${NC}"
    cp .env.staging .env.local
    echo -e "${BLUE}🔧 Environment details:${NC}"
    echo -e "${YELLOW}   • WebSocket Server: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | cut -d'=' -f2)${NC}"
    echo -e "${YELLOW}   • Build Target: staging${NC}"
else
    echo -e "${RED}❌ No .env.staging found!${NC}"
    echo -e "${RED}   This is required for staging deployment.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🏗️ Building Next.js application...${NC}"

# Cache bust - clear builds to ensure fresh deployment with new environment
echo -e "${YELLOW}🧹 Cache bust: clearing all builds...${NC}"
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
echo -e "${GREEN}✅ Build cache cleared${NC}"

echo ""
echo -e "${BLUE}🚀 Building with explicit environment variables...${NC}"
echo -e "${YELLOW}Setting NEXT_PUBLIC_SIGNALING_SERVER explicitly...${NC}"

# Get the staging server URL from .env.staging
STAGING_SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | cut -d'=' -f2)
echo -e "${GREEN}Using staging server: ${STAGING_SERVER_URL}${NC}"

# Build with explicit environment variable
NEXT_PUBLIC_SIGNALING_SERVER="$STAGING_SERVER_URL" npm run build:firebase

echo ""
echo -e "${BLUE}🔧 Building Firebase Functions...${NC}"
cd functions
npm run build
cd ..

echo ""
echo -e "${BLUE}🚀 Deploying to Firebase Staging (hosting + functions)...${NC}"

# Deploy to Firebase hosting (not a preview channel - this is the main staging)
firebase deploy --only hosting,functions --project "$PROJECT_ID"

# Restore original environment
echo ""
echo -e "${BLUE}🔄 Restoring original environment...${NC}"
if [ -f ".env.local.backup.staging" ]; then
    mv .env.local.backup.staging .env.local
    echo -e "${GREEN}✅ Restored original .env.local${NC}"
else
    # If no backup, clean up the staging env from .env.local
    rm -f .env.local
    echo -e "${YELLOW}⚠️  No backup found - cleared .env.local${NC}"
fi

# Get Firebase URL
FIREBASE_URL="https://festival-chat-peddlenet.web.app"

echo ""
echo -e "${GREEN}🎉 Staging deployment completed!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}🔗 STAGING URL:${NC}"
echo -e "${YELLOW}${FIREBASE_URL}${NC}"
echo ""

# Copy URL to clipboard
echo -n "$FIREBASE_URL" | pbcopy 2>/dev/null && echo -e "${GREEN}✅ URL copied to clipboard!${NC}" || echo -e "${YELLOW}⚠️  Copy the URL manually${NC}"

echo ""
echo -e "${PURPLE}🔐 HOW TO ACCESS STAGING:${NC}"
echo -e "${BLUE}========================${NC}"
echo ""
echo -e "${YELLOW}Step 1: Open Chrome (or any browser)${NC}"
echo -e "${YELLOW}Step 2: Go to accounts.google.com${NC}"
echo -e "${YELLOW}Step 3: Sign into th3p3ddl3r@gmail.com${NC}"
echo -e "${YELLOW}Step 4: In the SAME browser tab/window:${NC}"
echo -e "${YELLOW}        - Press Cmd+V (URL is in clipboard)${NC}"
echo -e "${YELLOW}        - OR manually type: ${FIREBASE_URL}${NC}"
echo ""
echo -e "${GREEN}✅ Staging should load with proper staging WebSocket server!${NC}"
echo ""
echo -e "${BLUE}📱 MOBILE TESTING:${NC}"
echo -e "${YELLOW}• Copy URL to phone (AirDrop, text, etc.)${NC}"
echo -e "${YELLOW}• Make sure th3p3ddl3r@gmail.com is signed into mobile browser${NC}"
echo -e "${YELLOW}• Open URL in mobile browser${NC}"
echo ""

echo -e "${PURPLE}🛠️ Environment Info:${NC}"
echo -e "${YELLOW}• Staging WebSocket: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | cut -d'=' -f2)${NC}"
echo -e "${YELLOW}• Build Target: staging${NC}"
echo -e "${YELLOW}• Firebase Project: $PROJECT_ID${NC}"
echo ""

echo -e "${PURPLE}🛠️ Management Commands:${NC}"
echo -e "${YELLOW}View deployment:${NC} firebase hosting:sites:list --project $PROJECT_ID"
echo -e "${YELLOW}Check functions:${NC} firebase functions:log --project $PROJECT_ID"
echo ""
echo -e "${GREEN}✅ Staging deployment complete!${NC}"
echo -e "${BLUE}💡 This deployed to the main staging environment (not a preview channel)${NC}"
