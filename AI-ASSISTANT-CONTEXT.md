# 🤖 AI Assistant Context - PeddleNet Festival Chat

**Quick Reference for Claude and other AI assistants helping with this project**

---

## 🎯 Project Essence

**What:** Real-time WebSocket chat for music festivals
**Version:** 4.1-websocket-only (Phase 2 Complete - October 2025)
**Stack:** Next.js 14, React 18, Socket.IO, Tailwind CSS
**Deploy:** Vercel (frontend) + Google Cloud Run (backend)
**Philosophy:** Simple, fast, mobile-first, WebSocket-only, no accounts needed

---

## ⚠️ CRITICAL CONTEXT (Read First)

### Current Status: Phase 2 Complete - WebSocket Only
**Date:** October 9, 2025
**Version:** 4.1-websocket-only
**Action:** Phase 2 P2P code removal complete
**Result:** Clean WebSocket-only architecture, ~200 lines of code removed

### Recent Major Changes (October 2025)

**Phase 1 (Oct 7-8): Data Structure Optimization**
- ✅ Simplified activeUsers Map
- ✅ Fixed duplicate socket connections
- ✅ Improved admin dashboard accuracy
- **Version:** 4.0-optimized

**Phase 2 (Oct 9): P2P Code Removal**
- ✅ Removed socket.io-p2p-server package
- ✅ Removed all P2P event handlers (~170 lines)
- ✅ Simplified /mesh-status endpoint
- ✅ Frontend switched from useHybridChat → useWebSocketChat
- ✅ Fixed connection status indicator
- **Version:** 4.1-websocket-only

**Folder Cleanup (Oct 9):**
- ✅ Root folder: 32 files → 5 .md files
- ✅ Docs organized with active vs archived
- ✅ Old scripts moved to scripts/archive/
- ✅ Created docs/CURRENT-STATE-OCT-2025.md

### What Was Removed in Phase 2 (Don't Re-introduce)
❌ socket.io-p2p-server package and imports
❌ P2P server initialization
❌ 5 P2P event handlers (request-connection, connection-response, etc.)
❌ meshMetrics P2P tracking
❌ Frontend useHybridChat hook
❌ peerjs-server.js file
❌ P2P upgrade logic

**Why Removed:** Android app will handle BLE mesh networking independently. Server P2P code was unused.

### What's Working Now (Phase 2)
✅ Pure WebSocket server-relayed messaging
✅ QR code room invites
✅ Mobile-responsive UI
✅ Admin dashboard with accurate metrics
✅ Auto-reconnection
✅ Background notifications
✅ Cloud Run deployment (staging + production)
✅ Clean codebase (~200 lines removed)

**See:** `docs/CURRENT-STATE-OCT-2025.md` for complete current state
**See:** `docs/PHASE_2_COMPLETE.md` for Phase 2 details

---

## 📁 Key Files You'll Work With

```
festival-chat/
├── README.md                          # Project overview (updated Oct 9)
├── PROJECT-INSTRUCTIONS.md            # Setup guide
├── QUICK-REFERENCE.md                 # Command reference
├── AI-ASSISTANT-CONTEXT.md            # This file
├── CLEANUP_PLAN.md                    # Recent cleanup plan
│
├── signaling-server.js                # WebSocket server (v4.1-websocket-only)
│
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Homepage
│   │   ├── chat/[roomId]/page.tsx     # Main chat UI (uses useWebSocketChat)
│   │   ├── admin-analytics/page.tsx   # Admin dashboard
│   │   └── api/                       # API routes
│   ├── components/                    # React components
│   ├── hooks/
│   │   └── use-websocket-chat.ts      # WebSocket connection (Phase 2)
│   └── utils/
│       └── server-utils.ts            # Server URL detection
│
├── scripts/
│   ├── deploy-websocket-staging.sh    # Deploy to staging
│   ├── deploy-websocket-cloudbuild.sh # Deploy to production
│   └── archive/                       # Old scripts (18 moved here)
│
├── deployment/
│   ├── cloudbuild-minimal.yaml        # Staging build
│   └── cloudbuild-production.yaml     # Production build
│
└── docs/
    ├── CURRENT-STATE-OCT-2025.md      # ⭐ Current state (NEW)
    ├── PHASE_2_COMPLETE.md            # Phase 2 summary
    ├── DEPLOYMENT.md                  # Deployment guide
    ├── 01-QUICK-START.md              # User guides
    └── archive/                       # Historical docs
```

---

## 🚀 Common Commands

