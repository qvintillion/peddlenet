# 🚀 Festival Chat - Deployment Guide

## 📋 Overview

Festival Chat uses a dual-deployment architecture:
- **Frontend**: Firebase Hosting for global CDN and HTTPS
- **Backend**: Google Cloud Run for WebSocket server with SQLite persistence

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
**Deploys**: Cloud Run + Hosting + Functions  

### **🧨 Emergency Options**
```bash
# For stubborn cache issues
npm run deploy:firebase:cache-bust

# Nuclear option - complete rebuild
npm run deploy:firebase:nuclear
```

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

### **Daily Development**
```bash
# Start development with mobile support
npm run dev:mobile

# Expected output:
# ✅ Detected local IP: 192.168.1.66
# 🎵 Festival Chat Server running on port 3001
# 💾 SQLite persistence enabled!
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

### **🧹 Clean Signaling Server Architecture**

**Current Simplified Structure** (after cleanup):
```
festival-chat/
├── signaling-server.js                    # 🟢 ACTIVE: Development
├── signaling-server-sqlite-enhanced.js    # 🟢 ACTIVE: Production  
├── sqlite-persistence.js                  # 🟢 ACTIVE: Database helper
└── archive/                               # 🗂️ Archived backups
    ├── signaling-server-cloudrun.js       # 📦 Moved to archive
    ├── signaling-server-firebase.js       # 📦 Moved to archive
    ├── signaling-server-production.js     # 📦 Moved to archive
    ├── signaling-server-sqlite.js         # 📦 Moved to archive
    └── [other archived versions]          # 📦 Safe backups
```

**Benefits of Cleanup**:
- ✅ **Clear separation** - Development vs production environments
- ✅ **Reduced confusion** - Only 2 active server files (was 6+)
- ✅ **Better maintenance** - Single source of truth per environment
- ✅ **Faster development** - No confusion about which file to edit
- ✅ **Easier collaboration** - Team knows exactly which files are active

**Server Selection Logic**:
- **Development**: `npm run server` → Uses `signaling-server.js` (in-memory)
- **Production**: Dockerfile → Uses `signaling-server-sqlite-enhanced.js` (SQLite + optimizations)

### **🆕 SQLite Persistence with Smart Fallback (June 11, 2025)**

**✅ Production Database Optimization**: 
- **Primary**: `better-sqlite3` for production (faster, synchronous, no deprecation warnings)
- **Fallback**: `sqlite3` for development compatibility (Node.js v24 support)
- **Smart Detection**: Automatically uses best available SQLite library
- **Cross-Platform**: Works on all deployment environments

**Technical Implementation**:
```javascript
// Automatic fallback in sqlite-persistence.js:
try {
  Database = require('better-sqlite3');  // Production optimized
  console.log('📦 Using better-sqlite3 for persistence');
} catch (err) {
  // Development fallback for Node.js compatibility
  Database = createSqlite3Wrapper();  // Compatible wrapper
  console.log('⚠️ Using sqlite3 fallback');
}
```

**Benefits**:
- ✅ **Production**: No Firebase deployment warnings, faster performance
- ✅ **Development**: Compatible with Node.js v18-24, easy local setup
- ✅ **Deployment**: Robust across all environments without manual configuration
- ✅ **Maintenance**: Single codebase works everywhere

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
# - Verify message persistence
```

## 🏗️ Deployment Architecture

### **Production Environment**
- **Frontend URL**: `https://festival-chat-peddlenet.web.app`
- **Backend URL**: `wss://peddlenet-websocket-server-[hash]-uc.a.run.app`
- **Database**: SQLite with 24h message retention
- **SSL**: Automatic HTTPS via Firebase/Cloud Run
- **Server**: `signaling-server-sqlite-enhanced.js` with full optimizations

