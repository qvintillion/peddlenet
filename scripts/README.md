# 🛠️ Festival Chat Scripts Directory

## 📋 Essential Scripts Overview

This directory contains the core scripts for Festival Chat development, deployment, and maintenance.

### 🚀 **Core Development Scripts**

#### **dev-mobile.sh** 🏠
**Primary development script for mobile testing**
```bash
./scripts/dev-mobile.sh
```
- Auto-detects local network IP for mobile access
- Starts universal server + Next.js frontend
- Enables QR code scanning from mobile devices
- Uses in-memory persistence for development

#### **env-switch.sh** 🔄
**Environment management script**
```bash
./scripts/env-switch.sh [show|dev|preview|staging|production]
```
- Switches between development/staging/production environments
- Updates environment variables safely
- Shows current environment configuration

### 🎭 **Deployment Scripts**

#### **deploy-websocket-staging.sh** 🎭
**Staging WebSocket server deployment**
```bash
./scripts/deploy-websocket-staging.sh
```
- Deploys universal server to Google Cloud Run (staging)
- Auto-generates staging environment variables
- Used by preview channels and staging deployments

#### **deploy-websocket-cloudbuild.sh** 🚀
**Production WebSocket server deployment**
```bash
./scripts/deploy-websocket-cloudbuild.sh
```
- Deploys universal server to Google Cloud Run (production)
- Used by production Vercel deployment
- Full production optimization

#### **deploy-production-vercel.sh** 🌐
**Complete production deployment to Vercel**
```bash
./scripts/deploy-production-vercel.sh
```
- Builds and deploys frontend to Vercel
- Coordinates with production WebSocket server
- Updates GitHub backup automatically

### 🎪 **Preview & Testing Scripts**

#### **deploy-preview-enhanced.sh** 🎆
**Firebase preview channel deployment**
```bash
./scripts/deploy-preview-enhanced.sh [channel-name]
```
- Creates Firebase preview channels for testing
- Auto-connects to staging WebSocket server
- Includes comprehensive cache-busting and verification

#### **preview-manager.sh** 📋
**Preview channel management**
```bash
./scripts/preview-manager.sh [list|cleanup]
```
- Lists all active preview channels
- Cleans up expired/old channels
- Manages Firebase preview channel lifecycle

### 🔧 **Utility & Fix Scripts**

#### **make-scripts-executable.sh** ⚡
**Makes all scripts executable**
```bash
./scripts/make-scripts-executable.sh
```
- Ensures all scripts have proper execute permissions
- Run after cloning or if permissions get reset

#### **nuclear-admin-fix.sh** 🧨
**Emergency admin dashboard repair**
```bash
./scripts/nuclear-admin-fix.sh
```
- Comprehensive admin dashboard restoration
- Fixes authentication and API connectivity issues
- Use when admin dashboard is completely broken

#### **nuclear-cache-bust-preview.sh** 💥
**Aggressive cache clearing for preview deployments**
```bash
./scripts/nuclear-cache-bust-preview.sh
```
- Clears all caches (npm, Firebase, browser)
- Forces fresh builds and deployments
- Use when preview changes aren't appearing

---

## 🎯 **Common Workflows**

### **Daily Development**
```bash
# Start development with mobile support
./scripts/dev-mobile.sh

# Open on mobile: http://[your-ip]:3000/diagnostics
```

### **Testing New Features**
```bash
# Deploy to preview channel for testing
./scripts/deploy-preview-enhanced.sh feature-name

# Test admin dashboard on preview
# https://festival-chat-peddlenet--feature-name-[hash].web.app/admin-analytics
```

### **Staging Deployment**
```bash
# Update staging WebSocket server (if needed)
./scripts/deploy-websocket-staging.sh

# Deploy to staging
npm run deploy:firebase:complete
```

### **Production Deployment**
```bash
# Update production WebSocket server (if needed)
./scripts/deploy-websocket-cloudbuild.sh

# Deploy to production (Vercel)
./scripts/deploy-production-vercel.sh
```

### **Emergency Fixes**
```bash
# If admin dashboard is broken
./scripts/nuclear-admin-fix.sh

# If preview deployments aren't updating
./scripts/nuclear-cache-bust-preview.sh
```

---

## 📊 **Script Dependencies**

### **Required Tools**
- **Node.js 18+**: All scripts
- **Firebase CLI**: Preview and staging deployments
- **Google Cloud CLI**: WebSocket server deployments
- **Git**: Backup and version control
- **Vercel CLI**: Production deployments

### **Environment Files Used**
- **`.env.local`**: Development environment
- **`.env.preview`**: Preview channel environment  
- **`.env.staging`**: Staging deployment environment
- **`.env.production`**: Production deployment environment

### **Authentication Required**
- **Firebase**: `firebase login`
- **Google Cloud**: `gcloud auth login`
- **Vercel**: `vercel login`
- **GitHub**: SSH keys or personal access token

---

## 🎪 **Festival-Ready Features**

All scripts support the complete Festival Chat feature set:

### **✅ Core Features**
- **Real-time messaging** with WebSocket fallback
- **QR code room joining** for instant connections
- **Cross-device synchronization** (desktop ↔ mobile)
- **Message persistence** with automatic cleanup
- **Room code system** for verbal sharing

### **✅ Admin Dashboard** (Fully Restored June 2025)
- **Professional authentication** with 24-hour sessions
- **Real-time analytics** with auto-refresh monitoring
- **Emergency controls** (broadcast, clear rooms, user management)
- **Mobile responsive** interface for on-site festival staff
- **Activity tracking** with persistent history

### **✅ Production Features**
- **Universal server architecture** with auto-environment detection
- **Connection resilience** with circuit breaker patterns
- **Mobile optimization** for festival network conditions
- **Enterprise scalability** supporting 50+ users per room

---

## 🔍 **Troubleshooting**

### **Scripts Won't Execute**
```bash
./scripts/make-scripts-executable.sh
```

### **Environment Issues**
```bash
# Check current environment
./scripts/env-switch.sh show

# Reset to development
./scripts/env-switch.sh dev
```

### **Preview Deployments Not Updating**
```bash
./scripts/nuclear-cache-bust-preview.sh
```

### **Admin Dashboard Broken**
```bash
./scripts/nuclear-admin-fix.sh
```

### **WebSocket Connection Issues**
```bash
# Redeploy staging server
./scripts/deploy-websocket-staging.sh

# Or production server
./scripts/deploy-websocket-cloudbuild.sh
```

---

## 📚 **Related Documentation**

- **[Deployment Guide](../docs/06-DEPLOYMENT.md)** - Complete deployment workflow
- **[Admin Dashboard Guide](../docs/ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Admin functionality
- **[Architecture Overview](../docs/04-ARCHITECTURE.md)** - Technical system design
- **[Troubleshooting Guide](../docs/11-TROUBLESHOOTING.md)** - Common issues and solutions

---

**🎊 All scripts are production-tested and festival-ready! 🎪**
