#!/bin/bash
# Complete Cleanup and Push - October 2025
# Does documentation cleanup, creates READMEs, commits, and pushes

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Festival Chat - Complete Cleanup & Push${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

cd "$(dirname "$0")"

# Step 1: Create README files if they don't exist
echo -e "${YELLOW}📝 Step 1: Creating documentation READMEs...${NC}"

if [ ! -f "docs/README.md" ]; then
    cat > docs/README.md << 'DOCEOF'
# Festival Chat Documentation

**Status:** Post-Reset Clean State (October 2025)  
**Current Version:** June 15, 2025 baseline + October improvements

---

## 📚 Quick Navigation

### Getting Started
- **[01-QUICK-START](./01-QUICK-START.md)** - Get up and running
- **[02-USER-GUIDE](./02-USER-GUIDE.md)** - Feature overview

### Current Status
- **[OCTOBER-2025-RESET-AND-RECOVERY](./OCTOBER-2025-RESET-AND-RECOVERY.md)** ⭐ **START HERE**
- **[DEPLOYMENT_READINESS](./DEPLOYMENT_READINESS.md)** - Ready to deploy
- **[WEB_APP_RESET_DOCUMENTATION](./WEB_APP_RESET_DOCUMENTATION.md)** - Reset details

### Core Documentation
- **[04-ARCHITECTURE](./04-ARCHITECTURE.md)** - System design
- **[06-DEPLOYMENT](./06-DEPLOYMENT.md)** - Deployment guide
- **[11-TROUBLESHOOTING](./11-TROUBLESHOOTING.md)** - Common issues

### Admin Dashboard
- **[ADMIN-ANALYTICS-DASHBOARD-COMPLETE](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Complete guide
- **[ADMIN_TROUBLESHOOTING](./ADMIN_TROUBLESHOOTING.md)** - Admin issues

---

## 📊 Project Status

✅ **Working:** Real-time chat, QR codes, mobile-responsive, admin dashboard  
❌ **Removed:** Mesh networking (complexity), advanced P2P (future)  
🎯 **Next:** Deploy to staging → Test → Deploy to production

---

## 🗂️ Archive

Historical docs in **[archive/](./archive/)** - June 2025 fixes consolidated into OCTOBER-2025-RESET-AND-RECOVERY.md

**Last Updated:** October 7, 2025
DOCEOF
    echo -e "${GREEN}  ✓ Created docs/README.md${NC}"
else
    echo -e "${BLUE}  ℹ docs/README.md already exists${NC}"
fi

if [ ! -f "docs/archive/README.md" ]; then
    cat > docs/archive/README.md << 'ARCHEOF'
# Documentation Archive

Historical documentation from June 2025 development period.

## What's Here

- **june-2025-fixes/** - General bug fixes and improvements
- **june-2025-deployment-issues/** - Deployment pipeline problems
- **june-2025-admin-fixes/** - Admin dashboard fixes
- **mesh-networking/** - Mesh networking implementation (removed in October reset)

## Why Archived

October 7, 2025: Hard reset to clean state resolved all these issues. Documents preserved for historical reference.

## Current Docs

See parent `docs/` folder for active documentation, especially:
- **OCTOBER-2025-RESET-AND-RECOVERY.md** - Complete summary

**Archive Date:** October 7, 2025
ARCHEOF
    echo -e "${GREEN}  ✓ Created docs/archive/README.md${NC}"
else
    echo -e "${BLUE}  ℹ docs/archive/README.md already exists${NC}"
fi

echo ""

# Step 2: Add and commit all changes
echo -e "${YELLOW}📦 Step 2: Committing all changes...${NC}"

git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${BLUE}  ℹ No new changes to commit${NC}"
else
    git commit -m "docs: Add README files for documentation structure

- Added docs/README.md with navigation
- Added docs/archive/README.md explaining archive
- Completed documentation cleanup from October 2025 reset"
    echo -e "${GREEN}  ✓ Changes committed${NC}"
fi

echo ""

# Step 3: Push to GitHub
echo -e "${YELLOW}📤 Step 3: Pushing to GitHub...${NC}"

git remote add origin git@github.com:qvintillion/peddlenet.git 2>/dev/null || true

if git push -u origin main; then
    echo -e "${GREEN}  ✓ Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}  ⚠ Standard push failed, trying force push...${NC}"
    read -p "  Force push? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin main --force
        echo -e "${GREEN}  ✓ Force pushed to GitHub!${NC}"
    else
        echo -e "${YELLOW}  ❌ Push cancelled${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 SUCCESS - Everything Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}✅ Documentation READMEs created${NC}"
echo -e "${BLUE}✅ All changes committed${NC}"
echo -e "${BLUE}✅ Pushed to GitHub${NC}"
echo ""
echo -e "${YELLOW}📱 Repository:${NC} https://github.com/qvintillion/peddlenet"
echo -e "${YELLOW}🌐 View changes:${NC} https://github.com/qvintillion/peddlenet/commits/main"
echo ""
echo -e "${GREEN}🚀 Ready for staging deployment!${NC}"
echo ""
echo -e "${YELLOW}Next step - Deploy to staging:${NC}"
echo -e "  ${BLUE}npm run staging:unified test-\$(date +%Y%m%d)${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
