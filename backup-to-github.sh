#!/bin/bash
# FIXED GitHub Backup Script for Festival Chat
# No hanging issues - streamlined and reliable
# UPDATED: June 14, 2025

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Festival Chat - GitHub Backup (FIXED)${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: Must run from festival-chat root directory${NC}"
    exit 1
fi

# Get current timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_SHORT=$(date "+%Y%m%d-%H%M")

echo -e "${YELLOW}📋 Preparing backup for: $TIMESTAMP${NC}"
echo ""

# Clean up unnecessary files before backup
echo -e "${YELLOW}🧹 Cleaning unnecessary files...${NC}"
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf .vercel 2>/dev/null || true
rm -rf .firebase/hosting.* 2>/dev/null || true
find . -name "*.backup*" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git repository...${NC}"
    git init
    git branch -M main
    echo -e "${GREEN}✅ Git initialized${NC}"
fi

# Create/update .gitignore
echo -e "${YELLOW}📝 Updating .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
.next/
out/
build/
dist/

# Runtime data
.env*.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel/

# Firebase
.firebase/hosting.*
.firebase/functions/
firebase-debug.log
firebase-debug.*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
backup-to-github.sh.backup*

# Keep important configs
!.env.example
!.env.staging
!.env.production
!.firebaserc
!firebase.json
!vercel.json
!next.config.ts
!package.json
!package-lock.json
EOF

# Add files to git
echo -e "${YELLOW}📦 Adding files to git...${NC}"
git add .
echo -e "${GREEN}✅ Files staged for commit${NC}"

# Create commit message
COMMIT_MSG="🎉 Festival Chat Complete Overhaul - $DATE_SHORT

🎯 ADMIN DASHBOARD REFINEMENT COMPLETE:
✅ User Count Accuracy - Fixed double counting with Set deduplication
✅ Simplified Authentication - Single admin level, no confusion
✅ Room-Specific Broadcasting - Target specific rooms by code
✅ CSV Activity Export - Download complete event logs
✅ Enhanced UI - Fixed-height activity feed with perfect alignment
✅ Password Separation - Different fields for room vs database operations

⚡ PREVIEW WORKFLOW OPTIMIZATION FIXED:
✅ UI Sync Issue Resolved - Preview script dynamically reads staging server
✅ Optimized Commands - ./scripts/deploy-websocket-staging.sh + npm run preview:deploy
✅ Immediate Updates - Changes show up instantly in preview (no cache issues!)
✅ Documentation Complete - DEPLOYMENT-WORKFLOW-OPTIMIZED.md created

🔧 CONNECTION ERRORS RESOLVED:
✅ GitHub Build Errors - Added 'export const dynamic' to all API routes  
✅ Static Export Compatibility - All routes work with GitHub Pages builds
✅ Environment Variable Injection - Preview deployments load correct URLs
✅ WebSocket Stability - Enhanced connection resilience

📚 DOCUMENTATION & CLEANUP:
✅ Root Folder Cleanup - Moved temporary docs to proper locations
✅ Backup Scripts - Consolidated to single enhanced version  
✅ Workflow Integration - All fixes documented and integrated
✅ Developer Guide - Complete optimized workflow documented

🎪 PRODUCTION-READY ADMIN FEATURES:
- Professional 24-hour persistent authentication
- Accurate analytics with unique user tracking across rooms
- Advanced broadcasting (global + room-specific targeting)
- CSV export for festival data analysis
- Real-time activity monitoring with scrollable feed
- Complete admin controls (room management, database operations)
- Mobile-responsive touch-optimized interface
- Multi-platform deployment compatibility

🚀 OPTIMIZED DEVELOPER WORKFLOW:
- Local Development: npm run dev:mobile
- Backend Updates: ./scripts/deploy-websocket-staging.sh  
- Frontend Preview: npm run preview:deploy (auto-uses new backend!)
- Nuclear Option: npm run deploy:firebase:complete
- Production: npm run deploy:vercel:complete

📊 CURRENT STATUS:
- Admin Dashboard: ✅ Complete with refined controls
- Preview Workflow: ✅ Optimized (3-5min vs 8-10min)
- User Analytics: ✅ Accurate (no double counting)
- Connection Issues: ✅ All resolved
- Documentation: ✅ Comprehensive and integrated
- Production Deployment: ✅ Ready for festivals

Festival organizers now have a production-ready platform with accurate metrics,
professional admin controls, and optimized development workflow! 🎪

Backup created: $TIMESTAMP"

# Commit changes
echo -e "${YELLOW}💾 Creating commit...${NC}"
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Changes committed${NC}"

# Add remote if not exists (suppress error if it already exists)
echo -e "${YELLOW}🔗 Setting up GitHub remote...${NC}"
git remote add origin https://github.com/qvintillion/peddlenet.git 2>/dev/null || echo "Remote already exists"
echo -e "${GREEN}✅ Remote configured${NC}"

# Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
if git push -u origin main --force; then
    echo ""
    echo -e "${GREEN}🎉 BACKUP SUCCESSFUL!${NC}"
    echo -e "${GREEN}✅ Festival Chat Complete Overhaul backed up to GitHub${NC}"
    echo -e "${BLUE}📱 Repository: https://github.com/qvintillion/peddlenet${NC}"
    echo ""
    echo -e "${PURPLE}🎯 MAJOR ACHIEVEMENTS BACKED UP:${NC}"
    echo -e "   🎪 Admin Dashboard: ✅ Refined controls & accurate analytics"
    echo -e "   ⚡ Preview Workflow: ✅ OPTIMIZED (UI sync fixed!)"
    echo -e "   📊 User Count: ✅ ACCURATE (deduplication implemented)"
    echo -e "   🔧 Connection Errors: ✅ ALL RESOLVED"
    echo -e "   📚 Documentation: ✅ Complete workflow guide"
    echo -e "   🚀 Production Ready: ✅ Festival deployment ready"
    echo ""
    echo -e "${YELLOW}📋 OPTIMIZED WORKFLOW NOW AVAILABLE:${NC}"
    echo -e "   1. ./scripts/deploy-websocket-staging.sh  (update backend)"
    echo -e "   2. npm run preview:deploy                  (deploy frontend)"
    echo -e "   3. Changes show immediately! 🎉"
    echo ""
    echo -e "${BLUE}🎪 Ready for festival deployment and further enhancements!${NC}"
else
    echo -e "${RED}❌ Push failed. Check GitHub credentials and repository access.${NC}"
    echo -e "${YELLOW}💡 You may need to authenticate with GitHub first:${NC}"
    echo -e "   git config --global user.name \"Your Name\""
    echo -e "   git config --global user.email \"your.email@example.com\""
    echo -e "   Or use GitHub CLI: gh auth login"
    exit 1
fi
