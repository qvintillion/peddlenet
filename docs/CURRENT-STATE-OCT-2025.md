# Festival Chat - Current State (October 2025)

**Last Updated:** October 9, 2025
**Version:** 4.1-websocket-only
**Status:** ✅ Production Ready - Phase 2 Complete

---

## 🎯 What is Festival Chat?

Festival Chat is a real-time messaging platform designed for festival and event environments, featuring:
- **WebSocket-only architecture** for reliable server-relayed messaging
- **Background notifications** for cross-room message monitoring
- **Admin dashboard** for real-time connection monitoring
- **Cloud Run deployment** with automatic scaling
- **Vercel hosting** for the Next.js frontend

---

## 📊 Current Architecture (Phase 2 - WebSocket Only)

### What's Active ✅

**Frontend (Next.js + React):**
- WebSocket-only chat using `useWebSocketChat` hook
- Real-time messaging with automatic reconnection
- Background notification system for cross-room messages
- Mobile-optimized UI
- Admin dashboard with real-time analytics

**Backend (Node.js + Socket.IO):**
- Pure WebSocket signaling server
- Server-relayed messaging (no P2P)
- Connection health monitoring
- Automatic cleanup (hourly, 24h retention for public rooms)
- Admin API endpoints for analytics

**Deployment:**
- **Production:** Google Cloud Run (wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app)
- **Staging:** Google Cloud Run staging instance
- **Frontend:** Vercel (peddlenet.app)
- **Environment detection:** Automatic staging vs production

### What's Removed ❌

**Phase 2 Cleanup (v4.1-websocket-only):**
- ❌ All P2P signaling code (~200 lines removed)
- ❌ socket.io-p2p-server import and initialization
- ❌ P2P event handlers (5 handlers removed)
- ❌ Mesh metrics tracking
- ❌ Frontend hybrid chat system (useHybridChat → useWebSocketChat)
- ❌ PeerJS dependencies
- ❌ P2P upgrade logic

