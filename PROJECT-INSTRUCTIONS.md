# 🎪 PeddleNet Festival Chat - Project Instructions

**Project Type:** Real-time WebSocket chat application for festivals  
**Stack:** Next.js 15, React 19, TypeScript, Socket.IO, Tailwind CSS 4  
**Deployment:** Vercel (frontend) + Google Cloud Run (backend)  
**Last Updated:** October 7, 2025

---

## 📋 Project Overview

### What This Is
A mobile-first, real-time chat application designed for music festivals and events. Users can create rooms via QR codes, join instantly, and message each other with minimal latency. Built for environments with potentially spotty connectivity.

### Key Features
- ✅ Instant room creation with QR code invites
- ✅ Real-time WebSocket messaging
- ✅ Mobile-optimized responsive design
- ✅ Display name system (no accounts needed)
- ✅ Cross-device synchronization
- ✅ Admin analytics dashboard
- ✅ Background notifications for multiple rooms
- ✅ Connection resilience with auto-reconnect

### Current Status (October 2025)
**Clean, stable state** after hard reset to resolve deployment issues. Simple WebSocket architecture, no P2P complexity. Ready for production deployment.

---

## 🎯 Project Goals & Use Cases

### Primary Use Case
Festival attendees can quickly create chat rooms to coordinate meetups, share experiences, and stay connected in crowded venues where finding people is difficult.

### Design Philosophy
- **Speed first:** < 500ms connection times
- **Mobile first:** Touch-optimized, thumb-friendly UI
- **Simple first:** No accounts, no complexity, just chat
- **Resilient:** Works through network interruptions
- **Instant:** QR code = immediate room access

---

## 🏗️ Architecture

### Frontend (Vercel)
- **Framework:** Next.js 15 with App Router
- **UI:** React 19 with Tailwind CSS 4
- **State:** React hooks (useState, useEffect, custom hooks)
- **Routing:** File-based routing in `src/app/`
- **API Routes:** Next.js API routes in `src/app/api/`

### Backend (Google Cloud Run)
- **Server:** Node.js Express with Socket.IO
- **File:** `signaling-server.js` (root directory)
- **Purpose:** WebSocket connections, room management
- **Database:** In-memory (SQLite for admin analytics)
- **Deployment:** Separate staging + production instances

### Communication
- **Primary:** WebSocket (Socket.IO) for real-time messages
- **Fallback:** Long-polling if WebSocket fails
- **Admin API:** REST endpoints via Next.js API routes

---

## 📁 Project Structure

```
festival-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Homepage
│   │   ├── chat/[roomId]/     # Chat room page
│   │   ├── admin-analytics/   # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and types
│   └── utils/                 # Helper functions
├── public/                    # Static assets
├── docs/                      # Documentation
│   ├── DEPLOYMENT.md         # ⭐ Deployment guide
│   ├── README.md             # Documentation index
│   ├── 01-12 (guides)        # Core documentation
│   └── archive/              # Historical docs
├── scripts/                   # Deployment scripts
├── signaling-server.js       # WebSocket server
├── package.json              # Dependencies & scripts
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── vercel.json               # Vercel configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18-24 (specified in package.json engines)
- npm or yarn
- Git
- Optional: Vercel CLI, Google Cloud SDK

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/qvintillion/peddlenet.git
cd peddlenet

# Install dependencies (1546 packages)
npm install

# Start development server
npm run dev:mobile

# This will:
# - Start Next.js dev server
# - Detect your local IP for mobile testing
# - Start local WebSocket server on port 3001
# - Show QR code for mobile access
```

### Access Points
- **Desktop:** http://localhost:3000
- **Mobile:** http://[your-ip]:3000 (shown in terminal)
- **Admin:** http://localhost:3000/admin-analytics

---

## 💻 Development Workflow

