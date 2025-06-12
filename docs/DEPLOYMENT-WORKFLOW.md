## 📅 **WebSocket Server Deployment (Updated June 2025)**

### **Latest WebSocket Server Updates**
- ✅ **CORS Fix**: Firebase preview domains now fully supported
- ✅ **Rate Limiting Protection**: Prevents infinite reconnection loops
- ✅ **Enhanced Stability**: Better Cloud Run cold start handling
- ✅ **API Endpoints**: Complete health monitoring and diagnostics

### **When to Deploy WebSocket Server**
The WebSocket server needs updating when:
- ✅ Adding new API endpoints
- ✅ Fixing CORS issues for new domains
- ✅ Updating connection resilience logic
- ✅ Server configuration or rate limiting changes
- ✅ Security or performance improvements

### **WebSocket Deployment Process**
```bash
# Deploy updated WebSocket server with latest fixes
./scripts/deploy-websocket-cloudbuild.sh

# Verify deployment
curl https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health

# Test CORS with preview domain
curl -H "Origin: https://festival-chat-peddlenet--test-abc123.web.app" \
     https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health

# Test with preview deployment
npm run preview:deploy test-websocket
```

**Current WebSocket Server:**
- **Version**: `1.2.2-preview-cors-fix`
- **URL**: `https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app`
- **Project**: `peddlenet-1749130439`
- **Features**: 
  - ✅ Firebase preview domain CORS support
  - ✅ Rate limiting loop prevention
  - ✅ Enhanced connection resilience
  - ✅ Health monitoring and diagnostics
  - ✅ Cloud Run optimization

# 🚀 Festival Chat - Complete Deployment Workflow

**Last Updated**: June 11, 2025  
**Status**: Production Ready with Firebase CORS Fix Complete

## 🎯 **Overview**

Festival Chat uses a **4-tier deployment strategy** for safe, iterative development:

```
Local Development → Preview Testing → Firebase Staging → GitHub Production
```

**Recent Updates (June 11, 2025):**
- ✅ **WebSocket CORS Fixed** - Firebase hosting domains fully supported
- ✅ **API Endpoints Complete** - All required endpoints now available
- ✅ **Data Format Issues Resolved** - Fixed JavaScript errors in peer connections
- ✅ **Clean Deployment Process** - Streamlined Cloud Build deployment

## 🔄 **Complete Workflow**

### **1. Local Development**
```bash
npm run dev:mobile
```
- **Purpose**: Feature development and initial testing
- **URL**: `http://localhost:3000` (desktop) + `http://[IP]:3000` (mobile)
- **Features**: Full WebSocket server, SQLite persistence, cross-device testing
- **When to use**: All development work, initial feature testing

### **2. Preview Testing (Firebase Channels)**
```bash
# Manual preview deployment
npm run preview:deploy feature-name
# → https://festival-chat-peddlenet--feature-name.web.app
```
- **Purpose**: Shareable testing, stakeholder review, real environment validation
- **URL**: `https://festival-chat-peddlenet--[channel-name].web.app`
- **Features**: Production infrastructure, real URLs, mobile testing
- **When to use**: Feature testing, stakeholder demos, pre-staging validation

### **3. Firebase Staging (Pre-Production)**
```bash
npm run deploy:firebase:complete  
# → https://festival-chat-peddlenet.web.app
```
- **Purpose**: Final validation before production, production-identical testing
- **URL**: `https://festival-chat-peddlenet.web.app`
- **Features**: Full production stack, cache busting, infrastructure updates
- **When to use**: Major releases, infrastructure changes, final validation

### **4. GitHub Production (Live Users)**
```bash
git push origin main
./deploy.sh
# → Live production URL
```
- **Purpose**: Real user deployment
- **URL**: Your actual production domain
- **Features**: Live user traffic, permanent deployment
- **When to use**: Confirmed features ready for real users

## 🎪 **When to Use Each Environment**

### **🚀 Skip Firebase Staging (Streamlined)**
**Direct Preview → Production for most changes:**

```bash
# Small bug fixes, UI tweaks, content updates
npm run dev:mobile              # Local development
npm run preview:deploy test     # Preview testing  
git push origin main && ./deploy.sh  # Straight to production
```

**Perfect for:**
- ✅ Small bug fixes
- ✅ UI tweaks and improvements
- ✅ Content updates
- ✅ When preview testing was thorough

### **🛡️ Use Firebase Staging (Extra Safety)**
**Preview → Firebase → Production for major changes:**

```bash
# Major feature releases, infrastructure changes
npm run dev:mobile                    # Local development
npm run preview:deploy major-feature  # Preview testing
npm run deploy:firebase:complete      # Firebase staging validation
git push origin main && ./deploy.sh  # Production deployment
```

**Perfect for:**
- ✅ Major feature releases (cross-room notifications, new UI)
- ✅ Infrastructure changes (WebSocket server updates)
- ✅ Mobile-critical features (QR scanning, notifications)
- ✅ When you want maximum confidence before production