```bash
# Development
npm run dev:mobile              # Start with mobile access

# Build & Test
npm run build                   # Test production build

# Deployment
git push origin main            # Vercel auto-deploys frontend

# Backend Deployment
./scripts/deploy-websocket-staging.sh      # Deploy to staging
./scripts/deploy-websocket-cloudbuild.sh   # Deploy to production

# Health Check
curl https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health
# Expected: {"status":"ok","version":"4.1-websocket-only",...}
```

---

## 🎯 Deployment Strategy

### Frontend: Vercel
- **Platform:** Vercel (native Next.js support)
- **Production:** https://peddlenet.app
- **Staging:** Any branch push creates preview
- **Auto-deploy:** Push to main

### Backend: Google Cloud Run
- **Production:** peddlenet-websocket-server
- **Staging:** peddlenet-websocket-server-staging
- **Deploy:** Manual via scripts (see above)
- **Version:** 4.1-websocket-only
- **Scaling:** min-instances=0 (scales to zero when idle)

### Environment Detection
- `localhost` or IP → Development (local server)
- `.vercel.app` or `peddlenet.app` → Production
- Environment vars set via BUILD_TARGET

**Full guide:** `docs/DEPLOYMENT.md`

---

## 🔧 When Helping Users

### Always Check First
1. Read `docs/CURRENT-STATE-OCT-2025.md` - Current state
2. Read `docs/PHASE_2_COMPLETE.md` - Recent changes
3. Read `docs/DEPLOYMENT.md` - Deployment guide
4. Check if issue related to Phase 2 changes

### Common User Confusions
1. **"Connection shows red"** → Fixed in Phase 2 (status mapping)
2. **"I see P2P upgrade messages"** → Shouldn't happen after Phase 2
3. **"Admin counts wrong"** → Fixed in Phase 1 (duplicate sockets)
4. **"QR codes don't work on preview"** → Known issue, test on production
5. **"WebSocket won't connect"** → Check env vars in Vercel

### Best Practices When Assisting
✅ Suggest simple solutions first
✅ Test on staging before production
✅ Update docs if making changes
✅ Respect WebSocket-only architecture
✅ Reference docs/CURRENT-STATE-OCT-2025.md for accuracy
❌ Don't re-introduce P2P code
❌ Don't suggest mesh networking (Android will handle)
❌ Don't overcomplicate simple features

---

## 🐛 Known Behaviors (Not Bugs)

### Admin Dashboard User Counts
**Behavior:** Shows unique users, not socket connections
**Why:** One user can have multiple sockets (chat + background)
**Fix:** Phase 1 - Working as designed

### Background Connections Filtered
**Behavior:** Background notification sockets don't show in user counts
**Why:** Intentional to avoid inflating numbers
**Fix:** Working as designed

### No P2P Upgrade Messages
**Behavior:** No "AUTO-UPGRADE" or P2P messages in console
**Why:** Phase 2 removed all P2P code
**Expected:** Correct behavior after Phase 2

### Connection Indicator Green
**Behavior:** Shows green when connected
**Why:** Phase 2 fixed status mapping
**Previous:** Was showing red despite being connected

---

## 📊 Architecture Quick Reference

### Frontend (Vercel)
- Next.js 14 App Router
- React 18 components
- Tailwind CSS styling
- **Messaging:** useWebSocketChat hook (Phase 2)
- **No P2P:** Hybrid chat removed

### Backend (Google Cloud Run)
- `signaling-server.js` (v4.1-websocket-only)
- Express + Socket.IO
- **WebSocket-only:** No P2P code
- In-memory data (24h retention for public rooms)
- Automatic cleanup (hourly)

### Communication
- **Primary:** WebSocket (Socket.IO)
- **Fallback:** Long-polling
- **Admin API:** REST endpoints
- **No P2P:** All messages server-relayed

---

## 🎨 Code Patterns

### State Management
- Local state: `useState`
- Custom hooks for shared logic
- No global state library

### WebSocket Connection (Phase 2)
- **Hook:** `src/hooks/use-websocket-chat.ts`
- **Removed:** `src/hooks/use-hybrid-chat.ts`
- Auto-reconnect on disconnect
- Status tracking: connected/connecting/disconnected

### Mobile Optimization
- Mobile-first responsive design
- Touch-friendly targets (min 44px)
- Fixed positioning for mobile UI

---

## 🔄 Typical Workflows

### Making Frontend Changes
```bash
# 1. Create feature branch
git checkout -b feature/new-thing

# 2. Make changes, test locally
npm run dev:mobile

# 3. Push to create preview
git push origin feature/new-thing

# 4. Test Vercel preview URL

# 5. Merge to main when ready
git checkout main
git merge feature/new-thing
git push origin main
```

