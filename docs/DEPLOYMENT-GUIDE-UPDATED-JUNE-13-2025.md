# 🚀 Festival Chat Deployment Guide - UPDATED JUNE 13, 2025

## 📚 Quick Reference

### ✅ WORKING DEPLOYMENTS (Use These)

#### 1. 🎭 Complete Staging (RECOMMENDED)
```bash
npm run deploy:firebase:complete
```
**Use for:** Full staging deployment with guaranteed working environment
- ✅ Deploys WebSocket server + Frontend
- ✅ Perfect environment synchronization  
- ✅ Always works
- ✅ Shows correct version and environment

#### 2. 🚀 Production (Vercel)
```bash
npm run deploy:vercel:complete
```
**Use for:** Live production deployment
- ✅ Deploys to peddlenet.app
- ✅ Uses production WebSocket server
- ✅ Production-ready

#### 3. 📱 Development (Local)
```bash
npm run dev:mobile
```
**Use for:** Local development and mobile testing
- ✅ Auto IP detection
- ✅ QR code generation
- ✅ Cross-device testing

### 🧪 PREVIEW DEPLOYMENTS

#### Standard Preview (Legacy - May Fail)
```bash
npm run preview:deploy feature-name
```
**Issues:** May show wrong version, server disconnected

#### Enhanced Preview with Health Validation (NEW)
```bash
npm run preview:deploy:health feature-name
```
**Features:**
- ✅ Validates staging server health first
- ✅ Deploys fresh server if needed  
- ✅ Verified environment synchronization
- ✅ Should work reliably

## 🔧 WebSocket Server Management

### Staging Server
```bash
./scripts/deploy-websocket-staging.sh
```

### Production Server  
```bash
./scripts/deploy-websocket-cloudbuild.sh
```

## 🚨 Troubleshooting Decision Tree

### Problem: Admin Dashboard Shows Wrong Version

**Solution 1:** Use complete staging deployment
```bash
npm run deploy:firebase:complete
```

**Solution 2:** Clear all caches and retry
```bash
# Clear build caches
rm -rf .next/ .firebase/ node_modules/.cache/

# Clear browser cache
# Chrome: Cmd+Shift+Delete → Clear all data
# Or use Incognito mode

# Retry deployment
npm run preview:deploy:health feature-name
```

### Problem: Environment Shows "Development" Instead of "Staging"

**Root Cause:** WebSocket server not responding or wrong environment

**Solution:** Use health-validated preview deployment
```bash
npm run preview:deploy:health feature-name
```

This will:
1. Check staging server health
2. Deploy fresh server if needed
3. Verify environment synchronization

### Problem: Server Disconnected/Can't Connect

**Root Cause:** Staging WebSocket server is down

**Solution 1:** Deploy fresh staging server
```bash
./scripts/deploy-websocket-staging.sh
```

**Solution 2:** Use complete deployment (includes server)
```bash
npm run deploy:firebase:complete
```

### Problem: Preview Shows Old Cached Version

**Root Cause:** Browser/Firebase caching

**Solutions:**
1. **Incognito mode** (fastest)
2. **Clear browser cache completely**
3. **Different browser/device**
4. **Hard refresh:** Cmd+Shift+R (Chrome), Cmd+Option+R (Safari)

## 📋 Environment Detection Reference

### Environment Logic
```
localhost/IP → development
*.web.app with -- → staging (preview)
*.web.app without -- → staging (main)
*.vercel.app/peddlenet.app → production
```

### Server URLs by Environment
```
Development: http://localhost:3001
Staging: wss://peddlenet-websocket-server-staging-xxx.run.app  
Production: wss://peddlenet-websocket-server-xxx.run.app
```

## 🎯 Deployment Best Practices

### 1. Always Test Staging First
```bash
# Deploy to staging
npm run deploy:firebase:complete

# Test at https://festival-chat-peddlenet.web.app/admin-analytics
# Verify: version, environment, connectivity

# Then deploy to production
npm run deploy:vercel:complete
```

### 2. For Quick Previews
```bash
# Use health-validated preview
npm run preview:deploy:health feature-name

# Test immediately in incognito mode
```

### 3. Emergency Protocol
If deployments are failing:
```bash
# 1. Check staging server health
curl https://peddlenet-websocket-server-staging-xxx.run.app/health

# 2. If unhealthy, deploy fresh server
./scripts/deploy-websocket-staging.sh

# 3. Use complete deployment
npm run deploy:firebase:complete

# 4. Test in incognito mode
```

## 🔍 Debug Commands

### Check Environment Info
In browser console:
```javascript
ServerUtils.getEnvironmentInfo()
```

### Test Server Health
```bash
curl https://peddlenet-websocket-server-staging-xxx.run.app/health
```

### View Environment Variables
```bash
cat .env.staging
cat .env.preview  
cat .env.production
```

## 📊 Success Indicators

### ✅ Successful Deployment Shows:
- **Version:** Current version (not v4.0.0-session-persistence)
- **Environment:** "staging" or "production" (not "development")
- **Connection:** "Connected to server" (not "Disconnected")
- **Admin Dashboard:** Loads and functions properly

### ❌ Failed Deployment Shows:
- **Version:** Old version (v4.0.0-session-persistence)
- **Environment:** "development" when should be staging
- **Connection:** "Disconnected" or error messages
- **Admin Dashboard:** Non-functional or missing data

## 🚀 Migration Path for Preview Scripts

All existing preview workflows should migrate to:
```bash
npm run preview:deploy:health feature-name
```

This provides the same functionality as the complete script but for preview channels:
- ✅ Server health validation
- ✅ Fresh server deployment if needed
- ✅ Environment synchronization
- ✅ Verified builds
- ✅ Comprehensive cache clearing

## 🎯 Final Notes

**Key Insight:** The complete staging script works because it deploys both backend and frontend together, ensuring perfect environment synchronization. Preview scripts failed because they assumed existing infrastructure was healthy.

**Solution:** Enhanced preview scripts now include server health validation and fresh server deployment when needed.

**Future:** All deployments should follow this pattern of backend-first, then frontend deployment with verification steps.
