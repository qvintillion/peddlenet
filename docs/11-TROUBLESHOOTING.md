# 🔧 Troubleshooting Guide

*Updated: June 15, 2025 - Includes cache-busting solutions*

## Common Deployment Issues

### 🔄 Cache-Related Issues

#### Problem: "Traffic tag and service name too long"
**Root Cause**: Cloud Run traffic tags combined with service name cannot exceed 46 characters

**Solution**: Enhanced scripts now use shortened tag format
```bash
# OLD (too long): staging-20250615-133623 
# NEW (compliant): stg-20250615-133623

# Manual fix if needed
gcloud run deploy SERVICE --tag="stg-$(date +%Y%m%d-%H%M%S)"
```

#### Problem: "Deployment successful but no changes visible"
**Root Cause**: Cloud Run container image caching or traffic routing issues

**Solutions**:
1. **Use enhanced deployment scripts**:
   ```bash
   # For WebSocket only
   ./scripts/deploy-websocket-staging.sh
   
   # For complete deployment
   npm run deploy:firebase:complete
   ```

2. **Force traffic to latest revision**:
   ```bash
   gcloud run services update-traffic peddlenet-websocket-server-staging --to-latest --region=us-central1
   ```

3. **Verify unique image tagging**:
   ```bash
   # Check if deployment used unique tag (not :latest)
   gcloud run revisions list --service=peddlenet-websocket-server-staging --region=us-central1
   ```

#### Problem: "Docker build uses cached layers"
**Solution**: Enhanced cache-busting is now automatic in new scripts
- ✅ `--no-cache` and `--pull` flags force fresh builds
- ✅ Unique image tags prevent cache reuse
- ✅ Build arguments include timestamps for layer invalidation

### 🌐 WebSocket Connection Issues

#### Problem: "WebSocket connection refused"
**Diagnostic Steps**:
1. **Check service health**:
   ```bash
   curl https://peddlenet-websocket-server-staging-*.a.run.app/health
   ```

2. **Verify URL format**:
   - ✅ Correct: `wss://service-url.a.run.app`
   - ❌ Wrong: `https://service-url.a.run.app`

3. **Test basic connectivity**:
   ```bash
   curl -I https://peddlenet-websocket-server-staging-*.a.run.app
   ```

#### Problem: "WebSocket connects but messages not working"
**Check admin dashboard**:
1. Visit: `https://festival-chat-peddlenet.web.app/admin-analytics`
2. Verify connection status shows "Connected"
3. Check for any error messages in browser console

### 🏗️ Build Issues

#### Problem: "Environment variables not picked up"
**Root Cause**: Variables not properly set during build time

**Solution**: Enhanced scripts now verify environment variables
```bash
# Automatic verification in enhanced scripts
source .env.local
if [ -z "$NEXT_PUBLIC_SIGNALING_SERVER" ]; then
    echo "❌ CRITICAL: Environment variable not set!"
    exit 1
fi
```

#### Problem: "Placeholder URLs in build artifacts"
**Check build output**:
```bash
# Look for placeholder URLs in admin analytics page
grep -r "peddlenet-websocket-server-\[hash\]" .next/
```

**Solution**: Enhanced build verification now catches this automatically

### 🔥 Firebase Hosting Issues

#### Problem: "Admin dashboard not loading"
**Diagnostic Steps**:
1. **Clear browser cache** or use incognito mode
2. **Check Firebase deployment status**:
   ```bash
   firebase hosting:sites:list
   ```
3. **Verify hosting configuration**:
   ```bash
   cat firebase.json | grep -A 10 hosting
   ```

#### Problem: "Functions not updating"
**Solution**:
```bash
# Force functions rebuild
cd functions
rm -rf lib/
npm run build
cd ..
firebase deploy --only functions
```

### ⚡ Performance Issues

#### Problem: "Slow WebSocket responses"
**Check server performance**:
1. **Monitor Cloud Run metrics**: CPU, memory usage
2. **Check connection count**: High connection count may require scaling
3. **Verify server logs**: Look for bottlenecks in Cloud Run console

#### Problem: "Build times too slow"
**Optimizations**:
- ✅ Enhanced scripts now use `E2_HIGHCPU_8` machines
- ✅ Docker BuildKit enabled for better caching
- ✅ Parallel dependency installation

### 🔧 Environment-Specific Issues

#### Development Environment

**Problem**: "Dev server conflicts with deployment"
**Solution**: Enhanced scripts automatically detect and stop dev servers
```bash
# Automatic in enhanced scripts
pkill -f "next dev" 2>/dev/null || true
pkill -f "signaling-server" 2>/dev/null || true
```

**Problem**: "Environment file corruption"
**Solution**: Enhanced scripts backup and restore `.env.local`
```bash
# Automatic backup before deployment
cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
```

#### Staging Environment

**Problem**: "Staging URL not accessible"
**Check deployment logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=peddlenet-websocket-server-staging" --limit=50
```

#### Production Environment

**Problem**: "Production deployment fails"
**Rollback strategy**:
```bash
# Vercel rollback
vercel --prod rollback

# Check previous deployments
vercel ls
```

## 🧪 Diagnostic Commands

### Health Checks
```bash
# WebSocket server
curl -s https://peddlenet-websocket-server-staging-*.a.run.app/health | jq

# Firebase hosting
curl -I https://festival-chat-peddlenet.web.app

# Admin dashboard
curl -I https://festival-chat-peddlenet.web.app/admin-analytics
```

### Service Information
```bash
# Cloud Run service details
gcloud run services describe peddlenet-websocket-server-staging --region=us-central1

# Current revisions
gcloud run revisions list --service=peddlenet-websocket-server-staging --region=us-central1

# Traffic allocation
gcloud run services describe peddlenet-websocket-server-staging --region=us-central1 --format="value(spec.traffic)"
```

### Build Information
```bash
# Check environment variables
cat .env.staging

# Verify build artifacts
ls -la .next/server/app/admin-analytics/

# Check for placeholder URLs
grep -r "peddlenet-websocket-server-\[" .next/
```

## 🔄 Recovery Procedures

### Full Cache Reset
```bash
# Nuclear option - clears all caches
rm -rf .next/ functions/.next/ functions/lib/ out/
npm cache clean --force
rm -rf .firebase/

# Rebuild everything
npm run deploy:firebase:complete
```

### Service Recovery
```bash
# Restart WebSocket server
gcloud run services update peddlenet-websocket-server-staging --region=us-central1

# Force new deployment
./scripts/deploy-websocket-staging.sh
```

### Environment Recovery
```bash
# Restore development environment
cp .env.local.backup.* .env.local

# Reset to known good state
git checkout HEAD -- .env.local
```

## 📊 Monitoring & Alerts

### Key Metrics to Watch
- **WebSocket connection success rate**: >95%
- **Message delivery latency**: <100ms
- **Error rate**: <1%
- **Build time**: <5 minutes

### Logging Locations
- **Cloud Run logs**: Google Cloud Console > Cloud Run > Service > Logs
- **Firebase functions logs**: Firebase Console > Functions > Logs
- **Build logs**: Google Cloud Console > Cloud Build > History

### Emergency Contacts
- **Firebase Console**: https://console.firebase.google.com/project/festival-chat-peddlenet
- **Cloud Run Console**: https://console.cloud.google.com/run
- **GitHub Repository**: https://github.com/qvintillion/peddlenet

---

*For historical troubleshooting fixes and session summaries, see `/docs/archive/`*