### Daily Development
```bash
# Start dev server with mobile access
npm run dev:mobile

# Make changes to:
# - Components in src/components/
# - Pages in src/app/
# - Hooks in src/hooks/
# - Server in signaling-server.js

# Changes auto-reload via Hot Module Replacement
```

### Testing
```bash
# Build test (check for errors before deploying)
npm run build

# Test on mobile device
# 1. Connect phone to same WiFi
# 2. Navigate to http://[your-ip]:3000
# 3. Create room, scan QR, test messaging
```

### Code Quality
```bash
# Lint check (currently disabled in builds)
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## 🎨 Key Technologies & Patterns

### State Management
- **Local state:** useState for component-specific state
- **Custom hooks:** Shared logic (useHybridChat, useRoomBackgroundNotifications)
- **No global state library:** Kept simple, no Redux/Zustand

### Real-Time Communication
- **Socket.IO client:** `src/hooks/use-hybrid-chat.ts`
- **Connection management:** Auto-reconnect, status tracking
- **Room-based:** Users join specific room namespaces
- **Events:** message, user-joined, user-left, etc.

### Mobile Optimization
- **Responsive design:** Mobile-first breakpoints
- **Touch targets:** Minimum 44px tap targets
- **Fixed positioning:** Avoid scrolling issues
- **Network detection:** Handles spotty connections

### QR Code System
- **Generation:** `qrcode` library in QRModal component
- **Format:** URL with room ID and optional peer info
- **Mobile detection:** Auto-detects local IP for LAN access

---

## 🔧 Important Files & Their Purpose

### Configuration Files
- `next.config.ts` - Next.js config, API routes, image optimization
- `tailwind.config.ts` - Tailwind theme, colors, spacing
- `vercel.json` - Vercel deployment config, redirects, headers
- `tsconfig.json` - TypeScript compiler settings

### Core Application Files
- `src/app/page.tsx` - Homepage (create/join room)
- `src/app/chat/[roomId]/page.tsx` - Main chat interface
- `src/hooks/use-hybrid-chat.ts` - WebSocket connection logic
- `src/components/QRModal.tsx` - QR code generation
- `signaling-server.js` - Backend WebSocket server

### Deployment Files
- `scripts/deploy-websocket-staging.sh` - Deploy staging server
- `scripts/deploy-websocket-cloudbuild.sh` - Deploy production server
- `scripts/dev-mobile.sh` - Development with mobile access

### Documentation
- `docs/DEPLOYMENT.md` - Official deployment guide
- `docs/OCTOBER-2025-RESET-AND-RECOVERY.md` - Reset context
- `docs/01-QUICK-START.md` - Quick start guide
- `docs/README.md` - Documentation index

---

## 🌐 Deployment

### Platform Strategy
- **Frontend:** Vercel (auto-deploy from GitHub)
- **Backend:** Google Cloud Run (manual deploy)
- **NOT using:** Firebase Hosting (archived, API route limitations)

### Development
```bash
npm run dev:mobile
# Frontend: localhost:3000
# Backend: localhost:3001
```

### Staging (Vercel Preview)
```bash
git push origin [branch-name]
# Vercel auto-creates preview URL
# Format: peddlenet-[branch]-[user].vercel.app
# Backend: Staging Cloud Run server
```

### Production
```bash
git push origin main
# Vercel auto-deploys to peddlenet.app
# Backend: Production Cloud Run server
```

### Backend Deployment
```bash
# Deploy staging WebSocket server
./scripts/deploy-websocket-staging.sh