### **Key Components**
```
Production Stack:
├── Firebase Hosting (Frontend)
│   ├── Next.js Static Export
│   ├── PWA Manifest & Service Worker  
│   └── QR Code Generation
├── Google Cloud Run (Backend)
│   ├── WebSocket Server (signaling-server-sqlite.js)
│   ├── SQLite Database Persistence
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
# Should return: {"status":"ok","database":{"totalMessages":X}}

# 2. Verify WebSocket connection
# - Open browser console
# - Should see: "🚀 Connected to chat server"
# - Should NOT see: "Server disconnected" errors

# 3. Cross-device test
# - Desktop browser + Mobile browser
# - QR code scanning should work
# - Real-time messaging should work
```

## 🔧 Troubleshooting Deployments

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
# Solution: Ensure server uses process.env.PORT directly without fallbacks

# ✅ Fixed in signaling-server-sqlite.js:
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

# ❌ Don't use port fallback arrays in Cloud Run:
# const FALLBACK_PORTS = [3001, 3002, 3003]; // This breaks Cloud Run
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
# Cause: Wrong server type deployed
# Solution: Ensure SQLite server is deployed
./tools/deploy-complete.sh
# Should deploy signaling-server-sqlite.js (not production.js)
```

#### **Mobile connections fail**  
```bash
# Cause: CORS configuration or network restrictions
# Verify: Check browser console for CORS errors
# Solution: CORS should include Firebase domains:
# - https://festival-chat-peddlenet.web.app
# - https://*.firebaseapp.com
# - https://*.web.app
```

## 🎯 Deployment Checklist

### **Before Any Deployment**
- [ ] Test `npm run dev:mobile` works locally
- [ ] Test cross-device messaging (desktop ↔ mobile)
- [ ] Verify no console errors in browser
- [ ] Check message persistence works

### **Quick Deploy Checklist** (UI changes only)
- [ ] Changes are frontend-only (no server modifications)
- [ ] Run `npm run build:mobile` successfully
- [ ] Deploy: `npm run deploy:firebase:quick`
- [ ] Verify: Frontend URL loads correctly
- [ ] Test: Core messaging functionality still works

### **Complete Deploy Checklist** (Full stack)
- [ ] Backend changes require new server deployment
- [ ] Run `npm run build:mobile` successfully  
- [ ] Deploy: `npm run deploy:firebase:complete`
- [ ] Verify: Backend health check passes
- [ ] Verify: Frontend connects to new backend
- [ ] Test: Complete cross-device workflow
- [ ] Monitor: No errors in browser console

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

### **Health Check URLs**
```bash
# Frontend health (should load instantly)
https://festival-chat-peddlenet.web.app

# Backend health (should return JSON status)
https://[cloud-run-url]/health

# WebSocket health (check browser console)
# Should show: "🚀 Connected to chat server"
```

## 🎪 Production Features Enabled

✅ **Real-time messaging** - WebSocket-based with polling fallback  
✅ **Message persistence** - SQLite database with 24h retention  
✅ **Cross-device sync** - Desktop ↔ Mobile messaging  
✅ **QR code invitations** - Camera-based room joining  
✅ **Connection resilience** - Auto-reconnection and retry logic  
✅ **Mobile optimization** - Touch UI and WebRTC compatibility  
✅ **PWA features** - Offline support and installable app  
✅ **Push notifications** - Background message alerts (user opt-in)  

---

## 🚀 Ready for Festival Deployment!

The deployment system is production-ready with:
- **✅ FIXED: Cache issue resolution** - All scripts deploy properly
- **Automated deployment scripts** for quick iteration
- **Health monitoring** and rollback procedures  
- **Cross-platform compatibility** for all devices
- **Enterprise-grade infrastructure** on Google Cloud
- **24/7 availability** with auto-scaling

Use `npm run deploy:firebase:quick` for UI fixes and `npm run deploy:firebase:complete` for backend changes.

## 📚 Related Documentation

- **[Mobile Notification Fix Details](./CRITICAL-FIX-JUNE-2025.md)** - Technical details of mobile notification enhancement
- **[Cross-Room System](./archive/Cross-Room-Notification-System-Technical-Summary.md)** - Advanced multi-room functionality (archived)
- **[Troubleshooting Guide](./11-TROUBLESHOOTING.md)** - Common issues and solutions
