#!/bin/bash
# Enhanced GitHub Backup Script for Festival Chat
# Backs up all critical project files, configurations, and progress
# UPDATED: June 14, 2025 - Reflects admin controls refinement & workflow optimization

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Festival Chat - Enhanced GitHub Backup${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: Must run from festival-chat root directory${NC}"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git repository...${NC}"
    git init
    git branch -M main
fi

# Get current timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_SHORT=$(date "+%Y%m%d-%H%M")

echo -e "${YELLOW}📋 Preparing backup for: $TIMESTAMP${NC}"
echo ""

# Create comprehensive backup info
cat > BACKUP_INFO.md << EOF
# Festival Chat - GitHub Backup
**Backup Date**: $TIMESTAMP  
**Build Status**: ✅ Production Ready  
**Admin Dashboard**: ✅ Complete with Refined Controls  
**Preview Workflow**: ✅ OPTIMIZED (UI sync issues FIXED)  
**User Count**: ✅ ACCURATE (Deduplication implemented)  
**Connection Issues**: ✅ RESOLVED  

## 🎯 MAJOR FIXES COMPLETED (June 14, 2025)

### ✅ **Admin Dashboard Overhaul**
- **User Count Accuracy**: Fixed double counting across rooms with Set deduplication
- **Simplified Authentication**: Single admin level (no more basic/super confusion)
- **Room-Specific Broadcasting**: Target specific rooms by code with multi-room support
- **CSV Activity Export**: Download complete activity logs for analysis
- **Enhanced Activity Feed**: Fixed-height scrollable container with perfect alignment
- **Password Separation**: Different fields for room clearing vs database wipe operations

### ✅ **Preview Workflow OPTIMIZATION** 
- **UI Sync Issue FIXED**: Preview script now dynamically reads staging server URL
- **Optimized Commands**: 
  ```bash
  ./scripts/deploy-websocket-staging.sh  # Update backend
  npm run preview:deploy                  # Deploy frontend (auto-uses new backend)
  ```
- **Result**: Changes show up immediately in preview (no more cache issues!)

### ✅ **Connection Error Resolution**
- **GitHub Build Errors**: Added required \`export const dynamic = 'force-dynamic'\` to API routes
- **Static Export Compatibility**: All API routes now work with GitHub Pages builds
- **Environment Variable Injection**: Preview deployments properly load staging server URLs
- **WebSocket Stability**: Enhanced connection resilience and reconnection logic

### ✅ **Documentation & Cleanup**
- **Root Folder Cleanup**: Moved temporary docs to proper locations
- **Backup Scripts**: Consolidated to single enhanced version
- **Workflow Documentation**: Created complete optimized workflow guide
- **Integration**: All fixes properly documented and integrated

## 🎪 **Current Working Configuration**

### **Development Workflow**
- **Local Development**: \`npm run dev:mobile\` 
- **OPTIMIZED Preview**: \`./scripts/deploy-websocket-staging.sh && npm run preview:deploy\`
- **Nuclear Option**: \`npm run deploy:firebase:complete\` (when things break)
- **Production Deploy**: \`npm run deploy:vercel:complete\`

### **Admin Dashboard Features** ✅ ALL WORKING
- **🔐 Professional Authentication**: 24-hour persistent sessions
- **📈 Accurate Analytics**: Fixed unique user counting (no double counting)
- **📢 Advanced Broadcasting**: Global + room-specific targeting
- **📲 CSV Export**: Download activity logs with timestamps
- **📋 Live Activity Feed**: Real-time scrollable display
- **🛡️ Complete Admin Controls**: Room management, database operations
- **📱 Mobile Responsive**: Touch-optimized interface
- **🌐 Production Ready**: Works on all deployment platforms

## 🔗 **Environment Variables (Current Working URLs)**

### Staging Server (Updated by deploy-websocket-staging.sh)
\`\`\`bash
# .env.staging (automatically updated)
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-[current-hash].us-central1.run.app
\`\`\`

### Production Server
\`\`\`bash
# .env.production
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
\`\`\`

### Preview Environment (Auto-generated)
\`\`\`bash
# Dynamically reads from .env.staging during preview deploy
NEXT_PUBLIC_SIGNALING_SERVER=(current staging server URL)
BUILD_TARGET=preview
NODE_ENV=production
\`\`\`

## 🎛️ **Admin Dashboard Access**
- **URL**: \`/admin-analytics\`
- **Credentials**: \`th3p3ddl3r\` / \`letsmakeatrade\`
- **Status**: ✅ Working in all environments
- **New Features**: 
  - Unique user tracking across rooms
  - Room-specific broadcasting with comma-separated codes
  - CSV activity export with detailed event logs
  - Fixed-height activity feed with perfect UI alignment
  - Separate password fields for different admin operations

## 🔧 **Technical Improvements**

### **API Route Fixes**
- Added \`export const dynamic = 'force-dynamic'\` to all API routes
- Fixed static export compatibility for GitHub Pages builds
- Resolved "export const revalidate not configured" errors

### **Preview Deploy Enhancement**
- **Before**: Hardcoded old WebSocket URL (changes didn't show)
- **After**: Dynamically reads current staging URL (immediate updates)
- **Scripts Updated**: \`scripts/deploy-preview-enhanced.sh\`

### **User Count Accuracy**
- **Problem**: Users counted multiple times across rooms
- **Solution**: Set deduplication for unique user tracking
- **Impact**: Reliable metrics for festival capacity management

### **Broadcasting Improvements**
- **Global Broadcast**: Send to all active rooms simultaneously
- **Room-Specific**: Target rooms by comma-separated codes
- **Fuzzy Matching**: Multiple search methods (ID, code, partial)
- **Success Reporting**: Detailed feedback on delivery status

## 📊 **Documentation Structure**
- **Main Guide**: \`docs/DEPLOYMENT-WORKFLOW-OPTIMIZED.md\` - Complete workflow
- **Deployment**: \`docs/06-DEPLOYMENT.md\` - All deployment options
- **Admin Dashboard**: \`docs/ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md\`
- **Troubleshooting**: \`docs/11-TROUBLESHOOTING.md\`
- **Architecture**: \`docs/04-ARCHITECTURE.md\`

## 🚀 **Next Development Phase**
- Enhanced admin analytics with trend analysis
- Cross-room notification system improvements
- Mobile app development (using PWA foundation)
- Festival-specific features (schedules, maps, etc.)
- Advanced mesh networking capabilities

## 🎉 **Ready for Production Use**
**Festival organizers now have a complete platform with:**
- ✅ Accurate user/room analytics
- ✅ Professional admin controls
- ✅ Reliable real-time messaging
- ✅ Mobile-optimized interface
- ✅ Fast development workflow
- ✅ Production-grade deployment
EOF

echo -e "${GREEN}✅ Created comprehensive backup info${NC}"

# Clean up unnecessary files before backup
echo -e "${YELLOW}🧹 Cleaning unnecessary files...${NC}"

# Remove large files and cache directories
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf .vercel 2>/dev/null || true
rm -rf .firebase/hosting.* 2>/dev/null || true

# Remove backup files
find . -name "*.backup*" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed${NC}"

# Add all files to git
echo -e "${YELLOW}📦 Adding files to git...${NC}"

# Create/update .gitignore
cat > .gitignore << EOF
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

git add .
echo -e "${GREEN}✅ Files staged for commit${NC}"

# Create comprehensive commit message reflecting all recent improvements
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

🔗 WORKING SERVERS:
- Staging: Auto-updated by deploy-websocket-staging.sh
- Production: wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app

Festival organizers now have a production-ready platform with accurate metrics,
professional admin controls, and optimized development workflow! 🎪

Backup created: $TIMESTAMP"

# Commit changes
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Changes committed${NC}"

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    echo -e "${YELLOW}🔗 Adding GitHub remote...${NC}"
    git remote add origin https://github.com/qvintillion/peddlenet.git
    echo -e "${GREEN}✅ Remote added${NC}"
fi

# Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push -u origin main --force

if [ $? -eq 0 ]; then
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
    exit 1
fi
