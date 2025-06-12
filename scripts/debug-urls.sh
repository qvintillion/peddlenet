#!/bin/bash

# 🔍 Deep Debug Script - Find ALL server URLs in build
# This will hunt down every occurrence of server URLs

set -e

echo "🔍 DEEP DEBUGGING: Hunting for server URLs in build..."
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}1. Searching for ALL peddlenet server URLs in build...${NC}"

# Search for any peddlenet URLs
echo -e "${YELLOW}All peddlenet URLs found:${NC}"
find .next/ -name "*.js" -exec grep -H "peddlenet-websocket-server" {} \; 2>/dev/null | head -10

echo ""
echo -e "${BLUE}2. Specifically looking for PRODUCTION URL...${NC}"

# Search specifically for the production URL
echo -e "${YELLOW}Production URL occurrences:${NC}"
find .next/ -name "*.js" -exec grep -H "padyxgyv5a-uc.a.run.app" {} \; 2>/dev/null | head -5

echo ""
echo -e "${BLUE}3. Environment variable references in build...${NC}"

# Search for environment variable references
echo -e "${YELLOW}NEXT_PUBLIC_SIGNALING_SERVER references:${NC}"
find .next/ -name "*.js" -exec grep -H "NEXT_PUBLIC_SIGNALING_SERVER" {} \; 2>/dev/null | head -5

echo ""
echo -e "${BLUE}4. Checking source code for hardcoded URLs...${NC}"

# Check source code for any hardcoded URLs
echo -e "${YELLOW}Source code search for production URL:${NC}"
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs grep -l "padyxgyv5a-uc.a.run.app" 2>/dev/null || echo "None found in source"

echo ""
echo -e "${BLUE}5. Checking all environment files...${NC}"

# Check all env files
echo -e "${YELLOW}Environment files containing server URLs:${NC}"
for file in .env* ; do
    if [ -f "$file" ]; then
        echo "=== $file ==="
        grep "SIGNALING_SERVER" "$file" 2>/dev/null || echo "No server URL found"
        echo ""
    fi
done

echo ""
echo -e "${BLUE}6. Checking specific build files that might contain URLs...${NC}"

# Check specific patterns in built files
echo -e "${YELLOW}Checking server-utils related files:${NC}"
find .next/ -name "*server-utils*" -exec grep -H "peddlenet" {} \; 2>/dev/null | head -3

echo -e "${YELLOW}Checking connection-related files:${NC}"
find .next/ -name "*connection*" -exec grep -H "peddlenet" {} \; 2>/dev/null | head -3

echo ""
echo -e "${BLUE}7. Raw file content sample (first match):${NC}"

# Show actual file content for first match
FIRST_FILE=$(find .next/ -name "*.js" -exec grep -l "padyxgyv5a-uc.a.run.app" {} \; 2>/dev/null | head -1)
if [ -n "$FIRST_FILE" ]; then
    echo -e "${YELLOW}File: $FIRST_FILE${NC}"
    echo -e "${YELLOW}Context around production URL:${NC}"
    grep -A 3 -B 3 "padyxgyv5a-uc.a.run.app" "$FIRST_FILE" 2>/dev/null | head -10
else
    echo "No files found with production URL"
fi

echo ""
echo -e "${GREEN}✅ Deep debugging complete!${NC}"
