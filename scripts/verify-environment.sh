#!/bin/bash

# 🔍 Environment Verification Script
# Checks if staging and preview environments are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔍 Festival Chat Environment Verification${NC}"
echo -e "${BLUE}=========================================${NC}"

echo ""
echo -e "${BLUE}📋 Current Environment Status:${NC}"

# Check .env.local
echo ""
echo -e "${YELLOW}📄 .env.local (local development):${NC}"
if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_SIGNALING_SERVER" .env.local; then
        SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.local | cut -d'=' -f2)
        echo -e "${GREEN}✅ Found: $SERVER_URL${NC}"
        
        if [[ "$SERVER_URL" == *"localhost"* ]]; then
            echo -e "${GREEN}✅ Correctly configured for local development${NC}"
        elif [[ "$SERVER_URL" == *"preview"* ]]; then
            echo -e "${RED}❌ CONTAMINATED: Contains preview environment URL!${NC}"
        elif [[ "$SERVER_URL" == *"staging"* ]]; then
            echo -e "${RED}❌ CONTAMINATED: Contains staging environment URL!${NC}"
        else
            echo -e "${YELLOW}⚠️  Unknown server URL${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No NEXT_PUBLIC_SIGNALING_SERVER found${NC}"
    fi
else
    echo -e "${RED}❌ .env.local not found${NC}"
fi

# Check .env.staging
echo ""
echo -e "${YELLOW}📄 .env.staging (staging deployment):${NC}"
if [ -f ".env.staging" ]; then
    if grep -q "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging; then
        SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.staging | cut -d'=' -f2)
        echo -e "${GREEN}✅ Found: $SERVER_URL${NC}"
        
        if [[ "$SERVER_URL" == *"staging"* ]]; then
            echo -e "${GREEN}✅ Correctly configured for staging${NC}"
        else
            echo -e "${YELLOW}⚠️  Does not contain 'staging' in URL${NC}"
        fi
    else
        echo -e "${RED}❌ No NEXT_PUBLIC_SIGNALING_SERVER found${NC}"
    fi
else
    echo -e "${RED}❌ .env.staging not found${NC}"
fi

# Check .env.preview
echo ""
echo -e "${YELLOW}📄 .env.preview (preview deployment):${NC}"
if [ -f ".env.preview" ]; then
    if grep -q "NEXT_PUBLIC_SIGNALING_SERVER" .env.preview; then
        SERVER_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.preview | cut -d'=' -f2)
        echo -e "${GREEN}✅ Found: $SERVER_URL${NC}"
        
        if [[ "$SERVER_URL" == *"preview"* ]]; then
            echo -e "${GREEN}✅ Correctly configured for preview${NC}"
        else
            echo -e "${YELLOW}⚠️  Does not contain 'preview' in URL${NC}"
        fi
    else
        echo -e "${RED}❌ No NEXT_PUBLIC_SIGNALING_SERVER found${NC}"
    fi
else
    echo -e "${RED}❌ .env.preview not found${NC}"
fi

echo ""
echo -e "${BLUE}🛠️ Available Commands:${NC}"
echo -e "${YELLOW}Local Development:${NC} npm run dev:mobile"
echo -e "${YELLOW}Preview Deploy:${NC}    npm run preview:deploy [channel-name]"
echo -e "${YELLOW}Staging Deploy:${NC}    npm run staging:deploy"
echo -e "${YELLOW}Production:${NC}        npm run deploy:firebase:complete"

echo ""
echo -e "${BLUE}🧪 Environment Isolation Test:${NC}"
echo "Current .env.local should be for local development only."
echo "Deployment scripts should temporarily replace .env.local and restore it."

echo ""
echo -e "${GREEN}✅ Environment verification complete!${NC}"

# Quick fix suggestion
echo ""
echo -e "${PURPLE}🔧 Quick Fix Commands:${NC}"
echo -e "${YELLOW}Clean .env.local:${NC} rm .env.local && cp .env.local.example .env.local"
echo -e "${YELLOW}Make scripts executable:${NC} chmod +x scripts/*.sh"