# Deploy production WebSocket server
./scripts/deploy-websocket-cloudbuild.sh
# Only needed when signaling-server.js changes
```

**Full deployment guide:** `docs/DEPLOYMENT.md`

---

## 🔐 Environment Variables

### Development (Local)
No .env.local needed - uses localhost:3001 by default

### Staging (.env.staging)
```bash
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
BUILD_TARGET=staging
NODE_ENV=production
```

### Production (.env.production + Vercel Dashboard)
```bash
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
BUILD_TARGET=production
NODE_ENV=production
```

**Critical:** Vercel dashboard environment variables must match production server URL.

---

## 🐛 Known Issues & Limitations

### QR Codes on Vercel Previews
**Issue:** Scanning QR codes on preview deployments may cause redirect errors  
**Cause:** Preview URLs may not be publicly accessible  
**Workaround:** Test QR codes on production or local dev only  
**Status:** Documented, workaround in place

### Static Export Incompatibility
**Issue:** Can't use Next.js static export due to API routes  
**Impact:** Firebase Hosting requires workarounds  
**Solution:** Use Vercel (native Next.js support)

### In-Memory Database
**Issue:** Server restarts lose all room/message data  
**Impact:** Not suitable for long-term message persistence  
**Future:** Could add persistent database layer

---

## 📊 Performance Targets

### Connection Speed
- **Target:** < 500ms initial connection
- **Current:** Typically 200-400ms on good networks
- **Measure:** Browser console logs connection time

### Message Latency
- **Target:** < 100ms message delivery
- **Current:** Near-instant on WebSocket
- **Fallback:** Long-polling adds ~500ms latency

### Build Times
- **Development:** < 5s hot reload
- **Production build:** 2-3 minutes
- **Deployment:** 2-3 minutes (Vercel)

---

## 🧪 Testing Checklist

### Before Deploying
- [ ] `npm run build` succeeds without errors
- [ ] Can create room locally
- [ ] Can send/receive messages
- [ ] QR code generates correctly
- [ ] Mobile responsive (test on phone)
- [ ] No console errors
- [ ] Connection indicator shows "Connected"

### After Deploying
- [ ] Production site loads (peddlenet.app)
- [ ] Can create room
- [ ] Can join room via URL
- [ ] Messages send/receive correctly
- [ ] WebSocket connects (check browser console)
- [ ] Admin dashboard accessible (if needed)
- [ ] Cross-device messaging works

---

## 🎯 Project Maintenance

### Regular Tasks
- **Dependencies:** Update monthly (`npm run package:update`)
- **Security:** Run `npm audit` regularly
- **Backups:** Push to GitHub frequently
- **Monitoring:** Check Vercel deployment logs

### When to Deploy Backend
Only deploy WebSocket servers when:
- ✅ You modify `signaling-server.js`
- ✅ You add new Socket.IO event handlers
- ✅ You change room/user management logic
- ❌ NOT needed for frontend-only changes

### Documentation Updates
- Keep `docs/DEPLOYMENT.md` current
- Update version numbers when deploying
- Document any breaking changes
- Archive outdated documentation

---

## 🚨 Troubleshooting Quick Reference

### "WebSocket won't connect"
1. Check server health: `curl https://[server-url]/health`
2. Verify env var in Vercel dashboard
3. Check browser console for errors
4. Redeploy WebSocket server if needed

### "Build fails on Vercel"
1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Fix TypeScript/import errors
4. Push fix and Vercel auto-rebuilds

### "Changes not showing up"
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Check Vercel dashboard - might still be building
3. Clear browser cache
4. Verify correct URL (production vs preview)

### "QR code doesn't work"
1. Test on production (peddlenet.app) not preview
2. Or test locally with `npm run dev:mobile`
3. Ensure phone is on same WiFi (local dev)
4. Check QR URL format in browser console

**Full troubleshooting:** `docs/11-TROUBLESHOOTING.md`

---

## 📚 Additional Resources

### Documentation
- **Deployment:** `docs/DEPLOYMENT.md` (⭐ start here)
- **Quick Start:** `docs/01-QUICK-START.md`
- **Architecture:** `docs/04-ARCHITECTURE.md`
- **Troubleshooting:** `docs/11-TROUBLESHOOTING.md`
- **Reset Context:** `docs/OCTOBER-2025-RESET-AND-RECOVERY.md`

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Project Links
- **Repository:** https://github.com/qvintillion/peddlenet
- **Production:** https://peddlenet.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Cloud Run Console:** https://console.cloud.google.com/run

