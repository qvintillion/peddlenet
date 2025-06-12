# WebSocket Server Deployment Scripts

This directory contains scripts for deploying the WebSocket signaling server to Google Cloud Run.

## 🚀 Main Deployment Scripts

### `deploy-websocket-cloudbuild.sh` ⭐ **RECOMMENDED**
- Uses Google Cloud Build (no local Docker required)
- Builds and deploys remotely via `deployment/cloudbuild-final.yaml`
- Most reliable option for all environments

**Usage:**
```bash
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"
chmod +x scripts/deploy-websocket-cloudbuild.sh
./scripts/deploy-websocket-cloudbuild.sh
```

### `deploy-websocket-docker.sh`
- Requires local Docker installation
- Builds container locally then pushes to Google Container Registry
- Use only if you have Docker Desktop running

**Usage:**
```bash
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"
chmod +x scripts/deploy-websocket-docker.sh
./scripts/deploy-websocket-docker.sh
```

## 📋 Configuration

**Deployment Target:**
- **Project:** `peddlenet-1749130439`
- **Service:** `peddlenet-websocket-server`
- **Region:** `us-central1`
- **URL:** `https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app`

## 📦 Current Version

**v1.2.2-api-endpoints-fix**
- ✅ Firebase hosting CORS support
- ✅ Preview channel support (`*--*.web.app`)
- ✅ Enhanced connection stability
- ✅ Mobile optimization
- ✅ Complete API endpoints (`/register-room-code`, `/room-stats/*`, `/resolve-room-code/*`)
- ✅ Fixed data format issues

## 🔧 What Gets Updated

The deployment updates your WebSocket server with:
- Firebase hosting domain support
- All required API endpoints
- Enhanced connection recovery
- Better mobile performance
- Room code management
- Room statistics tracking

## 🧪 Testing After Deployment

After successful deployment, test with:
1. Firebase preview: `npm run preview:deploy test-name`
2. Check health: `https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health`
3. Verify no CORS errors in browser console
4. Confirm WebSocket connection successful

## 📁 Related Files

- `deployment/cloudbuild-final.yaml` - Working Cloud Build configuration
- `deployment/Dockerfile.cloudrun` - Production Dockerfile
- `deployment/package.json` - WebSocket server dependencies
- `signaling-server-production.js` - Main server code with all features

## 🗑️ Cleaned Up

Removed temporary debugging files:
- `debug-build.sh`, `get-build-logs.sh` 
- `cloudbuild-test.yaml`, `cloudbuild-debug.yaml`, `cloudbuild-simple.yaml`
- Various temp Dockerfiles and test files

The scripts directory now contains only production-ready deployment tools.
