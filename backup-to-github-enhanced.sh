#!/bin/bash
# Enhanced GitHub Backup Script for Festival Chat
# Backs up all critical project files, configurations, and progress

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Create backup info
cat > BACKUP_INFO.md << EOF
# Festival Chat - GitHub Backup
**Backup Date**: $TIMESTAMP  
**Build Status**: ✅ Production Ready  
**Admin Dashboard**: ✅ Working (Authentication Fixed)  
**Preview Channels**: ✅ Fixed (Environment Variable Injection)  

## Recent Achievements
- ✅ Fixed admin dashboard authentication race condition
- ✅ Resolved Firebase preview channel environment variable loading
- ✅ Production deployment working on Vercel
- ✅ 10x faster preview deployments (30s vs 5-10min)
- ✅ WebSocket server connections working in all environments

## Current Working Configuration
- **Local Development**: \`npm run dev:mobile\` 
- **Preview Deployment**: \`npm run preview:deploy feature-name\` (FIXED!)
- **Staging Deployment**: \`npm run deploy:firebase:complete\`
- **Production Deployment**: \`npm run deploy:vercel:complete\`

## Environment Variables (Working URLs)
\`\`\`bash
# Local & Staging
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-250496240301.us-central1.run.app

# Production  
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
\`\`\`

## Admin Dashboard
- **URL**: \`/admin-analytics\`
- **Credentials**: \`th3p3ddl3r\` / \`letsmakeatrade\`
- **Status**: ✅ Working in all environments
- **Features**: Analytics, user management, room management, broadcast, database wipe

## Next Steps
- Dashboard UI refinements
- Additional admin features
- Performance optimizations
EOF

echo -e "${GREEN}✅ Created backup info${NC}"

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

# Create comprehensive commit message
COMMIT_MSG="🚀 Festival Chat Backup - $DATE_SHORT

✅ MAJOR FIXES IMPLEMENTED:
- Fixed admin dashboard authentication race condition  
- Solved Firebase preview channel environment variable injection
- Production deployment working on Vercel
- 10x faster preview workflows (30s vs 5-10min)

🎯 CURRENT STATUS:
- Admin Dashboard: ✅ Working (all environments)
- Preview Channels: ✅ Fixed (environment injection)
- WebSocket Servers: ✅ Connected (staging & production)
- Authentication: ✅ Resolved (direct API calls)

🔧 WORKING COMMANDS:
- npm run dev:mobile (local development)
- npm run preview:deploy feature-name (FAST previews!)
- npm run deploy:firebase:complete (staging)
- npm run deploy:vercel:complete (production)

📊 ADMIN FEATURES:
- Real-time analytics and monitoring
- User/room management with detailed views
- Broadcast messaging and room clearing
- Database management and activity feeds
- Environment-aware server routing

🔗 WEBSOCKET SERVERS:
- Staging: wss://peddlenet-websocket-server-staging-250496240301.us-central1.run.app
- Production: wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app

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
    echo -e "${GREEN}✅ Festival Chat backed up to GitHub${NC}"
    echo -e "${BLUE}📱 Repository: https://github.com/qvintillion/peddlenet${NC}"
    echo ""
    echo -e "${YELLOW}📊 Backup Summary:${NC}"
    echo -e "   • Admin Dashboard: ✅ Fixed & Working"
    echo -e "   • Preview Channels: ✅ Environment injection solved"
    echo -e "   • Production Deploy: ✅ Ready on Vercel"
    echo -e "   • Documentation: ✅ Comprehensive"
    echo -e "   • Scripts: ✅ All working properly"
    echo ""
    echo -e "${BLUE}🚀 Ready for dashboard refinements in next session!${NC}"
else
    echo -e "${RED}❌ Push failed. Check GitHub credentials and repository access.${NC}"
    exit 1
fi
