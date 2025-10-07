#!/bin/bash
# Quick GitHub Backup & Push Script - October 2025
# Simplified version for post-reset deployments

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Festival Chat - Quick GitHub Push${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}❌ Error: Must run from festival-chat root directory${NC}"
    exit 1
fi

# Get current timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo -e "${YELLOW}📋 Preparing push for: $TIMESTAMP${NC}"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📦 Uncommitted changes detected${NC}"
    
    # Show what's changed
    echo -e "${BLUE}Changed files:${NC}"
    git status --short
    echo ""
    
    # Add all changes
    echo -e "${YELLOW}📦 Adding all changes...${NC}"
    git add -A
    
    # Create commit with provided message or default
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="chore: Update project files - $TIMESTAMP"
    fi
    
    echo -e "${YELLOW}💾 Creating commit...${NC}"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Changes committed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
    echo ""
fi

# Add remote if not exists
git remote add origin git@github.com:qvintillion/peddlenet.git 2>/dev/null || echo -e "${BLUE}ℹ Remote already exists${NC}"

# Push to main branch
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
if git push -u origin main; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}⚠ Push failed. Trying with force...${NC}"
    echo -e "${YELLOW}⚠ This will overwrite remote if local is ahead${NC}"
    read -p "Force push? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin main --force
        echo -e "${GREEN}✅ Force pushed to GitHub!${NC}"
    else
        echo -e "${YELLOW}❌ Push cancelled${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 GITHUB PUSH SUCCESSFUL!${NC}"
echo -e "${GREEN}===========================${NC}"
echo ""
echo -e "${BLUE}📱 Repository: https://github.com/qvintillion/peddlenet${NC}"
echo -e "${BLUE}🌐 View at: https://github.com/qvintillion/peddlenet/tree/main${NC}"
echo ""
echo -e "${YELLOW}🔄 Git Status:${NC}"
git log --oneline -1
echo ""
echo -e "${GREEN}✅ All changes backed up to GitHub!${NC}"
