# 🚀 PeddleNet Deployment Guide - October 2025

**Status:** Official Post-Reset Deployment Strategy  
**Last Updated:** October 7, 2025

---

## 📋 Quick Reference

### **Production**
- **Platform:** Vercel
- **Domain:** https://peddlenet.app
- **Deploy:** `git push origin main` (auto-deploys)
- **Backend:** Production Cloud Run WebSocket server

### **Staging/Preview**
- **Platform:** Vercel Preview Deployments
- **URLs:** Auto-generated per branch/PR
- **Deploy:** `git push origin [branch]` (auto-creates preview)
- **Backend:** Staging Cloud Run WebSocket server

### **Development**
- **Command:** `npm run dev:mobile`
- **Frontend:** http://localhost:3000 or http://[your-ip]:3000
- **Backend:** Local signaling-server.js @ localhost:3001
- **Database:** In-memory (resets on restart)

---

## 🎯 Primary Deployment Platform: Vercel

### Why Vercel?

✅ **Native Next.js Support** - Built specifically for Next.js  
✅ **API Routes Work** - No configuration needed for `/api/*` endpoints  
✅ **Auto-Deploy from GitHub** - Push to deploy automatically  
✅ **Preview Deployments** - Every branch gets a preview URL  
✅ **Zero Configuration** - Works out of the box  
✅ **Fast Deployments** - 2-3 minutes typically  
✅ **Custom Domain** - peddlenet.app configured and working  

### How Vercel Integration Works

```
Your Computer          GitHub                 Vercel
     ↓                   ↓                      ↓
  git push    →    Webhook triggers    →    Auto-builds
     ↓                   ↓                      ↓
  Changes       GitHub notifies       Deploys to URL
  committed         Vercel                     ↓
                                         Live site
```

**This is the CORRECT setup and should not be changed.**

---

## 🔧 Backend: Cloud Run WebSocket Servers

### Universal Server Architecture

**IMPORTANT:** Both staging and production use the **same server code** (`signaling-server.js`) with a **universal architecture** that auto-detects its environment through environment variables.

- ✅ Single codebase for all environments
- ✅ Auto-detects: development, staging, or production
- ✅ Same deployment process, different targets
- ✅ Environment-specific behavior via `BUILD_TARGET` and `PLATFORM` variables

You maintain **TWO separate Cloud Run services** running the same universal server:

---

### 🎭 Staging Server

**Service:** `peddlenet-websocket-server-staging`
**URL:** `wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app`

**Purpose:**
- Test WebSocket server changes **before production**
- Safe environment for breaking changes
- Connected to Vercel preview deployments
- Connected to Firebase staging (if used)

**Connected to:**
- Vercel preview deployments (`festival-chat-*.vercel.app`)
- Firebase staging (`festival-chat-peddlenet.web.app`)
- Your testing and QA

**Deploy command:**
```bash
./scripts/deploy-websocket-staging.sh
```

**When to deploy:**
1. Testing changes to `signaling-server.js`
2. Before deploying to production
3. When you want to test without affecting live users

**Environment variables:**
- `NODE_ENV=production` (uses production Socket.IO settings)
- `BUILD_TARGET=staging` (identifies as staging)
- `PLATFORM=cloudrun`
- `VERSION=1.2.0-phase1-optimized`

**Cost:** $0 when idle (min-instances=0, scales to zero)

---

### 🚀 Production Server

**Service:** `peddlenet-websocket-server`
**URL:** `wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app`

**Purpose:**
- Serve **live users** on peddlenet.app
- Must be stable and reliable
- Only deploy tested changes

**Connected to:**
- Vercel production (`peddlenet.app` custom domain)
- Real users in production

**Deploy command:**
```bash
./scripts/deploy-websocket-cloudbuild.sh
```

**When to deploy:**
1. After testing changes on staging
2. When merging WebSocket changes to main
3. Only when confident changes are stable

**Environment variables:**
- `NODE_ENV=production` (uses production Socket.IO settings)
- `BUILD_TARGET=production` (identifies as production)
- `PLATFORM=cloudrun`
- `VERSION=1.2.0-phase1-optimized`

**Cost:** $0 when idle (min-instances=0, scales to zero)

---

### 🔄 Complete Deployment Workflow

**Safe deployment process:**

```bash
# 1. Test changes locally
npm run dev:mobile

# 2. Deploy to STAGING first
./scripts/deploy-websocket-staging.sh

# 3. Test on Vercel preview (automatically uses staging server)
git push origin feature/my-changes
# Vercel creates preview → connects to staging server

# 4. If staging tests pass, deploy to PRODUCTION
./scripts/deploy-websocket-cloudbuild.sh

# 5. Merge to main (Vercel auto-deploys to peddlenet.app)
git checkout main
git merge feature/my-changes
git push origin main
```

