#!/bin/bash

# 🎪 Simple Preview URL Handler - Manual Chrome Profile Solution
# For when automated profile detection doesn't work

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

URL="$1"
if [ -z "$URL" ]; then
    echo -e "${RED}❌ Please provide a URL${NC}"
    exit 1
fi

echo -e "${PURPLE}🎪 Festival Chat Preview - Manual Chrome Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}🔗 Preview URL:${NC}"
echo -e "${YELLOW}$URL${NC}"
echo ""
echo -e "${BLUE}📝 Manual Setup Instructions:${NC}"
echo ""
echo -e "${YELLOW}1. Open Google Chrome${NC}"
echo -e "${YELLOW}2. Click the profile icon (top right corner)${NC}"
echo -e "${YELLOW}3. Switch to or sign into: th3p3ddl3r@gmail.com${NC}"
echo -e "${YELLOW}4. Copy and paste this URL: $URL${NC}"
echo ""
echo -e "${BLUE}💡 Alternative: Copy URL to clipboard${NC}"
echo -n "$URL" | pbcopy 2>/dev/null && echo -e "${GREEN}✅ URL copied to clipboard!${NC}" || echo -e "${YELLOW}⚠️  Copy manually: $URL${NC}"
echo ""
echo -e "${PURPLE}🎯 This ensures you're using the correct Google account for Firebase access.${NC}"
