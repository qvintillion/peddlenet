# 🚀 Festival Chat - Deployment Guide

## 📋 Overview

Festival Chat supports multiple deployment platforms:
- **Primary**: **Vercel** (auto-deployment from GitHub with custom domain)
- **Alternative**: Firebase Hosting for global CDN and HTTPS
- **Backend**: Google Cloud Run with Universal WebSocket Server

## 🎪 **ADMIN ANALYTICS DASHBOARD - PRODUCTION READY (JUNE 13, 2025)**

### **✅ FULLY RESTORED & DEPLOYED**

**Status**: 🟢 **Admin dashboard completely restored and production-ready**  
**Access**: `https://peddlenet.app/admin-analytics`  
**Credentials**: Username: `th3p3ddl3r` / Password: `letsmakeatrade`

**Key Restoration Achievements**:
- ✅ **Professional Authentication** - 24-hour persistent sessions with secure login
- ✅ **Real-time Analytics** - Live user/room monitoring with auto-refresh
- ✅ **Complete Admin Controls** - Broadcasting, room management, database operations
- ✅ **Mobile Responsive** - Full functionality on phones, tablets, and desktop
- ✅ **Production Compatible** - Works on all deployment platforms (Vercel, Cloud Run)
- ✅ **Network Resilient** - Graceful operation during connectivity issues

**Deployment Notes for Admin Dashboard**:
- **No special deployment needed** - Restored code works on all existing deployment workflows
- **Environment aware** - Automatically detects Vercel vs Cloud Run API paths
- **Session persistence** - 24-hour login sessions stored in localStorage
- **Hybrid architecture** - Frontend on Vercel, admin APIs on Cloud Run WebSocket server