---

### ⚙️ How Universal Server Works

The same `signaling-server.js` file adapts its behavior based on environment:

```javascript
// Server auto-detects environment
const BUILD_TARGET = process.env.BUILD_TARGET || 'development';
const PLATFORM = process.env.PLATFORM || 'local';

const isStaging = BUILD_TARGET === 'staging';
const isProduction = BUILD_TARGET === 'production';
```

**Benefits:**
- No separate server files to maintain
- Consistent behavior across environments
- Easy to add environment-specific features
- Single source of truth

---

### 🎯 Why Two Servers?

**1. Safety**
- Test changes on staging without affecting production users
- Catch bugs before they reach live users
- Rollback is easier if issues occur

**2. Isolation**
- Staging crashes don't affect production
- Can test breaking changes safely
- Different scaling behavior

**3. Testing**
- Preview deployments test against staging backend
- Production deployment tests against production backend
- Matches real-world production environment

---

**Important:** The frontend (Vercel) and backend (Cloud Run) are separate deployments. Frontend auto-routes to correct backend via `next.config.ts`.

---

## 📋 Daily Development Workflow

### 1. Local Development
```bash
cd festival-chat
npm run dev:mobile

# This starts:
# - Next.js dev server @ localhost:3000
# - Local WebSocket server @ localhost:3001
# - Shows your IP for mobile testing (e.g., 192.168.1.66:3000)
```

**Test on mobile:**
- Connect phone to same WiFi
- Open `http://[your-ip]:3000` on phone
- QR codes will use your local IP automatically

### 2. Create Feature Branch
```bash
git checkout -b feature/my-new-feature

# Make changes
# Test locally

git add -A
git commit -m "feat: Add new feature"
```

### 3. Deploy to Staging (Preview)
```bash
git push origin feature/my-new-feature

# Vercel automatically:
# - Detects the push
# - Builds your code
# - Creates preview URL
# - Comments on PR with URL (if PR exists)
```

**Preview URL format:** `https://peddlenet-[branch]-[user].vercel.app`

**Check Vercel dashboard** for the preview URL or wait for GitHub comment.

### 4. Test on Preview
- Open preview URL in browser
- Test all features
- Check that everything works
- **Note:** QR codes on preview may have issues (see Known Issues)

### 5. Deploy to Production
```bash
# If preview looks good, merge to main
git checkout main
git merge feature/my-new-feature
git push origin main

# Vercel automatically deploys to https://peddlenet.app
# Takes 2-3 minutes
```

### 6. Verify Production
- Check https://peddlenet.app
- Test critical features
- Monitor for any issues

---

## 🔄 Deployment Commands

### Frontend Deployment (Vercel)

**Automatic (Recommended):**
```bash
# Production
git push origin main

# Preview/Staging
git push origin [branch-name]
```

**Manual (If needed):**
```bash
# Deploy current branch to preview
vercel

# Deploy to production
vercel --prod

# Or use npm script
npm run deploy:vercel:complete
```

### Backend Deployment (Cloud Run)

**Deploy Staging WebSocket Server:**
```bash
./scripts/deploy-websocket-staging.sh

# Takes ~3-4 minutes
# Updates staging server only
```

**Deploy Production WebSocket Server:**
```bash
./scripts/deploy-websocket-cloudbuild.sh

# OR use npm script:
npm run deploy:websocket:production

# Takes ~3-4 minutes
# Updates production server
```

**When to deploy backend:**
- ✅ When you modify `signaling-server.js`
- ✅ When you add new WebSocket event handlers
- ✅ When you change server logic
- ❌ NOT needed for frontend-only changes

---

## 🎯 Environment Configuration

### Environment Variables

Your app uses different WebSocket servers per environment:

**Development (.env.local - optional):**
```bash
# Usually not needed, uses localhost:3001 by default
```

**Staging (.env.staging):**
```bash
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
BUILD_TARGET=staging
NODE_ENV=production
```

**Production (.env.production):**
```bash
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
BUILD_TARGET=production
NODE_ENV=production
```

### ✅ Vercel Automatic Configuration (Current Setup)

**Environment variables are now configured in Vercel dashboard to automatically route to the correct WebSocket server:**

**Production Deployments** (triggered by merges to `main`):
```
NEXT_PUBLIC_SIGNALING_SERVER = wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
```
- Applies to: `peddlenet.app` production domain