## 📋 **Firebase Deployment Scripts**

### **Streamlined Firebase Scripts (Optimized June 2025)**

With the 4-tier workflow, Firebase staging scripts have been streamlined:

```bash
# Complete Deploy (Full Stack) - Primary staging script
npm run deploy:firebase:complete
```
- **Time**: ~5-8 minutes
- **Use when**: Infrastructure changes, major features needing staging validation
- **Deploys**: Cloud Run + Hosting + Functions
- **When**: Optional step for complex changes before production

```bash
# Emergency/Troubleshooting Scripts
npm run deploy:firebase:nuclear       # Complete rebuild (emergency)
npm run deploy:firebase:cache-bust    # Stubborn cache issues
npm run deploy:firebase:functions     # Functions-only (niche use)
```

### **✅ Removed Scripts (Replaced by Preview)**

The following Firebase scripts were removed as preview channels provide better testing:

- ❌ `deploy:firebase:quick` → Use `npm run preview:deploy` instead  
- ❌ `deploy:firebase:super-quick` → Use `npm run preview:deploy` instead
- ❌ `deploy:firebase:*-FIXED` → Historical fixes, no longer needed

**Why Preview is Better:**
- ✅ **Shareable URLs** for stakeholder review
- ✅ **Real production infrastructure** testing
- ✅ **Multiple concurrent channels** for different features  
- ✅ **Auto-cleanup** and better management
- ✅ **No staging environment pollution**

### **🛡️ Enhanced Safety Features (June 11, 2025)**

**Firebase complete deployment includes comprehensive protection:**

- 🛑 **Process Conflict Detection** - Stops conflicting dev servers (ports 3000/3001)
- 🛡️ **Environment Protection** - Backs up and restores `.env.local`
- 🧹 **Clean Deployment** - Cache busting and fresh builds guaranteed
- 🔄 **Seamless Recovery** - Automatic environment restoration

**Example Safe Deploy Output:**
```bash
$ npm run deploy:firebase:complete

🔧 Complete Firebase Deployment (Safe)
==================================================
💾 Protecting development environment...
✅ Backed up .env.local
⚠️ WARNING: Development server running on port 3000
Stop dev server and continue? (y/N): y
🛑 Stopping development servers...
🏗️ Building and deploying...
🔄 Restoring development environment...
✅ Restored original .env.local
🛡️ Development environment protected
📱 To restart development: npm run dev:mobile
```

## 🎯 **Preview Channel Management**

### **Automatic Preview (PR-Based)**
```bash
# Create PR → Automatic preview deployment
git checkout -b feature/new-room-system
git push origin feature/new-room-system
# → GitHub creates PR
# → Auto-deploys to: festival-chat-peddlenet--pr-123-[hash].web.app
# → Posts preview URL in PR comments
```

### **Manual Preview Deployment**
```bash
# Deploy specific feature for testing
npm run preview:deploy room-navigation-test
# → https://festival-chat-peddlenet--room-navigation-test.web.app

# Deploy quick test (timestamp-based)
npm run preview:deploy
# → https://festival-chat-peddlenet--preview-20250611-1430.web.app
```

### **Preview Management Commands**
```bash
# List all active preview channels
npm run preview:list

# Full management interface
npm run preview:manage

# Show channels ready for cleanup
npm run preview:cleanup

# Open specific preview in browser
npm run preview:manage open feature-test
```

## 🏗️ **Architecture Overview**

### **Development Environment**
- **Frontend**: Next.js dev server (localhost:3000)
- **Backend**: Local signaling server (localhost:3001)
- **Database**: In-memory (development) or SQLite (testing)
- **Network**: Local IP detection for mobile testing

### **Preview Environment (Firebase Channels)**
- **Frontend**: Firebase Hosting (static export)
- **Backend**: Google Cloud Run (production WebSocket server)
- **Database**: SQLite with 24h retention
- **Network**: Full HTTPS, production infrastructure

### **Staging Environment (Firebase Main)**
- **Frontend**: Firebase Hosting (production build)
- **Backend**: Google Cloud Run (production server)
- **Database**: SQLite with full production settings
- **Network**: Production-identical infrastructure

### **Production Environment (GitHub)**
- **Frontend**: Your production hosting
- **Backend**: Production WebSocket server
- **Database**: Production SQLite configuration
- **Network**: Live user traffic

## 📊 **Deployment Decision Tree**

```
🤔 What type of change are you making?

├── 🐛 Bug Fix / Small UI Change
│   └── Local → Preview → Production
│       ├── npm run dev:mobile
│       ├── npm run preview:deploy bugfix
│       └── git push origin main && ./deploy.sh
│
├── ✨ New Feature / UI Enhancement
│   └── Local → Preview → [Optional: Staging] → Production
│       ├── npm run dev:mobile
│       ├── npm run preview:deploy new-feature
│       ├── [npm run deploy:firebase:complete] (if complex)
│       └── git push origin main && ./deploy.sh
│
├── 🏗️ Infrastructure / Server Changes
│   └── Local → Preview → Staging → Production
│       ├── npm run dev:mobile
│       ├── npm run preview:deploy infrastructure-test
│       ├── npm run deploy:firebase:complete
│       └── git push origin main && ./deploy.sh
│
└── 🚨 Critical/Emergency Fix
    └── Local → Production (Skip all intermediate steps)
        ├── npm run dev:mobile (quick test)
        └── git push origin main && ./deploy.sh
```

