# Vercel Environment Configuration

**Date:** October 8, 2025
**Status:** ✅ Configured

## Summary

Vercel environment variables are now properly configured to automatically route deployments to the correct WebSocket servers:

- **Production deployments** → Production WebSocket server
- **Preview deployments** → Staging WebSocket server

## Configuration Details

### Production Environment

**Trigger:** Merges to `main` branch
**Domain:** `peddlenet.app`

**Environment Variable:**
```
NEXT_PUBLIC_SIGNALING_SERVER = wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
```

### Preview Environment

**Trigger:** Branch pushes and pull requests
**Domains:** `peddlenet-*.vercel.app` (auto-generated)

**Environment Variable:**
```
NEXT_PUBLIC_SIGNALING_SERVER = wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
```

## How It Works

### 1. Developer pushes to feature branch
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

### 2. Vercel automatically creates preview
- Vercel detects the push via GitHub webhook
- Builds the app with **Preview** environment variables
- Creates preview URL: `peddlenet-feature-new-feature.vercel.app`
- App connects to **staging WebSocket server**

### 3. Developer merges to main
```bash
git checkout main
git merge feature/new-feature
git push origin main
```

### 4. Vercel automatically deploys to production
- Vercel detects merge to `main`
- Builds the app with **Production** environment variables
- Deploys to: `peddlenet.app`
- App connects to **production WebSocket server**

## Benefits

✅ **Automatic routing** - No manual configuration needed per deployment
✅ **Safe testing** - Preview deployments use staging server, won't affect production data
✅ **Isolation** - Production and staging are completely separate
✅ **Consistency** - Every preview deployment works the same way

## Verification

### Check Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify:
   - `NEXT_PUBLIC_SIGNALING_SERVER` exists for **Production**
   - `NEXT_PUBLIC_SIGNALING_SERVER` exists for **Preview**
   - Values are different (production vs staging URLs)

### Check Deployment

**Production:**
1. Visit `https://peddlenet.app`
2. Open browser DevTools → Console
3. Look for WebSocket connection log
4. Should show: `wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app`

**Preview:**
1. Push a feature branch
2. Visit the preview URL from Vercel
3. Open browser DevTools → Console
4. Look for WebSocket connection log
5. Should show: `wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app`

## Environment Variable Management

### Adding New Variables

If you need to add new environment variables:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Click **Add Variable**
3. Set the variable for appropriate environments:
   - **Production** - Only production deployments
   - **Preview** - All preview deployments
   - **Development** - Local development (not typically used)

### Updating Variables

To update existing variables:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Find the variable
3. Click **Edit**
4. Update the value
5. Click **Save**
6. **Important:** Trigger a new deployment for changes to take effect

### Common Variables

| Variable | Production | Preview | Purpose |
|----------|------------|---------|---------|
| `NEXT_PUBLIC_SIGNALING_SERVER` | Production URL | Staging URL | WebSocket server endpoint |
| `NODE_ENV` | `production` | `production` | Next.js build mode |
| `BUILD_TARGET` | `production` | `preview` | Custom environment flag |

## Troubleshooting

### Preview deployment connecting to production server

**Symptoms:** Preview URL shows production server URL in console

**Fix:**
1. Check Vercel Dashboard → Environment Variables
2. Verify **Preview** environment has staging server URL
3. Trigger a new preview deployment:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin your-branch
   ```

### Production deployment connecting to staging server

**Symptoms:** `peddlenet.app` shows staging server URL in console

**Fix:**
1. Check Vercel Dashboard → Environment Variables
2. Verify **Production** environment has production server URL
3. Trigger a new production deployment:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

### Environment variable not updating

**Solution:**
1. Update variable in Vercel Dashboard
2. Wait 1 minute
3. Trigger new deployment (push a commit or click "Redeploy" in Vercel)
4. Clear browser cache
5. Check again

## Migration Notes

### Previous Setup (Before Oct 8, 2025)

- Preview deployments connected to **production** server
- No distinction between preview and production backend
- Testing on preview could affect production users

### Current Setup (After Oct 8, 2025)

- Preview deployments connect to **staging** server
- Complete isolation between preview and production
- Safe testing environment for all preview deployments

## Related Documentation

- [Main Deployment Guide](DEPLOYMENT.md) - Full deployment workflow
- [README.md](../README.md) - Environment variables section
- [Phase 1 WebSocket Optimizations](websocket-phase1-optimizations.md) - Server improvements

---

**Last Updated:** October 8, 2025
**Configured By:** Development team
**Status:** Active and working correctly