**Preview Deployments** (triggered by branch pushes and PRs):
```
NEXT_PUBLIC_SIGNALING_SERVER = wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
```
- Applies to: All preview URLs (`peddlenet-*.vercel.app`)

**🎯 No manual configuration needed** - Vercel automatically sets the correct server based on deployment type.

**How to verify:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Check that:
   - Production environment has production server URL
   - Preview environment has staging server URL
3. Deploy and check the WebSocket connection in browser console

---

## 🔍 Environment Detection

The app automatically detects which environment it's running in:

```javascript
// From server-utils.ts

// Development: localhost or IP address
if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
  return 'development';  // Uses localhost:3001
}

// Staging: Firebase domains (legacy, not used anymore)
if (hostname.includes('.web.app')) {
  return 'staging';  // Would use staging server
}

// Production: Vercel domains
if (hostname.includes('peddlenet.app') || hostname.includes('.vercel.app')) {
  return 'production';  // Uses production server
}
```

**Current Setup (Environment-Based Routing via Vercel):**
- ✅ Local dev → localhost:3001
- ✅ Vercel preview → **Staging server** (via `NEXT_PUBLIC_SIGNALING_SERVER` env var)
- ✅ Vercel production → **Production server** (via `NEXT_PUBLIC_SIGNALING_SERVER` env var)

**Note:** While hostname detection returns 'production' for all Vercel domains, the actual WebSocket server used is determined by the `NEXT_PUBLIC_SIGNALING_SERVER` environment variable set in Vercel dashboard, which differs between production and preview environments.

---

## ⚠️ Known Issues

### QR Code Issue on Vercel Previews

**Problem:** Scanning QR codes on preview deployments may cause redirect errors.

**Cause:** Preview URL (`peddlenet-[branch]-[user].vercel.app`) might not be publicly accessible or requires Vercel authentication.

**Workaround:**
1. Test QR codes on production (`peddlenet.app`)
2. Or test QR codes on local dev with `npm run dev:mobile`
3. Preview deployments are for browser-based UI testing, not mobile QR testing

**Fix in progress:** Update QRModal.tsx to point to production URL when on preview.

---

## 🚫 What We're NOT Using Anymore

### ❌ Firebase Hosting (Replaced by Vercel)

**Previous setup:** Firebase Hosting for frontend  
**Problem:** Firebase = static hosting only, doesn't support Next.js API routes  
**Solution:** Switched to Vercel (native Next.js platform)  

**Legacy commands that still exist but shouldn't be used:**
```bash
npm run staging:unified [channel]     # ❌ Firebase - broken
npm run preview:deploy                # ❌ Firebase - broken  
npm run deploy:firebase:complete      # ❌ Firebase - don't use
```

**Why they're broken:**
- Firebase needs static export (`out/` directory)
- Your app has Next.js API routes that need server-side execution
- Would need Firebase Functions setup (complex, unnecessary)

**What to use instead:**
- ✅ `git push origin [branch]` for staging
- ✅ `git push origin main` for production
- ✅ `vercel` CLI if manual deploy needed

### ❌ Firebase Preview Channels

**Previous workflow:**
```bash
npm run staging:unified test-20251007
# Deployed to: festival-chat-peddlenet--test-20251007.web.app
```

**Replaced by:** Vercel Preview Deployments (automatic, no commands needed)

**Migration:** All Firebase-related deployment scripts archived but not deleted (in case needed as backup).

---

## 📚 Available npm Scripts

### ✅ Active Commands (Use These)

**Development:**
```bash
npm run dev              # Basic dev server
npm run dev:mobile       # Dev with IP detection for mobile
```

**Production Deployment:**
```bash
npm run deploy:vercel:complete         # Manual Vercel deploy
npm run deploy:websocket:production    # Deploy production WebSocket
npm run deploy:production:complete     # Both frontend + backend
```

**Utilities:**
```bash
npm run build            # Test production build
npm start                # Start production build locally
npm run backup:github    # Backup to GitHub
```

### ⚠️ Legacy Commands (Don't Use)

**Firebase Commands (Archived):**
```bash
npm run staging:unified              # ❌ Broken - needs static export
npm run preview:deploy               # ❌ Firebase - use Vercel instead
npm run preview:list                 # ❌ Firebase channels
npm run deploy:firebase:complete     # ❌ Firebase - use Vercel instead
```

**Why they still exist:** Historical backup, might be useful if Vercel has issues.

---

## 🎯 Deployment Checklist

### Before Any Deployment:

**Code Ready:**
- [ ] All changes committed
- [ ] Tests passing locally
- [ ] `npm run build` succeeds
- [ ] No console errors in dev