## 🎪 **Real-World Examples**

### **Example 1: Small Bug Fix**
```bash
# Issue: Button text overflow on mobile
# Solution: CSS adjustment

# 1. Local development
npm run dev:mobile
# → Fix CSS, test on mobile device

# 2. Preview testing  
npm run preview:deploy button-fix
# → Share with stakeholders for approval

# 3. Direct to production
git push origin main && ./deploy.sh
# → Live fix deployed
```

### **Example 2: Major Feature Addition**
```bash
# Issue: Adding cross-room notification system
# Solution: New WebSocket features + UI

# 1. Local development
npm run dev:mobile
# → Build feature, test locally

# 2. Preview testing
npm run preview:deploy cross-room-notifications
# → Share with team for testing

# 3. Firebase staging (extra safety)
npm run deploy:firebase:complete
# → Full infrastructure validation

# 4. Production deployment
git push origin main && ./deploy.sh
# → Roll out to users
```

### **Example 3: Emergency Hotfix**
```bash
# Issue: Production WebSocket server down
# Solution: Server configuration fix

# 1. Quick local test
npm run dev:mobile
# → Verify fix works

# 2. Immediate production
git push origin main && ./deploy.sh
# → Fastest path to resolution
```

## 🔧 **Troubleshooting Deployments**

### **Preview Channel Issues**
```bash
# Preview not updating
npm run preview:cleanup          # Clean old channels
npm run preview:deploy new-name  # Deploy fresh channel

# GitHub Actions failing
# → Check repository secrets
# → Verify Firebase service account
# → Review workflow logs
```

### **Firebase Staging Issues**
```bash
# Cache problems (SOLVED June 2025)
npm run deploy:firebase:cache-bust  # Nuclear cache clear

# Server connection issues
npm run deploy:firebase:complete    # Full redeploy
curl https://[cloud-run-url]/health # Check server health
```

### **Production Deployment Issues**
```bash
# GitHub push failures
./fix-github-push.sh  # Fix remote issues

# Deployment script problems
chmod +x deploy.sh    # Ensure executable
./deploy.sh           # Manual execution
```

## 📈 **Monitoring & Validation**

### **After Each Deployment Level**

**Preview Validation:**
- [ ] Preview URL loads correctly
- [ ] Core features work (room creation, messaging)
- [ ] Mobile compatibility verified
- [ ] Stakeholder approval received

**Staging Validation:**
- [ ] Firebase URL loads correctly  
- [ ] Full feature set working
- [ ] Cross-device testing passed
- [ ] Performance acceptable

**Production Validation:**
- [ ] Production URL loads correctly
- [ ] All features operational
- [ ] No errors in browser console
- [ ] Real user testing successful

### **Health Check URLs**
```bash
# Preview health
https://festival-chat-peddlenet--[channel].web.app

# Staging health  
https://festival-chat-peddlenet.web.app

# Production health
curl https://[production-url]/health

# WebSocket server health
curl https://[cloud-run-url]/health
```

## 🎯 **Best Practices**

### **Development Workflow**
- ✅ Always test locally first with `npm run dev:mobile`
- ✅ Use preview channels for stakeholder review
- ✅ Test on multiple devices before staging
- ✅ Validate staging before production

### **Deployment Safety**
- ✅ Use Firebase staging for major changes
- ✅ Skip staging for small, well-tested fixes
- ✅ Monitor each deployment level
- ✅ Have rollback plan ready

### **Team Collaboration**
- ✅ Share preview URLs for review
- ✅ Document significant changes
- ✅ Test cross-device functionality
- ✅ Communicate deployment schedule

---

## 🚀 **Ready for Production!**

This 4-tier deployment strategy provides:
- **🛡️ Safety** - Multiple validation stages
- **⚡ Speed** - Skip stages when appropriate  
- **🎯 Flexibility** - Adapt to change complexity
- **👥 Collaboration** - Shareable testing environments
- **🔄 Reliability** - Comprehensive error handling

Use the decision tree above to choose the right deployment path for each change!

---

## 📚 **Related Documentation**

- **[Firebase Preview Setup](./FIREBASE-PREVIEW-SETUP.md)** - Preview channel configuration
- **[Deployment Guide](./06-DEPLOYMENT.md)** - Detailed deployment instructions  
- **[Quick Start](./01-QUICK-START.md)** - Getting started guide
- **[Troubleshooting](./11-TROUBLESHOOTING.md)** - Common issues and solutions