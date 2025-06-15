# 🚀 Enhanced Deployment Guide with Cache-Busting

*Updated: June 15, 2025 - Includes comprehensive cache-busting solutions*

## Overview

This guide covers the **enhanced deployment workflow** that eliminates cache-related issues through proven strategies including unique image tagging, explicit traffic management, and comprehensive health verification.

## 🔧 Deployment Workflows

### Development Environment
```bash
# Fast iteration, mobile testing, cross-device QR scanning
npm run dev:mobile
```

### Staging Environment (Preview Testing)
```bash
# Real environment testing, mobile validation, stakeholder review
npm run staging:unified feature-name
```

### Enhanced Cache-Busting Deployments

#### WebSocket Server Only (Staging)
```bash
# Enhanced staging WebSocket deployment with cache-busting
./scripts/deploy-websocket-staging.sh
```

**Features**:
- ✅ Unique Docker image tagging with Git SHA + timestamp
- ✅ No-traffic deployment with health verification
- ✅ Shortened traffic tags (stg-*) to comply with 46-char limit
- ✅ Explicit traffic routing only after verification

#### Complete Firebase + WebSocket Deployment (Staging)
```bash
# Full deployment with comprehensive cache-busting
npm run deploy:firebase:complete
```

#### Production Deployment
```bash
# Complete production deployment
npm run deploy:vercel:complete
```

## 🎯 Enhanced Cache-Busting Features

### WebSocket Server Deployment (`deploy-websocket-staging.sh`)
- ✅ **Unique Docker image tagging** using Git commit SHA + timestamp
- ✅ **--no-cache Docker builds** to force fresh layers
- ✅ **No-traffic deployment** followed by comprehensive health checks
- ✅ **Explicit traffic routing** only after health verification
- ✅ **Build info tracking** with version labels

### Firebase Complete Deployment (`deploy-complete-enhanced.sh`)
- ✅ **Comprehensive cache clearing** (Next.js, npm, Firebase)
- ✅ **Unique image tagging** for WebSocket server
- ✅ **Multi-stage health verification** before traffic routing
- ✅ **Environment variable verification** to prevent build issues
- ✅ **Development environment protection** with automatic restore

## 🛠️ Infrastructure Components

### Cloud Run Configuration
- **Service**: `peddlenet-websocket-server-staging`
- **Region**: `us-central1`
- **Machine Type**: `E2_HIGHCPU_8` for faster builds
- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Scaling**: 0-5 instances

### Firebase Hosting
- **Project**: `festival-chat-peddlenet`
- **URL**: `https://festival-chat-peddlenet.web.app`
- **Admin Dashboard**: `/admin-analytics`

### Environment Variables
```bash
# Staging Configuration
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-*.a.run.app
BUILD_TARGET=staging
NODE_ENV=production
```

## 🧪 Testing & Verification

### Health Check Endpoints
```bash
# WebSocket server health
curl https://peddlenet-websocket-server-staging-*.a.run.app/health

# Tagged revision health (during deployment)
curl https://stg-20250615-133623---peddlenet-websocket-server-staging-*.a.run.app/health

# Firebase hosting
curl https://festival-chat-peddlenet.web.app

# Admin dashboard
curl https://festival-chat-peddlenet.web.app/admin-analytics
```

### Post-Deployment Verification Checklist
- [ ] WebSocket server health check passes
- [ ] Firebase hosting accessible
- [ ] Admin dashboard loads without errors
- [ ] Environment variables properly injected
- [ ] No placeholder URLs in build artifacts
- [ ] Connection status shows "Connected" in admin panel

## 🔥 Cache-Busting Strategies Implemented

### 1. Unique Docker Image Tagging
```bash
# Instead of :latest, use unique tags
gcr.io/project/service:bb43c70-20250615-133327
```

### 2. Explicit Traffic Management
```bash
# Deploy without traffic first
gcloud run deploy --no-traffic --tag="stg-20250615-133623"
# Verify health, then route traffic
gcloud run services update-traffic --to-latest
```
**Note**: Traffic tags use shortened format (stg-*) due to Cloud Run's 46-character limit.

### 3. Comprehensive Cache Clearing
- Next.js build cache (`rm -rf .next/`)
- npm cache (`npm cache clean --force`)
- Firebase cache (`rm -rf .firebase/`)
- Docker layer cache (`--no-cache --pull`)

### 4. Build-Time Cache Busting
```dockerfile
ARG CACHEBUST
ARG BUILD_TIMESTAMP
ARG GIT_COMMIT_SHA
# Force new layers with unique build info
RUN echo "Cache bust: ${CACHEBUST}" > /tmp/cache_bust
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### "Traffic stuck on old revision"
```bash
# Force traffic to latest revision
gcloud run services update-traffic peddlenet-websocket-server-staging --to-latest --region=us-central1
```

#### "Deployment appears successful but no changes visible"
1. Check if unique image tag was used
2. Verify health endpoint returns new version info
3. Clear browser cache or use incognito mode
4. Check Cloud Run console for active revisions

#### "Environment variables not picked up in build"
1. Verify `.env.staging` is properly formatted
2. Check that variables are copied to `.env.local` before build
3. Ensure `source .env.local` was executed
4. Look for placeholder URLs in build artifacts

#### "WebSocket connection fails"
1. Check WebSocket URL format (wss:// not https://)
2. Verify Cloud Run service allows unauthenticated access
3. Test health endpoint first
4. Check CORS configuration

## 📊 Monitoring & Analytics

### Cloud Run Console
https://console.cloud.google.com/run/detail/us-central1/peddlenet-websocket-server-staging?project=festival-chat-peddlenet

### Firebase Console  
https://console.firebase.google.com/project/festival-chat-peddlenet

### Key Metrics to Monitor
- WebSocket connection success rate
- Message delivery latency
- Error rates in admin dashboard
- Build times and deployment success

## 🔄 Rollback Procedures

### Staging Rollback
```bash
# List recent revisions
gcloud run revisions list --service=peddlenet-websocket-server-staging --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic peddlenet-websocket-server-staging --to-revisions=REVISION_NAME=100 --region=us-central1
```

### Emergency Production Rollback
```bash
# Vercel rollback
vercel --prod rollback
```

## 📈 Performance Optimizations

### Build Performance
- **E2_HIGHCPU_8** machines for faster Docker builds
- **Docker BuildKit** enabled for improved caching
- **Parallel npm installs** with clean cache strategy

### Runtime Performance  
- **0-5 auto-scaling** based on traffic
- **WebSocket connection pooling**
- **Efficient message routing** with room-based targeting

## 🔐 Security Considerations

### Access Control
- Cloud Run services allow unauthenticated access for WebSocket connections
- Firebase Security Rules protect admin dashboard
- Environment variables securely managed per environment

### CORS Configuration
- WebSocket server configured for cross-origin requests
- Admin dashboard restricted to authorized users
- API endpoints properly secured

---

*This enhanced deployment guide reflects the latest cache-busting strategies implemented on June 15, 2025. For historical fixes and session summaries, see the `/docs/archive/` folder.*