**Why Removed:**
- Android app will handle BLE mesh networking independently
- Simplified codebase for easier maintenance
- Cleaner server-only architecture
- No performance impact (P2P code wasn't being used)

---

## 🚀 Recent Changes (October 2025)

### Phase 1: WebSocket Server Optimization (Oct 7-8)
**Version:** 4.0-optimized

**Changes:**
- ✅ Simplified data structures (activeUsers Map)
- ✅ Fixed duplicate socket connections in admin dashboard
- ✅ Improved user counting accuracy
- ✅ Better connection deduplication logic

**Impact:**
- Admin dashboard shows accurate user counts
- Cleaner connection tracking
- Better performance

### Phase 2: P2P Code Removal (Oct 9)
**Version:** 4.1-websocket-only

**Backend Changes:**
- ✅ Removed socket.io-p2p-server package and imports
- ✅ Removed P2P server initialization
- ✅ Removed 5 P2P event handlers (~170 lines)
- ✅ Simplified /mesh-status endpoint (WebSocket-only metrics)
- ✅ Removed P2P cleanup logic
- ✅ Updated feature flags to 'websocket-only'

**Frontend Changes:**
- ✅ Switched from useHybridChat to useWebSocketChat
- ✅ Fixed connection status indicator (green when connected)
- ✅ Updated UI to show "WebSocket-Only (Server-Relayed)"
- ✅ Created compatibility layer for existing components

**Impact:**
- ~200 lines of code removed
- Cleaner, more maintainable codebase
- No performance regression
- Ready for Android BLE mesh (independent implementation)

**Deployment:**
- ✅ Staging deployed and tested
- ✅ Production deployed Oct 9, 2025
- ✅ Health checks passing

---

## 📁 Current Project Structure

```
festival-chat/
├── README.md                          # Project overview
├── PROJECT-INSTRUCTIONS.md            # Setup guide
├── QUICK-REFERENCE.md                 # Command reference
├── AI-ASSISTANT-CONTEXT.md            # AI assistant context
├── CLEANUP_PLAN.md                    # Recent cleanup plan
│
├── signaling-server.js                # WebSocket server (v4.1)
├── package.json                       # Dependencies
├── next.config.ts                     # Next.js config
│
├── src/
│   ├── app/                           # Next.js pages
│   ├── components/                    # React components
│   ├── hooks/                         # Custom hooks
│   │   └── use-websocket-chat.ts      # Main chat hook (Phase 2)
│   └── lib/                           # Utilities
│
├── scripts/
│   ├── deploy-websocket-staging.sh    # Deploy to staging
│   ├── deploy-websocket-cloudbuild.sh # Deploy to production
│   └── archive/                       # Old scripts
│
├── deployment/
│   ├── cloudbuild-minimal.yaml        # Staging build config
│   └── cloudbuild-production.yaml     # Production build config
│
├── docs/
│   ├── README.md                      # Documentation index
│   ├── CURRENT-STATE-OCT-2025.md      # This document
│   │
│   ├── 01-QUICK-START.md              # User guides
│   ├── 02-USER-GUIDE.md
│   ├── 11-TROUBLESHOOTING.md
│   │
│   ├── 03-MESH-NETWORKING.md          # Architecture docs
│   ├── 04-ARCHITECTURE.md
│   ├── 07-MOBILE-OPTIMIZATION.md
│   ├── 08-CONNECTION-RESILIENCE.md
│   ├── 09-PERFORMANCE-MONITORING.md
│   │
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── vercel-environment-setup.md
│   │
│   ├── PHASE_2_COMPLETE.md            # Phase 2 summary
│   ├── PHASE_2_WEBSOCKET_OPTIMIZATION_PLAN.md
│   ├── websocket-phase1-optimizations.md
│   │
│   ├── ADMIN-ANALYTICS-API-REFERENCE.md
│   ├── ADMIN_TROUBLESHOOTING.md
│   │
│   └── archive/                       # Historical documentation
│       ├── october-2025-reset/
│       ├── one-time-fixes/
│       └── ...
│
└── archive/
    └── old-configs/                   # Archived config files
```

---

## 🔧 Key Technologies

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Socket.IO Client
- Tailwind CSS

**Backend:**
- Node.js
- Express
- Socket.IO Server (WebSocket only)
- In-memory data store

**Deployment:**
- Google Cloud Run (backend)
- Vercel (frontend)
- Docker containers

**Removed in Phase 2:**
- ❌ socket.io-p2p-server
- ❌ PeerJS
- ❌ WebRTC P2P connections

---

## 🧪 Testing & Deployment

### Staging Environment
**WebSocket Server:** peddlenet-websocket-server-staging
**Frontend:** Vercel preview deployments
**Purpose:** Testing before production

### Production Environment
**WebSocket Server:** https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
**Frontend:** https://peddlenet.app
**Status:** ✅ Live and operational

### Deployment Commands
```bash
# Deploy to staging
./scripts/deploy-websocket-staging.sh

# Deploy to production
./scripts/deploy-websocket-cloudbuild.sh
```

### Health Checks
```bash
# Check production server
curl https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health

# Expected response:
# {"status":"ok","service":"PeddleNet Signaling Server","version":"4.1-websocket-only","timestamp":...}
```

---

## 📈 Admin Dashboard

**URL:** https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin
**Authentication:** Basic auth (credentials in environment variables)

**Features:**
- Real-time user counts (accurate after Phase 1 fixes)
- Active room monitoring
- Connection quality metrics
- Activity feed
- Message statistics

**API Endpoints:**
- `/admin/analytics` - Full analytics data
- `/admin/mesh-status` - WebSocket connection status
- `/admin/activity` - Activity log
- `/admin/users/detailed` - Detailed user info
- `/admin/rooms/detailed` - Detailed room info

---

## 🎯 Known Behaviors (Not Bugs)

1. **Admin user counts show unique users, not socket connections**
   - By design after Phase 1 fixes
   - One user can have multiple sockets (chat + background)
   - Dashboard shows one entry per unique display name

2. **Background connections filtered from user counts**
   - Intentional to avoid inflating numbers
   - Background sockets only listen for notifications

3. **No P2P upgrade messages**
   - Expected after Phase 2 removal
   - All messaging is server-relayed

4. **Connection indicator green when connected**
   - Fixed in Phase 2
   - Was showing red despite being connected (mapping issue)

---

## 🚧 What's NOT Included (Future Work)

### Android BLE Mesh (Future)
- Will be implemented independently in Android app
- Does not depend on web P2P code (which is removed)
- Server will continue providing WebSocket fallback

### Phase 3 (Optional - Deferred)
- Admin endpoint consolidation
- Reduce code duplication in analytics
- Only if needed for performance/maintenance

### Other Future Features
- User authentication
- Persistent message history
- File sharing
- Voice/video (separate from mesh)

---

## 📝 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Testing Changes
```bash
# Test with staging WebSocket server
NEXT_PUBLIC_SIGNALING_SERVER=wss://staging-url npm run dev

# Run in mobile view
npm run dev:mobile
```

### Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit
git add .
git commit -m "description"

# Push and merge to main
git push origin feature/your-feature
# (Create PR or merge directly)
```

---

## 🆘 Getting Help

**Documentation:**
- Quick Start: `docs/01-QUICK-START.md`
- User Guide: `docs/02-USER-GUIDE.md`
- Troubleshooting: `docs/11-TROUBLESHOOTING.md`
- Architecture: `docs/04-ARCHITECTURE.md`

**Admin Issues:**
- Admin Troubleshooting: `docs/ADMIN_TROUBLESHOOTING.md`
- API Reference: `docs/ADMIN-ANALYTICS-API-REFERENCE.md`

**Deployment:**
- Deployment Guide: `docs/DEPLOYMENT.md`
- Vercel Setup: `docs/vercel-environment-setup.md`

---

## ✅ Current Status Summary

**What's Working:**
✅ WebSocket-only messaging
✅ Real-time chat across rooms
✅ Background notifications
✅ Admin dashboard with accurate metrics
✅ Automatic reconnection
✅ Cloud Run deployment with auto-scaling
✅ Staging and production environments
✅ Mobile-optimized UI

**Recent Improvements:**
✅ Phase 1: Simplified data structures, fixed duplicate connections
✅ Phase 2: Removed unused P2P code (~200 lines), cleaner architecture
✅ Folder cleanup: Organized documentation, archived old files

**Next Steps:**
- Android app development (BLE mesh independent of web)
- Optional: Phase 3 admin endpoint consolidation (if needed)
- Feature development as needed

---

**Last Review:** October 9, 2025
**Reviewed By:** Claude Code (AI Assistant)
**Status:** Current and accurate ✅
