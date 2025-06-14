# 🚀 Festival Chat - Deployment Configurations

## 📋 Essential Deployment Files

This directory contains the production-ready deployment configurations for Festival Chat's universal WebSocket server on Google Cloud Run.

### **📁 Current Files (5 essential)**

#### **Dockerfile.cloudrun** 🐳
**Production Docker configuration for Google Cloud Run**
- Multi-stage Alpine Linux build (minimal size)
- Health checks and proper signal handling
- Non-root user for security
- Optimized for Cloud Run environment

#### **cloudbuild-minimal.yaml** 🎭
**Staging deployment configuration**
- Used by `./scripts/deploy-websocket-staging.sh`
- Supports service name substitution
- Minimal dependencies for faster builds
- Default substitutions for staging environment

#### **cloudbuild-production.yaml** 🚀
**Production deployment configuration**
- Used by `./scripts/deploy-websocket-cloudbuild.sh`
- Cache-busting for fresh production builds
- Production environment variables
- Optimized Cloud Run settings

#### **package.json** 📦
**Universal server package configuration**
- Minimal dependencies (express, socket.io, cors)
- Version 2.0.0 with universal architecture
- Production-ready scripts
- Node.js 18+ requirement

---

## 🎯 **Deployment Workflow**

### **Staging Deployment**
```bash
./scripts/deploy-websocket-staging.sh
```
**Uses:** `cloudbuild-minimal.yaml` + `Dockerfile.cloudrun`  
**Target:** `peddlenet-websocket-server-staging`  
**Environment:** Auto-detects staging via environment variables  

### **Production Deployment**
```bash
./scripts/deploy-websocket-cloudbuild.sh
```
**Uses:** `cloudbuild-production.yaml` + `Dockerfile.cloudrun`  
**Target:** `peddlenet-websocket-server`  
**Environment:** Auto-detects production via environment variables  

---

## 🔧 **Configuration Details**

### **Universal Server Features**
- **Auto-environment detection** - Adapts behavior based on deployment context
- **Single codebase** - Same `signaling-server.js` for all environments  
- **Smart configuration** - Different features enabled per environment
- **Production optimization** - Memory limits, CPU allocation, scaling rules

### **Cloud Run Optimization**
```yaml
# Resource Configuration
memory: 512Mi
cpu: 1
port: 8080
min-instances: 0
max-instances: 5

# Environment Variables
NODE_ENV: production
BUILD_TARGET: staging|production  
PLATFORM: cloudrun
VERSION: 2.0.0-universal
```

### **Docker Multi-Stage Build**
```dockerfile
# Stage 1: Builder (dependency installation)
FROM node:18-alpine AS builder
# Install dependencies only

# Stage 2: Production (minimal runtime)
FROM node:18-alpine AS production  
# Copy built assets, add security, health checks
```

---

## 🗂️ **Archived Files (13 files)**

**Location:** `deployment/archive/cleanup-june-14-2025/`

### **Old Documentation**
- `COMPARISON.md` - Platform comparison (outdated)
- `GOOGLE-CLOUD-DEPLOYMENT.md` - Old deployment guide
- `GOOGLE-CLOUD-SUMMARY.md` - Legacy summary
- `PRODUCTION-DEPLOYMENT.md` - Railway/render guides (superseded)
- `URGENT-DEPLOYMENT.md` - Emergency deployment (resolved)

### **Alternative Platform Configs**
- `digitalocean-app.yaml` - DigitalOcean App Platform
- `railway.toml` - Railway deployment config
- `render.yaml` - Render deployment config
- `app.yaml` - Google App Engine config

### **Old Build Configurations**
- `Dockerfile` - Original Docker config (replaced by Dockerfile.cloudrun)
- `cloudbuild.yaml` - Original build config
- `cloudbuild-final.yaml` - Legacy final config
- `package-firebase.json` - Firebase-specific package

**Why Archived:**
- Superseded by universal server architecture
- Platform-specific configs no longer needed
- Outdated documentation replaced by main docs
- Legacy build configurations replaced by optimized versions

---

## 🧪 **Testing Deployment**

### **Health Check**
```bash
# Staging
curl https://peddlenet-websocket-server-staging-[hash].run.app/health

# Production  
curl https://peddlenet-websocket-server-[hash].run.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "PeddleNet Universal Signaling Server",
  "version": "2.0.0-universal", 
  "environment": "staging|production",
  "platform": "cloudrun",
  "timestamp": 1699123456789
}
```

### **Deployment Verification**
```bash
# Check Cloud Run service
gcloud run services list --platform managed --region us-central1

# Check service details
gcloud run services describe [service-name] --region us-central1
```

---

## 🔧 **Customization**

### **Modifying Resource Limits**
Edit the cloudbuild YAML files to adjust:
```yaml
args:
  - '--memory'
  - '1Gi'        # Increase memory
  - '--cpu'  
  - '2'          # Increase CPU
  - '--max-instances'
  - '10'         # Increase scaling
```

### **Adding Environment Variables**
```yaml
- '--set-env-vars'
- 'NODE_ENV=production,BUILD_TARGET=staging,CUSTOM_VAR=value'
```

### **Changing Regions**
```yaml
- '--region'
- 'us-west1'    # Different region
```

---

## 🎪 **Festival-Ready Features**

### **Production Capabilities**
- **Auto-scaling** - Scales from 0 to 5 instances based on demand
- **Health monitoring** - Built-in health checks and recovery
- **Environment detection** - Smart configuration per environment
- **Resource optimization** - Efficient memory and CPU usage
- **Global availability** - Deployed to Google's global infrastructure

### **Admin Dashboard Integration**
- **Analytics endpoints** - `/admin/analytics` for dashboard
- **User management** - `/admin/users` for festival staff
- **Broadcasting** - `/admin/broadcast` for announcements
- **Room control** - `/admin/clear-room` for moderation

---

## 📚 **Related Documentation**

- **[Deployment Guide](../docs/06-DEPLOYMENT.md)** - Complete deployment workflow
- **[Architecture Overview](../docs/04-ARCHITECTURE.md)** - Technical system design
- **[Scripts Guide](../scripts/README.md)** - Deployment scripts documentation
- **[Admin Dashboard Guide](../docs/ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Admin functionality

---

## 🛡️ **Security Features**

### **Container Security**
- **Non-root user** - Runs as dedicated `signaling` user
- **Minimal attack surface** - Alpine Linux base with minimal packages
- **Signal handling** - Proper process management with dumb-init
- **Health checks** - Automatic failure detection and recovery

### **Network Security**
- **CORS configured** - Only allows authorized origins
- **Environment isolation** - Staging and production fully separated
- **Auto-scaling limits** - Prevents resource exhaustion
- **Secure deployment** - Uses Google Cloud IAM and service accounts

---

**🎊 All deployment configurations are production-tested and festival-ready! 🎪**

**Ready for immediate deployment to Google Cloud Run with auto-environment detection and professional monitoring capabilities.**