**Related Documentation**:
- **[ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Complete admin dashboard guide
- **[ADMIN-ANALYTICS-RESTORATION-COMPLETE-JUNE-13-2025.md](./ADMIN-ANALYTICS-RESTORATION-COMPLETE-JUNE-13-2025.md)** - Technical restoration details

## 🎯 **CRITICAL FIX: Vercel Environment Variables (June 13, 2025)**

### **✅ RESOLVED: Admin Dashboard 404 Issue**

**Problem**: Admin dashboard showing 404 errors due to incorrect WebSocket server URL  
**Root Cause**: Vercel dashboard had old environment variable `NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app`  
**Solution**: Updated Vercel environment variable to current server: `wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app`

**✅ Current Status**: 
- **Admin dashboard is now accessible** at `https://peddlenet.app/admin-analytics`
- **WebSocket connection established** - Dashboard loads and connects to server
- **Authentication working** - Professional login system with 24-hour sessions
- **All features functional** - Real-time analytics, admin controls, activity feed

**Key Learning**: 
- **Multiple deployment platforms** can cause environment variable conflicts
- **Vercel serves the live site** at `peddlenet.app`, not GitHub Pages
- **Always verify which platform is actually serving your domain**

### **Vercel vs Other Platforms**

| Platform | Purpose | Domain | Environment Variables |
|----------|---------|--------|-----------------------|
| **Vercel** | **Primary Production** | `peddlenet.app` | Vercel Dashboard Settings |
| GitHub Pages | Secondary/Backup | `qvintillion.github.io/peddlenet` | `.env.production` file |
| Firebase | Staging/Preview | `festival-chat-peddlenet.web.app` | `.env.staging` file |

**✅ Fix Applied**:
1. Updated `NEXT_PUBLIC_SIGNALING_SERVER` in Vercel dashboard
2. Redeployed via automatic GitHub trigger
3. Verified admin dashboard now connects to correct WebSocket server
4. **Restored complete admin dashboard functionality** with production-ready features

**Prevention**: Always check Vercel dashboard environment variables when debugging production issues with custom domains.

## 🛠️ Available Deployment Scripts

### **🎯 OPTIMIZED WORKFLOW (FIXED - June 14, 2025)**

**✅ THE CORRECT WORKFLOW FOR UI/BACKEND CHANGES:**
```bash
# 1. Make your UI/backend changes
# 2. Deploy updated WebSocket staging server
./scripts/deploy-websocket-staging.sh

# 3. Deploy frontend preview (automatically uses new staging server)
npm run preview:deploy
```

**🔧 WHAT WAS FIXED:**
- **❌ Before**: Preview script used hardcoded old WebSocket URL
- **✅ After**: Preview script dynamically reads from `.env.staging` 
- **⚡ Result**: Fast, optimized workflow - changes show up immediately!

**📋 WHEN TO USE EACH SCRIPT:**

#### **🚀 Quick Preview (Optimized - USE THIS)**
```bash
npm run preview:deploy
```
**Use when**: Testing UI/backend changes after updating staging server  
**Prerequisites**: Run `./scripts/deploy-websocket-staging.sh` first  
**Time**: ~2-3 minutes  
**What it does**: Automatically uses current staging WebSocket server from `.env.staging`  
**Benefits**: ✅ Fast iteration, ✅ Always uses latest backend changes  

#### **🔥 Firebase Complete (When Things Break)**
```bash
npm run deploy:firebase:complete
```
**Use when**: UI synchronization issues, comprehensive cache busting needed  
**Time**: ~5-8 minutes  
**What it does**: Nuclear option - rebuilds everything, updates Cloud Run, clears all caches  
**Benefits**: ✅ Fixes stubborn cache issues, ✅ Complete infrastructure refresh  

### **🎭 Staging-Only WebSocket Deploy**
```bash
./scripts/deploy-websocket-staging.sh
```
**Use when**: Testing server changes in isolation before full deployment  
**Time**: ~3-4 minutes  
**What it does**: Deploys universal server to staging Cloud Run only  
**Deploys**: Universal Server (staging environment)  

### **🏗️ Production WebSocket Deploy**
```bash
./scripts/deploy-websocket-cloudbuild.sh
```
**Use when**: Production server updates after staging validation  
**Time**: ~3-4 minutes  
**What it does**: Deploys universal server to production Cloud Run  
**Deploys**: Universal Server (production environment)  

### **🧨 Emergency Options**
```bash
# For stubborn cache issues
npm run deploy:firebase:cache-bust

# Nuclear option - complete rebuild
npm run deploy:firebase:nuclear
```

### **🎪 Admin Dashboard Deployment**
**No special deployment required** - The restored admin dashboard works with all existing deployment workflows:

```bash
# For admin dashboard UI changes
npm run deploy:firebase:quick

# For admin dashboard + backend changes  
npm run deploy:firebase:complete

# For production Vercel deployment (automatic)
git push origin main  # Auto-deploys to peddlenet.app
```

**Admin Dashboard Verification**:
```bash
# After any deployment, verify admin dashboard:
# 1. Access https://peddlenet.app/admin-analytics
# 2. Login with: th3p3ddl3r / letsmakeatrade
# 3. Verify real-time analytics display
# 4. Test admin controls (broadcast, clear room)
# 5. Check mobile responsiveness
```

## 🧡 **Universal Server Architecture (2025)**

### **Revolutionary One-Server Approach**
Festival Chat now uses a **single universal server** that automatically adapts to any environment:

```javascript
// signaling-server.js - The ONE and ONLY server
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local';
const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun';

console.log(`🎪 PeddleNet Universal Server Starting...`);
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
console.log(`🎯 Mode: ${isDevelopment ? 'DEVELOPMENT' : isStaging ? 'STAGING' : 'PRODUCTION'}`);
```

### **Environment Auto-Detection**
The universal server automatically configures itself based on deployment context:

| Environment | Detection | Features | Used By |
|-------------|-----------|----------|---------|
| **Development** | `NODE_ENV=development` or `PLATFORM=local` | Debug endpoints, mock analytics, verbose logging | `npm run dev:mobile` |
| **Staging** | `PLATFORM=firebase` or `NODE_ENV=staging` | Real analytics, optimized config, staging detection | `npm run deploy:firebase:complete` |
| **Production** | `PLATFORM=github/cloudrun` or `NODE_ENV=production` | Full optimization, production analytics, max performance | `./scripts/deploy-websocket-cloudbuild.sh` |

### **Universal Deployment Flow**
```
Development: signaling-server.js (local detection)
     ↓
Staging: signaling-server.js (firebase detection) 
     ↓
Production: signaling-server.js (production detection)
```

**Benefits:**
- ✅ **No Confusion** - One server file for all environments
- ✅ **Auto-Configuration** - Smart adaptation based on deployment
- ✅ **Future-Ready** - Analytics and mesh endpoints built-in
- ✅ **Clean Deployment** - All scripts reference the same file
- ✅ **Enhanced Development** - Better debugging and mobile support
- ✅ **Admin Dashboard Ready** - Built-in admin endpoints for restored dashboard

## 🚨 **CRITICAL: Cache Issue Resolution (June 2025)**

### **The Problem That Was Fixed**
Prior to June 10, 2025, deployment scripts had a critical issue:
- **Quick scripts only deployed Functions** ❌
- **Client-side code lives in Hosting** (not Functions)
- **Result**: Code changes didn't deploy, causing cache issues

### **Root Cause Analysis**
```bash
# BROKEN (Before Fix):
npm run deploy:firebase:quick
# → firebase deploy --only functions  ❌ (Missing hosting!)

npm run deploy:firebase:super-quick  
# → firebase deploy --only functions  ❌ (Missing hosting!)

# WORKING (After Fix):
npm run deploy:firebase:quick
# → firebase deploy --only hosting,functions  ✅

npm run deploy:firebase:super-quick
# → firebase deploy --only hosting,functions  ✅
```

### **What We Fixed**
1. **✅ All scripts now deploy hosting + functions**
2. **✅ Cache-busting built into all scripts**
3. **✅ Scripts follow original project specifications**
4. **✅ Better Firebase cache headers implemented**
5. **✅ Admin dashboard restoration works with all deployment scripts**

### **Cache-Busting Measures**
All deployment scripts now include:
```bash
# Clear builds to ensure fresh deployment
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

# Deploy with proper cache headers
firebase deploy --only hosting,functions
```

### **Firebase Cache Headers (Updated)**
```json
{
  "hosting": {
    "headers": [
      {
        "source": "/index.html",
        "headers": [{"key": "Cache-Control", "value": "no-cache, no-store, must-revalidate"}]
      },
      {
        "source": "/_next/**",
        "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
      },
      {
        "source": "**/*.js",
        "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
      },
      {
        "source": "**/*.css", 
        "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
      }
    ]
  }
}
```

## 🔄 Development Workflow

### **🏠 FIXED: Proper Environment Separation (June 12, 2025)**

**✅ ISSUE RESOLVED:** Local development no longer requires staging server deployment!

**Four-Tier Environment Configuration:**
- **`.env.local`** → Development (localhost:3001)
- **`.env.preview`** → Preview Channels (Firebase Preview Channels + Preview WebSocket server)
- **`.env.staging`** → Final Staging (staging WebSocket server)
- **`.env.production`** → Production (production WebSocket server)

**Environment Switching:**
```bash
# Check current environment
npm run env:show

# Switch to development (localhost:3001)
npm run env:dev

# Switch to staging (staging WebSocket server)
npm run env:staging

# Switch to production (production WebSocket server)
npm run env:production
```

**Four-Tier Deployment Workflow:**
```bash
# 1. Local Development
npm run dev:mobile

# 2. Preview Channels (quick testing)
npm run preview:deploy feature-name

# 3. Final Staging (comprehensive validation)
npm run deploy:firebase:complete

# 4. Production Deployment
./deploy.sh  # or automatic via Vercel (git push)
```

**WebSocket Server Deployment (Separate Process):**
```bash
# FOR STAGING WebSocket server updates:
./scripts/deploy-websocket-staging.sh

# FOR PRODUCTION WebSocket server updates:
./scripts/deploy-websocket-cloudbuild.sh
```

**Note**: While Vercel auto-deploys when pushing to GitHub, the established workflow uses `./deploy.sh` for coordinated production deployment that handles both frontend and any necessary backend coordination.

### **Daily Development**
```bash
# Start development with mobile support
npm run dev:mobile

# Expected output:
# 🎪 PeddleNet Universal Server Starting...
# 📍 Environment: development
# 🎯 Mode: DEVELOPMENT
# ✅ Detected local IP: 192.168.1.66
# 🎵 PeddleNet Universal Server v2.0.0 running on port 3001
# 🔔 Features: Universal Environment Detection + WebSocket + Chat + Notifications + Room Codes + Admin Analytics
```

### **🆕 Enhanced Deployment Safety (June 11, 2025)**

**✅ Critical Development Workflow Protection**: 
- **Issue**: Dev servers becoming unstable during staging deployment due to port conflicts and environment corruption
- **Solution**: All Firebase deployment scripts now include comprehensive safety measures
- **Impact**: Eliminates deployment conflicts, protects development environment, enables seamless dev-to-staging workflow

**Safety Features in All Scripts**:
- 🛑 **Process Conflict Detection** - Detects and stops conflicting dev servers on ports 3000/3001
- 🛡️ **Environment Protection** - Backs up and restores `.env.local` to prevent staging variable corruption
- 🧹 **Clean Deployment** - Cache busting and fresh builds guaranteed
- 🔄 **Seamless Recovery** - Automatic environment restoration with restart instructions

**Enhanced Scripts**:
```bash
# All now include safety measures - no workflow changes needed!
npm run deploy:firebase:super-quick  # + Dev server safety
npm run deploy:firebase:quick        # + Environment protection  
npm run deploy:firebase:complete     # + Conflict prevention
```

**Example Safe Deploy Output**:
```bash
$ npm run deploy:firebase:quick

⚡ Quick Firebase Functions + Hosting Update (Safe)
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

### **🧡 Universal Server Deployment Workflow**

**Current Simplified Structure**:
```
festival-chat/
├── signaling-server.js            # 🧡 THE UNIVERSAL SERVER
├── Dockerfile.minimal            # → Uses signaling-server.js
├── deployment/
│   ├── cloudbuild-*.yaml        # → All reference signaling-server.js
│   ├── Dockerfile.cloudrun      # → Uses signaling-server.js
│   └── package.json             # → Updated for universal server
├── scripts/
│   ├── deploy-websocket-*.sh    # → All use signaling-server.js
│   └── dev-mobile.sh           # → Uses signaling-server.js
├── package.json                 # → "server": "node signaling-server.js"
└── archive/                     # 🗂️ All old servers safely archived
    ├── signaling-server-universal.js
    ├── signaling-server-dev-FIXED.js
    └── signaling-server-production-FIXED.js
```

**Benefits of Universal Architecture**:
- ✅ **One File to Rule Them All** - No confusion about which server to use
- ✅ **Auto-Environment Detection** - Smart adaptation based on deployment context
- ✅ **Future-Ready Endpoints** - Analytics and mesh features built-in
- ✅ **Clean Deployment** - All scripts reference the same universal file
- ✅ **Enhanced Development** - Better debugging and mobile support
- ✅ **Maintenance Simplicity** - Single codebase for all environments
- ✅ **Admin Dashboard Support** - Built-in admin endpoints for restored dashboard

**Server Selection Logic**:
- **Development**: `npm run server` → Uses `signaling-server.js` (auto-detects local)
- **Staging**: Firebase deployment → Uses `signaling-server.js` (auto-detects firebase)
- **Production**: Cloud Run deployment → Uses `signaling-server.js` (auto-detects production)

### **Testing Before Deploy**
```bash
# 1. Build test
npm run build:mobile
npm run start

# 2. Cross-device test
# Desktop: http://localhost:3000
# Mobile: http://[your-ip]:3000

# 3. Feature verification
# - Create room and generate QR code
# - Scan QR on mobile device  
# - Test bidirectional messaging
# - Verify message persistence (in production mode)

# 4. Admin dashboard test (if making admin changes)
# - Navigate to http://localhost:3000/admin-analytics
# - Login with: th3p3ddl3r / letsmakeatrade
# - Verify dashboard loads and connects
# - Test admin controls functionality
```

## 🏗️ Deployment Architecture

### **Production Environment**
- **Frontend URL**: `https://peddlenet.app` (Vercel) or `https://festival-chat-peddlenet.web.app` (Firebase)
- **Backend URL**: `wss://peddlenet-websocket-server-[hash]-uc.a.run.app`
- **Admin Dashboard**: `https://peddlenet.app/admin-analytics` ✅ **RESTORED & WORKING**
- **Server**: `signaling-server.js` with auto-detected production mode
- **Storage**: Environment-appropriate (in-memory for dev, SQLite for production)
- **SSL**: Automatic HTTPS via Vercel/Firebase/Cloud Run

### **Key Components**
```
Universal Production Stack:
├── Vercel/Firebase Hosting (Frontend)
│   ├── Next.js Static Export
│   ├── PWA Manifest & Service Worker  
│   ├── QR Code Generation
│   └── Admin Analytics Dashboard ✅ RESTORED
├── Google Cloud Run (Backend)
│   ├── Universal WebSocket Server (signaling-server.js)
│   ├── Auto-Environment Detection
│   ├── Room Management & Cleanup
│   ├── Admin API Endpoints ✅ WORKING
│   └── CORS Configuration for Frontend
└── Development Tools
    ├── Local IP Detection (dev:mobile)
    ├── Cross-device Testing Scripts
    ├── Health Check Endpoints
    └── Admin Dashboard Development Mode
```

## 📊 Deployment Status Verification

### **After Quick Deploy**
```bash
# 1. Check frontend
curl -I https://peddlenet.app  # or Firebase URL
# Should return: 200 OK

# 2. Test core functionality
# - Open app in browser
# - Create room successfully
# - Messages send/receive instantly

# 3. Test admin dashboard (if making admin changes)
# - Navigate to /admin-analytics
# - Login should work
# - Dashboard should load with real data
```

### **After Complete Deploy**
```bash
# 1. Check backend health
curl https://[new-cloud-run-url]/health
# Should return: {"status":"ok","version":"2.0.0-universal","environment":"production"}

# 2. Verify WebSocket connection
# - Open browser console
# - Should see: "🚀 Connected to chat server"
# - Should NOT see: "Server disconnected" errors

# 3. Cross-device test
# - Desktop browser + Mobile browser
# - QR code scanning should work
# - Real-time messaging should work

# 4. Admin dashboard verification ✅
# - Access admin-analytics URL
# - Login with credentials
# - Verify real-time analytics display
# - Test admin controls (broadcast, clear room)
# - Check mobile responsiveness
```

### **Universal Server Health Check**
```json
{
  "status": "ok",
  "service": "PeddleNet Universal Signaling Server",
  "version": "2.0.0-universal",
  "environment": "production",
  "platform": "cloudrun",
  "mode": "production",
  "description": "Universal WebRTC signaling server that adapts to all environments",
  "endpoints": {
    "health": "/health",
    "signaling": "/socket.io/",
    "admin": "/admin/*"
  },
  "features": ["WebSocket", "Chat", "Notifications", "Room Codes", "Admin Analytics"],
  "timestamp": 1699123456789
}
```

## 🔧 Troubleshooting Deployments

### **🚨 FIXED: Preview Deploy Environment Variable Issues (June 2025)**

#### **Problem**: Preview Deploys Not Picking Up UI Changes  
**Symptoms**:
- ❌ Preview server URL NOT found in build!
- UI changes not appearing in preview deployments
- Environment variables not properly baked into build
- Admin dashboard showing placeholder URLs with `[hash]`

**Root Cause**: 
1. Build cache not properly cleared between deployments
2. Environment variables not exported during build process
3. Preview verification script looking for wrong server pattern

**Solution Applied**:
```bash
# Enhanced cache clearing in preview deploy script
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/  # ← Added
rm -rf .firebase/           # ← Added

# Explicit environment variable export
export NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL"
export BUILD_TARGET="preview"

# Fixed verification pattern (preview uses staging server)
if grep -r "peddlenet-websocket-server-staging" .next/ >/dev/null 2>&1; then
    echo "✅ Found staging server URL in build"
fi
```

**Key Fix**: Preview deployments correctly use the **staging server**, not a separate preview server. The verification script was incorrectly looking for `peddlenet-websocket-server-preview` when it should look for `peddlenet-websocket-server-staging`.

**Verification After Fix**:
- ✅ Preview deployments pick up UI changes immediately
- ✅ Environment variables properly baked into build
- ✅ Admin dashboard shows correct server URLs
- ✅ Browser console shows proper server URL detection logs

### **🚨 Cache Issues (SOLVED)**

#### **"Code changes not appearing after deploy"**
```bash
# ✅ FIXED: All scripts now deploy hosting + functions
# Old problem: Scripts only deployed functions, not hosting
# Solution: Use any of our fixed deployment scripts

npm run deploy:firebase:quick        # ✅ Now deploys both
npm run deploy:firebase:super-quick  # ✅ Now deploys both  
npm run deploy:firebase:complete     # ✅ Always worked

# If still having cache issues:
npm run deploy:firebase:cache-bust   # Nuclear cache clear
```

#### **"Browser showing old version"**
```bash
# Clear browser cache completely:
# Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
# Firefox: Ctrl+F5
# Safari: Cmd+Option+R

# Or test in incognito/private mode

# Look for new build hash in network tab:
# Old: page-3f87604ab806f752.js
# New: page-dbdb4ab9a9667a27.js (should be different)
```

### **🎪 Admin Dashboard Troubleshooting**

#### **"Admin dashboard showing login form but not connecting"**
```bash
# ✅ FIXED: Authentication system restored
# Verify: Login with th3p3ddl3r / letsmakeatrade
# Should see: Dashboard loads with real-time analytics

# If still having issues:
# 1. Check browser console for authentication errors
# 2. Verify WebSocket server URL in network tab
# 3. Test API endpoints manually:
curl -u th3p3ddl3r:letsmakeatrade https://[server-url]/admin/analytics
```

#### **"Admin dashboard loads but shows no data"**
```bash
# Check backend admin endpoints:
curl https://[cloud-run-url]/admin/analytics
# Should return: Authentication required (401) - this is correct

# With authentication:
curl -u th3p3ddl3r:letsmakeatrade https://[cloud-run-url]/admin/analytics
# Should return: JSON with dashboard data

# If 404: Check universal server includes admin endpoints
curl https://[cloud-run-url]/health
# Should show: "features": ["WebSocket", "Chat", "Notifications", "Room Codes", "Admin Analytics"]
```

#### **"Admin dashboard not responsive on mobile"**
```bash
# ✅ FIXED: Mobile responsive design restored
# Verify: Access admin dashboard on mobile device
# Should see: Touch-friendly interface with proper scaling

# If still having issues:
# - Test on different mobile browsers (Safari, Chrome)
# - Check viewport meta tag in HTML
# - Verify touch targets are 44px minimum
```

### **Common Issues**

#### **"Container failed to start and listen on port" in Cloud Run**
```bash
# Cause: Server not binding to Cloud Run's PORT environment variable (8080)
# Solution: Universal server handles this automatically

# ✅ Fixed in signaling-server.js:
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  devLog(`🎵 PeddleNet Universal Server v2.0.0 running on port ${PORT}`);
});

# Universal server auto-detects Cloud Run environment
```

#### **"Server disconnected" in production**
```bash
# Cause: Backend deployment failed or CORS issues
# Solution: Run complete deployment
npm run deploy:firebase:complete

# Verify backend health manually:
curl https://[cloud-run-url]/health
```

#### **QR codes don't work on mobile**
```bash
# Cause: HTTP vs HTTPS - WebRTC requires HTTPS
# Status: ✅ Resolved (Firebase provides HTTPS automatically)
# Verify: QR URLs should start with https://
```

#### **Messages don't persist**
```bash
# Cause: Development mode uses in-memory storage
# Solution: Check environment detection
curl https://[cloud-run-url]/health
# Should show: "environment": "production", "mode": "production"

# If showing development mode, check deployment:
npm run deploy:firebase:complete
```

#### **Mobile connections fail**  
```bash
# Cause: CORS configuration or network restrictions
# Verify: Check browser console for CORS errors
# Solution: Universal server includes mobile-optimized CORS:
# - https://festival-chat-peddlenet.web.app
# - https://peddlenet.app
# - https://*.firebaseapp.com
# - https://*.web.app
# - Local IPs for development
```

## 🎯 Deployment Checklist

### **Before Any Deployment**
- [ ] Test `npm run dev:mobile` works locally
- [ ] Test cross-device messaging (desktop ↔ mobile)
- [ ] Verify no console errors in browser
- [ ] Check universal server auto-detection
- [ ] **Verify correct deployment platform** (Vercel vs Firebase vs GitHub Pages)

### **Vercel Deployment Checklist** (Primary Platform)
- [ ] Check Vercel dashboard environment variables are correct
- [ ] Verify `NEXT_PUBLIC_SIGNALING_SERVER` points to current WebSocket server
- [ ] Push to GitHub (triggers automatic Vercel deployment)
- [ ] Verify: `https://peddlenet.app` loads correctly
- [ ] Test: Admin dashboard connects to correct WebSocket server
- [ ] Monitor: No WebSocket connection errors in browser console

### **Firebase Deployment Checklist** (Staging/Alternative)
- [ ] Changes are appropriate for Firebase hosting
- [ ] Run `npm run build:mobile` successfully
- [ ] Deploy: `npm run deploy:firebase:quick` or `npm run deploy:firebase:complete`
- [ ] Verify: Firebase URL loads correctly
- [ ] Test: Core messaging functionality still works

### **WebSocket Server Deployment**
- [ ] Backend changes require new universal server deployment
- [ ] Deploy staging: `./scripts/deploy-websocket-staging.sh`
- [ ] Test staging server functionality
- [ ] Deploy production: `./scripts/deploy-websocket-cloudbuild.sh`
- [ ] Update environment variables in **all platforms** (Vercel, Firebase, GitHub)
- [ ] Verify: Backend health check shows correct environment
- [ ] Test: Complete cross-device workflow

### **Universal Server Validation**
- [ ] Health endpoint shows correct version: `2.0.0-universal`
- [ ] Environment detection working: `development`/`staging`/`production`
- [ ] Platform detection accurate: `local`/`firebase`/`cloudrun`
- [ ] Features appropriate for environment (debug vs production)
- [ ] **All deployment platforms** connect to same WebSocket server

### **🎪 Admin Dashboard Checklist** ✅ **RESTORED**
- [ ] Access: `https://peddlenet.app/admin-analytics` loads correctly
- [ ] Login: Credentials `th3p3ddl3r` / `letsmakeatrade` work
- [ ] Dashboard: Real-time analytics display (users, rooms, messages)
- [ ] Controls: Admin functions work (broadcast, clear room, wipe database)
- [ ] Mobile: Responsive design functions on phones/tablets
- [ ] Session: 24-hour persistence works across browser refreshes
- [ ] Authentication: Secure login system with proper logout
- [ ] Network: Graceful degradation when server unavailable

## 🔄 Rollback Procedures

### **Frontend Rollback**
```bash
# Firebase keeps previous versions
firebase hosting:releases:list
firebase hosting:channel:deploy [previous-version]

# Vercel rollback via dashboard
# Navigate to Vercel dashboard → Deployments → Redeploy previous version
```

### **Backend Rollback**  
```bash
# Cloud Run keeps previous revisions
gcloud run revisions list --service=peddlenet-websocket-server
gcloud run services update-traffic peddlenet-websocket-server \
  --to-revisions=[previous-revision]=100
```

### **Admin Dashboard Rollback**
```bash
# If admin dashboard issues after deployment:
# 1. Restore from backup
cp backup/admin-analytics-restoration-june-13-2025/current-broken-page.tsx \
   src/app/admin-analytics/page.tsx

# 2. Redeploy with working version
npm run deploy:firebase:quick

# 3. Verify restoration
# Navigate to /admin-analytics and test login
```

## 📈 Post-Deployment Monitoring

### **Key Metrics to Watch**
- **Connection Success Rate**: Should be >95%
- **Message Latency**: Should be <100ms on same network
- **Cross-device Success**: QR scanning should work reliably
- **Mobile Compatibility**: iOS Safari + Android Chrome
- **Environment Detection**: Servers should auto-detect correctly
- **Admin Dashboard**: Login success rate and data loading

### **Health Check URLs**
```bash
# Frontend health (should load instantly)
https://peddlenet.app  # Primary
https://festival-chat-peddlenet.web.app  # Alternative

# Universal server health (should return JSON status with environment info)
https://[cloud-run-url]/health

# Admin dashboard health ✅ RESTORED
https://peddlenet.app/admin-analytics

# WebSocket health (check browser console)
# Should show: "🚀 Connected to chat server"
```

### **Admin Dashboard Monitoring** ✅ **RESTORED**
```bash
# Daily health checks for admin dashboard:
# 1. Access dashboard URL
# 2. Verify login works
# 3. Check real-time data display
# 4. Test admin controls
# 5. Monitor browser console for errors
# 6. Verify mobile responsiveness

# Key admin dashboard metrics:
# - Login success rate >99%
# - Data refresh every 5 seconds
# - Admin controls response time <2 seconds
# - Mobile accessibility on all devices
# - Session persistence across browser restarts
```

## 🎪 Production Features Enabled

✅ **Universal server architecture** - One server for all environments  
✅ **Auto-environment detection** - Smart adaptation per deployment  
✅ **Real-time messaging** - WebSocket-based with polling fallback  
✅ **Message persistence** - Environment-appropriate storage  
✅ **Cross-device sync** - Desktop ↔ Mobile messaging  
✅ **QR code invitations** - Camera-based room joining  
✅ **Connection resilience** - Auto-reconnection and retry logic  
✅ **Mobile optimization** - Touch UI and WebRTC compatibility  
✅ **PWA features** - Offline support and installable app  
✅ **Push notifications** - Background message alerts (user opt-in)  
✅ **Future-ready endpoints** - Analytics and mesh network foundation  
✅ **Admin analytics dashboard** - 🎪 **RESTORED: Professional festival management interface**  
✅ **24-hour admin sessions** - Persistent authentication for festival staff  
✅ **Real-time admin monitoring** - Live user/room analytics for event oversight  
✅ **Emergency admin controls** - Broadcasting and content moderation capabilities  
✅ **Mobile admin interface** - Touch-optimized for on-site festival administration  

---

## 🚀 Ready for Festival Deployment!

The deployment system is production-ready with **universal server architecture** and **fully restored admin analytics dashboard**:

### **Technical Excellence**
- **✅ One server file for all environments** - No confusion about which server to use
- **✅ Auto-environment detection** - Smart adaptation based on deployment context
- **✅ Future features foundation** - Analytics and mesh endpoints ready
- **✅ FIXED: Cache issue resolution** - All scripts deploy properly
- **✅ Admin dashboard restoration** - Professional festival management interface

### **Operational Capabilities**
- **Automated deployment scripts** for quick iteration
- **Health monitoring** and rollback procedures  
- **Cross-platform compatibility** for all devices
- **Enterprise-grade infrastructure** on Google Cloud
- **24/7 availability** with auto-scaling
- **Professional admin dashboard** for festival staff

### **Festival-Ready Features**
- **Real-time messaging** for instant communication
- **QR code room joining** for seamless user onboarding
- **Admin monitoring** for live event oversight
- **Emergency broadcasting** for festival announcements
- **Content moderation** with room clearing capabilities
- **Mobile optimization** for on-site festival staff

Use `npm run deploy:firebase:quick` for UI fixes and `npm run deploy:firebase:complete` for backend changes.

**Admin Dashboard Access**: `https://peddlenet.app/admin-analytics` (Credentials: `th3p3ddl3r` / `letsmakeatrade`)

## 📚 Related Documentation

- **[Admin Analytics Dashboard Complete Guide](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Complete admin dashboard documentation
- **[Admin Analytics Restoration Details](./ADMIN-ANALYTICS-RESTORATION-COMPLETE-JUNE-13-2025.md)** - Technical restoration summary
- **[Universal Server Architecture](./04-ARCHITECTURE.md)** - Technical details of the universal server approach
- **[Mobile Notification Fix Details](./CRITICAL-FIX-JUNE-2025.md)** - Technical details of mobile notification enhancement
- **[Troubleshooting Guide](./11-TROUBLESHOOTING.md)** - Common issues and solutions
- **[Next Steps Roadmap](./10-NEXT-STEPS-ROADMAP.md)** - Strategic deployment platform recommendations