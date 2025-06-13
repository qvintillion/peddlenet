# 🚀 Festival Chat - Deployment Guide

## 📋 Overview

Festival Chat uses a dual-deployment architecture:
- **Frontend**: Firebase Hosting for global CDN and HTTPS
- **Backend**: Google Cloud Run with Universal WebSocket Server

## 🛠️ Available Deployment Scripts

### **🚀 Super-Quick Deploy (Fastest)**
```bash
npm run deploy:firebase:super-quick
```
**Use when**: Rapid iteration during development  
**Time**: ~1-2 minutes  
**What it does**: Minimal output, skips health checks, cache-busting built-in  
**Deploys**: Hosting + Functions  

### **⚡ Quick Deploy (Fast)** 
```bash
npm run deploy:firebase:quick
```
**Use when**: Most frontend changes, UI fixes, content updates  
**Time**: ~2-3 minutes  
**What it does**: Skips Cloud Run, rebuilds and deploys Functions + Hosting  
**Deploys**: Hosting + Functions  

### **🔧 Complete Deploy (Full Infrastructure)**
```bash
npm run deploy:firebase:complete
```
**Use when**: Infrastructure changes, Cloud Run updates, first-time deployment  
**Time**: ~5-8 minutes  
**What it does**: Updates Cloud Run + rebuilds + deploys everything  
**Deploys**: Universal Server + Hosting + Functions  

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
./deploy.sh
```

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
# 🔔 Features: Universal Environment Detection + WebSocket + Chat + Notifications + Room Codes
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
```

## 🏗️ Deployment Architecture

### **Production Environment**
- **Frontend URL**: `https://festival-chat-peddlenet.web.app`
- **Backend URL**: `wss://peddlenet-websocket-server-[hash]-uc.a.run.app`
- **Server**: `signaling-server.js` with auto-detected production mode
- **Storage**: Environment-appropriate (in-memory for dev, SQLite for production)
- **SSL**: Automatic HTTPS via Firebase/Cloud Run

### **Key Components**
```
Universal Production Stack:
├── Firebase Hosting (Frontend)
│   ├── Next.js Static Export
│   ├── PWA Manifest & Service Worker  
│   └── QR Code Generation
├── Google Cloud Run (Backend)
│   ├── Universal WebSocket Server (signaling-server.js)
│   ├── Auto-Environment Detection
│   ├── Room Management & Cleanup
│   └── CORS Configuration for Firebase
└── Development Tools
    ├── Local IP Detection (dev:mobile)
    ├── Cross-device Testing Scripts
    └── Health Check Endpoints
```

## 📊 Deployment Status Verification

### **After Quick Deploy**
```bash
# 1. Check frontend
curl -I https://festival-chat-peddlenet.web.app
# Should return: 200 OK

# 2. Test core functionality
# - Open app in browser
# - Create room successfully
# - Messages send/receive instantly
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
    "signaling": "/socket.io/"
  },
  "timestamp": 1699123456789
}
```

## 🔧 Troubleshooting Deployments

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

**For detailed technical information**, see [Preview Deployment Fix Details](./fixes/PREVIEW-DEPLOYMENT-FIX-JUNE-2025.md).

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

### **Quick Deploy Checklist** (UI changes only)
- [ ] Changes are frontend-only (no server modifications)
- [ ] Run `npm run build:mobile` successfully
- [ ] Deploy: `npm run deploy:firebase:quick`
- [ ] Verify: Frontend URL loads correctly
- [ ] Test: Core messaging functionality still works

### **Complete Deploy Checklist** (Full stack)
- [ ] Backend changes require new universal server deployment
- [ ] Run `npm run build:mobile` successfully  
- [ ] Deploy: `npm run deploy:firebase:complete`
- [ ] Verify: Backend health check shows correct environment
- [ ] Verify: Frontend connects to updated backend
- [ ] Test: Complete cross-device workflow
- [ ] Monitor: No errors in browser console

### **Universal Server Validation**
- [ ] Health endpoint shows correct version: `2.0.0-universal`
- [ ] Environment detection working: `development`/`staging`/`production`
- [ ] Platform detection accurate: `local`/`firebase`/`cloudrun`
- [ ] Features appropriate for environment (debug vs production)

## 🔄 Rollback Procedures

### **Frontend Rollback**
```bash
# Firebase keeps previous versions
firebase hosting:releases:list
firebase hosting:channel:deploy [previous-version]
```

### **Backend Rollback**  
```bash
# Cloud Run keeps previous revisions
gcloud run revisions list --service=peddlenet-websocket-server
gcloud run services update-traffic peddlenet-websocket-server \
  --to-revisions=[previous-revision]=100
```

## 📈 Post-Deployment Monitoring

### **Key Metrics to Watch**
- **Connection Success Rate**: Should be >95%
- **Message Latency**: Should be <100ms on same network
- **Cross-device Success**: QR scanning should work reliably
- **Mobile Compatibility**: iOS Safari + Android Chrome
- **Environment Detection**: Servers should auto-detect correctly

### **Health Check URLs**
```bash
# Frontend health (should load instantly)
https://festival-chat-peddlenet.web.app

# Universal server health (should return JSON status with environment info)
https://[cloud-run-url]/health

# WebSocket health (check browser console)
# Should show: "🚀 Connected to chat server"
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

---

## 🚀 Ready for Festival Deployment!

The deployment system is production-ready with **universal server architecture**:
- **✅ One server file for all environments** - No confusion about which server to use
- **✅ Auto-environment detection** - Smart adaptation based on deployment context
- **✅ Future features foundation** - Analytics and mesh endpoints ready
- **✅ FIXED: Cache issue resolution** - All scripts deploy properly
- **Automated deployment scripts** for quick iteration
- **Health monitoring** and rollback procedures  
- **Cross-platform compatibility** for all devices
- **Enterprise-grade infrastructure** on Google Cloud
- **24/7 availability** with auto-scaling

Use `npm run deploy:firebase:quick` for UI fixes and `npm run deploy:firebase:complete` for backend changes.

## 📚 Related Documentation

- **[Universal Server Architecture](./04-ARCHITECTURE.md)** - Technical details of the universal server approach
- **[Mobile Notification Fix Details](./CRITICAL-FIX-JUNE-2025.md)** - Technical details of mobile notification enhancement
- **[Troubleshooting Guide](./11-TROUBLESHOOTING.md)** - Common issues and solutions
