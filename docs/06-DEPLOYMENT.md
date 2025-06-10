# 🚀 Festival Chat - Deployment Guide

## 📋 Overview

Festival Chat uses a dual-deployment architecture:
- **Frontend**: Firebase Hosting for global CDN and HTTPS
- **Backend**: Google Cloud Run for WebSocket server with SQLite persistence

## 🛠️ Available Deployment Scripts

### **Quick Firebase Updates** (UI Changes Only)
```bash
npm run deploy:firebase:quick
# OR
./tools/deploy-firebase-quick.sh
```
**Use when**: UI fixes, content updates, frontend-only changes  
**Time**: ~2-3 minutes  
**What it does**: Rebuilds frontend and deploys to Firebase, reuses existing backend

### **Complete Deployment** (Full Stack)
```bash
npm run deploy:firebase:complete  
# OR
./tools/deploy-complete.sh
```
**Use when**: Backend changes, new features, first-time deployment  
**Time**: ~5-8 minutes  
**What it does**: Deploys new WebSocket server to Cloud Run + rebuilds Firebase frontend

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
- **Automated deployment scripts** for quick iteration
- **Health monitoring** and rollback procedures  
- **Cross-platform compatibility** for all devices
- **Enterprise-grade infrastructure** on Google Cloud
- **24/7 availability** with auto-scaling

Use `npm run deploy:firebase:quick` for UI fixes and `npm run deploy:firebase:complete` for backend changes.