**Backend Changes:**
- [ ] If `signaling-server.js` changed → Deploy to staging server first
- [ ] Test WebSocket connection on staging
- [ ] Then deploy to production server

**Environment Variables:**
- [ ] Vercel dashboard variables are current
- [ ] Production server URL matches `.env.production`
- [ ] No localhost references in production code

### After Deployment:

**Verify Production:**
- [ ] https://peddlenet.app loads
- [ ] Can create room
- [ ] Can send messages
- [ ] WebSocket connects (check browser console)
- [ ] No error messages

**Cross-Platform:**
- [ ] Test on desktop browser
- [ ] Test on mobile browser (if possible)
- [ ] Admin dashboard accessible (if using)

---

## 🚀 Quick Deployment Guide

### Scenario 1: Frontend-Only Changes
```bash
# Make changes to UI, components, pages, etc.
git add -A
git commit -m "feat: Update UI"
git push origin main

# Vercel deploys automatically in 2-3 minutes
# Check https://peddlenet.app
```

### Scenario 2: Backend (WebSocket) Changes
```bash
# Make changes to signaling-server.js

# 1. Deploy to staging first
./scripts/deploy-websocket-staging.sh

# 2. Test staging (point a test deployment to staging server)
# Check that WebSocket connections work

# 3. Deploy to production
./scripts/deploy-websocket-cloudbuild.sh

# 4. Verify production WebSocket health
curl https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health
```

### Scenario 3: Full Stack Changes
```bash
# Make changes to both frontend and backend

# 1. Deploy staging backend
./scripts/deploy-websocket-staging.sh

# 2. Test frontend with staging backend
npm run dev:mobile
# Temporarily point to staging server if needed

# 3. Deploy production backend
./scripts/deploy-websocket-cloudbuild.sh

# 4. Deploy frontend
git push origin main

# 5. Verify everything works
```

---

## 🔧 Troubleshooting

### "Vercel deployment failed"
1. Check build logs in Vercel dashboard
2. Try building locally: `npm run build`
3. Fix any errors and push again

### "WebSocket won't connect"
1. Check server health: `curl https://[server-url]/health`
2. Verify environment variable in Vercel dashboard
3. Check browser console for connection errors
4. Redeploy WebSocket server if needed

### "QR codes don't work on mobile"
1. Test on production (`peddlenet.app`) not preview
2. Or test locally with `npm run dev:mobile`
3. Preview deployments are for browser testing only

### "Changes not showing up"
1. Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Check Vercel dashboard - deployment might still be building
3. Clear browser cache if needed
4. Verify you're on the correct URL (production vs preview)

---

## 📖 Related Documentation

**In docs/ folder:**
- [01-QUICK-START.md](./01-QUICK-START.md) - Getting started
- [04-ARCHITECTURE.md](./04-ARCHITECTURE.md) - System architecture
- [11-TROUBLESHOOTING.md](./11-TROUBLESHOOTING.md) - Common issues
- [OCTOBER-2025-RESET-AND-RECOVERY.md](./OCTOBER-2025-RESET-AND-RECOVERY.md) - What happened with the reset

**In root folder:**
- [DEPLOYMENT-SIMPLE-ANSWER.md](../DEPLOYMENT-SIMPLE-ANSWER.md) - Ultra-quick reference
- [COMMANDS-EXPLAINED.md](../COMMANDS-EXPLAINED.md) - All deployment commands explained

**Archived:**
- [docs/archive/june-2025-deployment-issues/](./archive/june-2025-deployment-issues/) - Old Firebase deployment docs

---

## 📊 Deployment History

**October 7, 2025:** Hard reset to clean state
- Removed mesh networking complexity
- Clarified Vercel as primary platform
- Archived Firebase deployment scripts
- Established simple git-push workflow

**June 2025:** Period of deployment confusion
- Multiple platforms being used simultaneously
- Environment variable conflicts
- Firebase vs Vercel vs GitHub Pages confusion
- Resolved by switching fully to Vercel

**Before June 2025:** Firebase Hosting primary
- Switched to Vercel for better Next.js support
- Kept Firebase scripts as backup

---

## ✅ Summary

**Your deployment is simple:**

**Development:**
```bash
npm run dev:mobile
```

**Staging:**
```bash
git push origin feature/branch
# Vercel creates preview automatically
```

**Production:**
```bash
git push origin main
# Vercel deploys to peddlenet.app automatically
```

**That's it!** No complex scripts, no Firebase channels, no manual deployments needed.

---

**Last Updated:** October 7, 2025  
**Status:** Official deployment guide post-reset  
**Platform:** Vercel (primary), Cloud Run (backend)
