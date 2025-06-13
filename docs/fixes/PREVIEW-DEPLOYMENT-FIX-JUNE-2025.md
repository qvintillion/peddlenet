# 🔧 Preview Deployment Fix - June 2025

## Issue Fixed: Preview Deploys Not Picking Up UI Changes

### Problem
- ❌ Preview server URL NOT found in build!
- UI changes not appearing in preview deployments  
- Environment variables not properly baked into build
- Admin dashboard showing placeholder URLs with `[hash]`

### Root Cause
1. **Build cache not properly cleared** between deployments
2. **Environment variables not exported** during build process  
3. **Preview verification script looking for wrong server pattern**

### Solution Applied

#### 1. Enhanced Cache Clearing
```bash
# OLD (insufficient):
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/

# NEW (comprehensive):
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/  # ← Added
rm -rf .firebase/           # ← Added
```

#### 2. Explicit Environment Variable Export
```bash
# OLD (insufficient):
NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL" BUILD_TARGET="preview" npm run build:firebase

# NEW (explicit export):
export NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL"
export BUILD_TARGET="preview"
echo "NEXT_PUBLIC_SIGNALING_SERVER: $NEXT_PUBLIC_SIGNALING_SERVER"
echo "BUILD_TARGET: $BUILD_TARGET"
NEXT_PUBLIC_SIGNALING_SERVER="$PREVIEW_SERVER_URL" BUILD_TARGET="preview" npm run build:firebase
```

#### 3. Fixed Verification Pattern
```bash
# OLD (incorrect pattern):
if grep -r "peddlenet-websocket-server-preview" .next/ >/dev/null 2>&1; then

# NEW (correct pattern - preview uses staging server):
if grep -r "peddlenet-websocket-server-staging" .next/ >/dev/null 2>&1; then
```

### Key Insight
**Preview deployments correctly use the staging server**, not a separate preview server. The verification script was incorrectly looking for `peddlenet-websocket-server-preview` when it should look for `peddlenet-websocket-server-staging`.

### Files Modified
- `scripts/deploy-preview-simple.sh` - Enhanced cache clearing and environment handling
- `docs/06-DEPLOYMENT.md` - Added troubleshooting section

### Verification After Fix
- ✅ Preview deployments pick up UI changes immediately
- ✅ Environment variables properly baked into build  
- ✅ Admin dashboard shows correct server URLs
- ✅ Browser console shows proper server URL detection logs
- ✅ Build verification script shows: "✅ Found staging server URL in build"

### Environment Architecture
```
Development → localhost:3001
Preview → staging server (peddlenet-websocket-server-staging)  
Staging → staging server (peddlenet-websocket-server-staging)
Production → production server (peddlenet-websocket-server-production)
```

This fix ensures preview deployments work reliably for testing UI changes before committing to full staging deployment.