---

## 🎪 Project History

### October 2025 - Hard Reset
**What happened:** Reset to June 15, 2025 baseline to fix deployment issues  
**Why:** Mesh networking complexity broke deployment pipeline  
**Result:** Clean, stable, simple WebSocket chat restored  
**Status:** Current state, documented in `OCTOBER-2025-RESET-AND-RECOVERY.md`

### June 2025 - Production Launch
**Achievement:** Successfully deployed to peddlenet.app  
**Platform:** Switched from Firebase to Vercel  
**Features:** Admin dashboard, QR codes, mobile optimization  
**Lessons:** Document in `docs/archive/june-2025-*` folders

### Before June 2025 - Initial Development
**Started:** Festival chat concept  
**Platform:** Firebase Hosting initially  
**Evolution:** Moved to Vercel for API route support

---

## 🔮 Future Enhancements (Post-Stabilization)

### Phase 1 (Near-term)
- [ ] Restore advanced admin analytics (from backup)
- [ ] Improve QR code handling on previews
- [ ] Add persistent message storage
- [ ] Enhance mobile notifications

### Phase 2 (Medium-term)
- [ ] User profiles (optional, still no accounts)
- [ ] Room moderation tools
- [ ] Message reactions/emoji
- [ ] File sharing (images)

### Phase 3 (Long-term)
- [ ] P2P mesh networking (careful, separate branch)
- [ ] Offline mode improvements
- [ ] Bluetooth proximity features
- [ ] Voice messages

**Important:** All future enhancements must maintain stability and simplicity. Test thoroughly on feature branches before merging to main.

---

## ⚠️ Critical Principles

### 1. Simplicity First
Don't add features that complicate the core chat experience. Festival users want fast, reliable messaging, not complexity.

### 2. Mobile Performance
Every feature must work well on mobile. If it slows down mobile, don't ship it.

### 3. Connection Resilience
Assume spotty connections. Auto-reconnect, graceful degradation, clear status indicators.

### 4. No Accounts Required
The beauty of this app is instant access via QR codes. Never require sign-up.

### 5. Document Everything
Future you (or others) will thank you. Keep docs current, especially after changes.

---

## 👥 Contributing

### For AI Assistants (Claude, etc.)
When helping with this project:
1. **Read first:** Check `docs/DEPLOYMENT.md` and `docs/OCTOBER-2025-RESET-AND-RECOVERY.md`
2. **Understand context:** Post-reset clean state, simple WebSocket architecture
3. **Respect simplicity:** Don't re-introduce complexity (mesh networking, etc.)
4. **Update docs:** If making changes, update relevant documentation
5. **Test workflow:** Suggest testing on staging before production

### For Human Developers
1. Create feature branch for changes
2. Test locally with `npm run dev:mobile`
3. Push to GitHub to create Vercel preview
4. Test preview thoroughly
5. Merge to main when ready
6. Verify production deployment
7. Update documentation if needed

---

## 📞 Support & Contact

### Project Maintainer
Check repository settings for current maintainer contact information.

### Getting Help
1. Check documentation in `docs/` folder
2. Review troubleshooting guide (`docs/11-TROUBLESHOOTING.md`)
3. Check GitHub issues for similar problems
4. Review commit history for context

### Reporting Issues
When reporting problems, include:
- Environment (dev/staging/production)
- Browser/device information
- Steps to reproduce
- Console errors (if any)
- Expected vs actual behavior

---

**Last Updated:** October 7, 2025  
**Current Status:** Clean, stable, ready for deployment  
**Next Action:** Deploy to production, verify stability

🎪 **Welcome to PeddleNet - Festival Chat Made Simple!** 🎪
