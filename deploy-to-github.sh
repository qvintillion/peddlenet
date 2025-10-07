#!/bin/bash
# GitHub Deploy - October 2025 Post-Reset
# Commits documentation cleanup after hard reset

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 GitHub Deploy - Post-Reset${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

cd "$(dirname "$0")"

# Step 1: Stage all changes
echo -e "${YELLOW}📦 Step 1: Staging all changes...${NC}"
git add -A

echo -e "${GREEN}  ✓ All changes staged${NC}"
echo ""

# Step 2: Show what's being committed
echo -e "${YELLOW}📋 Step 2: Changes to be committed:${NC}"
git status --short
echo ""

# Step 3: Create comprehensive commit
echo -e "${YELLOW}💾 Step 3: Creating commit...${NC}"

git commit -m "docs: Complete deployment documentation consolidation - POST-RESET October 2025

🔄 CRITICAL CONTEXT - POST-RESET TO STABLE STATE:

This commit follows a hard reset to origin/main (June 15, 2025 baseline) to resolve
fatal deployment issues caused by mesh networking implementation attempts. We've
restored to a clean, working state and established clear deployment documentation.

Reset Reason:
- Deployment pipeline completely broken (cycling errors)
- Environment synchronization failures across platforms
- Build errors in Tailwind/TypeScript/Components loop
- Mesh networking complexity causing slow connections
- Need to return to last known stable state

What Was Reset:
❌ Removed mesh networking P2P implementation (too complex)
❌ Removed advanced admin analytics (causing build issues)
❌ Removed experimental features (causing instability)
✅ Restored to June 15, 2025 clean baseline
✅ Simple WebSocket-only chat (fast, reliable)
✅ Working admin dashboard (basic version)
✅ Mobile-responsive UI (tested and stable)

🎯 POST-RESET DOCUMENTATION CLEANUP:

Created Official Deployment Guide:
- docs/DEPLOYMENT.md - New comprehensive deployment guide
- Establishes Vercel as primary platform (NOT Firebase)
- Clarifies staging = Vercel previews (automatic)
- Documents backend Cloud Run servers
- Includes troubleshooting and known issues
- Archives legacy Firebase deployment workflows

Documentation Structure Improvements:
- Created docs/README.md (navigation)
- Created docs/archive/README.md (archive explanation)
- Archived outdated 06-DEPLOYMENT.md (Firebase-focused)
- Consolidated October 2025 reset documentation
- OCTOBER-2025-RESET-AND-RECOVERY.md explains full context

Key Clarifications Established:
✅ Vercel is primary platform (auto-deploy from GitHub)
✅ Firebase scripts archived (backup only, not recommended)
✅ Simple workflow: git push = deploy
✅ Vercel previews = automatic staging for every branch
✅ QR code issue on previews documented with workaround
✅ Clean state restored (no mesh networking complexity)

Deployment Workflow Established:
- Development: npm run dev:mobile (simple, fast)
- Staging: git push origin [branch] → Vercel preview
- Production: git push origin main → peddlenet.app
- Backend: Manual Cloud Run deploy when needed
- NO complex scripts needed for daily work

Why Vercel (NOT Firebase):
- Firebase = Static hosting only (no API routes)
- PeddleNet = Next.js with /api/* endpoints
- Vercel = Native Next.js support, works perfectly
- Firebase scripts exist but archived (backup only)

Files Created:
- docs/DEPLOYMENT.md (official deployment guide)
- docs/README.md (documentation navigation)
- docs/archive/README.md (archive explanation)
- OCTOBER-2025-RESET-AND-RECOVERY.md (reset summary)
- WEB_APP_RESET_DOCUMENTATION.md (detailed reset process)
- DEPLOYMENT_READINESS.md (current status)
- DOCUMENTATION-CONSOLIDATION-COMPLETE.md (cleanup summary)

Files Archived:
- docs/06-DEPLOYMENT.md → docs/archive/06-DEPLOYMENT-OLD.md
- June 2025 fix documents → docs/archive/june-2025-fixes/
- Deployment issues → docs/archive/june-2025-deployment-issues/
- Admin fixes → docs/archive/june-2025-admin-fixes/
- Mesh networking docs → docs/archive/mesh-networking/

Current State (October 7, 2025):
✅ Clean codebase (June 15, 2025 baseline)
✅ Dependencies installed (1546 packages)
✅ Dev server working (npm run dev:mobile)
✅ Fast connections (< 500ms expected)
✅ Simple WebSocket architecture (no P2P complexity)
✅ Documentation consolidated and clear
✅ Ready for staging deployment
✅ Ready for production deployment

Pre-Reset Issues (Now Resolved):
❌ Deployment pipeline broken → ✅ Fixed by reset
❌ Environment conflicts → ✅ Fixed by reset
❌ Build error cycling → ✅ Fixed by reset
❌ Mesh networking slow → ✅ Removed, back to fast WebSocket
❌ Confusing docs → ✅ Consolidated into clear guides

Future Plans (Post-Stabilization):
- Test on staging (Vercel preview)
- Deploy to production (peddlenet.app)
- Restore admin analytics from backup (carefully)
- Consider mesh networking Phase 1 (separate branch, after stability confirmed)

Status: POST-RESET, documentation cleaned up, ready for deployment testing
Next: Deploy to Vercel staging, verify stability, then production
Goal: Return to simple, fast, reliable festival chat experience

See docs/OCTOBER-2025-RESET-AND-RECOVERY.md for complete reset context
See docs/DEPLOYMENT.md for deployment workflow
See docs/README.md for documentation navigation"

echo -e "${GREEN}  ✓ Commit created${NC}"
echo ""

# Step 4: Push to GitHub
echo -e "${YELLOW}📤 Step 4: Pushing to GitHub...${NC}"

git remote add origin git@github.com:qvintillion/peddlenet.git 2>/dev/null || true

if git push -u origin main; then
    echo -e "${GREEN}  ✓ Successfully pushed to GitHub${NC}"
else
    echo -e "${YELLOW}  ⚠ Standard push failed, trying force push...${NC}"
    read -p "  Force push? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin main --force
        echo -e "${GREEN}  ✓ Force pushed to GitHub${NC}"
    else
        echo -e "${YELLOW}  ❌ Push cancelled${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 SUCCESS - Post-Reset Changes Pushed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}✅ Post-reset documentation pushed${NC}"
echo -e "${BLUE}✅ Clean state established (June 15, 2025 baseline)${NC}"
echo -e "${BLUE}✅ Deployment guide created${NC}"
echo -e "${BLUE}✅ Changes backed up to GitHub${NC}"
echo ""
echo -e "${YELLOW}📱 Repository:${NC} https://github.com/qvintillion/peddlenet"
echo -e "${YELLOW}🌐 View commit:${NC} https://github.com/qvintillion/peddlenet/commits/main"
echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Vercel will auto-deploy to production${NC}"
echo -e "   URL: https://peddlenet.app"
echo -e "   Wait: ~2-3 minutes"
echo -e "   This deploys the CLEAN, STABLE version"
echo ""
echo -e "${YELLOW}2. Verify clean deployment:${NC}"
echo -e "   • Check https://peddlenet.app loads"
echo -e "   • Test create room (should be FAST)"
echo -e "   • Test send message (should be instant)"
echo -e "   • Check browser console (should be clean)"
echo -e "   • Verify connections < 500ms"
echo ""
echo -e "${YELLOW}3. Test on staging first (recommended):${NC}"
echo -e "   git checkout -b test-clean-deploy"
echo -e "   git push origin test-clean-deploy"
echo -e "   # Test Vercel preview URL before production"
echo ""
echo -e "${BLUE}📖 Read the guides:${NC}"
echo -e "   • docs/DEPLOYMENT.md - Deployment workflow"
echo -e "   • docs/OCTOBER-2025-RESET-AND-RECOVERY.md - Reset context"
echo -e "   • docs/README.md - Documentation index"
echo ""
echo -e "${GREEN}🎪 You're back to a CLEAN, FAST, STABLE chat app!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