### Making Backend Changes
```bash
# 1. Modify signaling-server.js

# 2. Deploy to staging
./scripts/deploy-websocket-staging.sh

# 3. Test with staging server
# (Update NEXT_PUBLIC_SIGNALING_SERVER to staging URL)

# 4. Deploy to production
./scripts/deploy-websocket-cloudbuild.sh

# 5. Verify production health
curl https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health
```

---

## 🎯 Project Goals to Maintain

1. **Simple:** No accounts, instant QR access, WebSocket-only
2. **Fast:** < 500ms connections, instant messages
3. **Mobile-first:** Works great on phones
4. **Resilient:** Auto-reconnect, graceful degradation
5. **Stable:** Don't break what's working
6. **Clean:** Minimal code, well-organized

---

## 📚 Documentation Structure

```
docs/
├── CURRENT-STATE-OCT-2025.md          ⭐ START HERE - Current state
├── PHASE_2_COMPLETE.md                 Phase 2 summary
├── PHASE_2_WEBSOCKET_OPTIMIZATION_PLAN.md  Phase 2 plan
├── websocket-phase1-optimizations.md   Phase 1 reference
├── DEPLOYMENT.md                       Deployment guide
├── README.md                           Documentation index
├── 01-QUICK-START.md                   Getting started
├── 02-USER-GUIDE.md                    User guide
├── 04-ARCHITECTURE.md                  System design
├── 11-TROUBLESHOOTING.md               Common issues
├── ADMIN-ANALYTICS-API-REFERENCE.md    Admin API docs
└── archive/                            Historical docs
    ├── october-2025-reset/             Reset docs
    ├── one-time-fixes/                 One-time fixes
    └── ...
```

---

## 🚨 Red Flags to Watch For

### User Might Be Going Wrong Direction If:
- ❌ Trying to re-add P2P code
- ❌ Asking about mesh networking on web
- ❌ Importing socket.io-p2p-server
- ❌ Using useHybridChat hook
- ❌ Suggesting complex features before stability

### Correct Direction:
- ✅ Using WebSocket-only architecture
- ✅ Testing on staging first
- ✅ Maintaining mobile performance
- ✅ Updating documentation
- ✅ Keeping codebase simple

---

## 💡 Quick Answers to Common Questions

**Q: How do I deploy to staging?**
A: `./scripts/deploy-websocket-staging.sh` for backend, push any branch for frontend preview

**Q: What version are we on?**
A: 4.1-websocket-only (Phase 2 complete - P2P removed)

**Q: Why was P2P removed?**
A: Android app will handle BLE mesh independently. Server P2P code was unused.

**Q: QR codes don't work on my preview**
A: Known issue, test QR codes on production or local dev

**Q: How do I update the WebSocket server?**
A: Modify `signaling-server.js`, deploy to staging, test, then deploy to production

**Q: Can I add [complex feature]?**
A: Test thoroughly on feature branch first, maintain simplicity

**Q: Where's the current state documentation?**
A: `docs/CURRENT-STATE-OCT-2025.md` - Complete overview

**Q: What happened to useHybridChat?**
A: Replaced with useWebSocketChat in Phase 2 (P2P removed)

---

## 🎯 Your Role as AI Assistant

When helping with this project:

1. **Understand Phase 2:** P2P removed, WebSocket-only now
2. **Check current state:** Always reference docs/CURRENT-STATE-OCT-2025.md
3. **Prioritize stability:** Working > Feature-rich
4. **Mobile first:** Every suggestion should work well on phones
5. **Document changes:** Update relevant docs when making changes
6. **Test workflow:** Always suggest testing on staging before production
7. **Simplicity:** When in doubt, simpler is better
8. **No P2P:** Don't suggest re-adding P2P code

**Remember:** Phase 2 just cleaned up ~200 lines of unused P2P code. Help maintain this clean, WebSocket-only architecture.

---

## 📋 Recent File Cleanup (October 9)

**Root Folder Cleanup:**
- 32 files → 5 .md files
- Removed: temp files, old scripts, outdated docs
- Kept: README, PROJECT-INSTRUCTIONS, QUICK-REFERENCE, AI-ASSISTANT-CONTEXT, CLEANUP_PLAN

**Docs Folder Cleanup:**
- Active docs clearly separated from archived
- Created docs/CURRENT-STATE-OCT-2025.md
- Moved historical docs to archive/
- Organized by category

**Scripts Folder:**
- 18 old scripts moved to scripts/archive/
- Active: deploy-websocket-staging.sh, deploy-websocket-cloudbuild.sh

**Result:** Clean, organized project structure

---

**Last Updated:** October 9, 2025
**Version:** 4.1-websocket-only
**Status:** Phase 2 complete, folder cleanup complete, production deployed
**Primary Docs:** `docs/CURRENT-STATE-OCT-2025.md` + `docs/DEPLOYMENT.md`
