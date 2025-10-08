# 🤖 AI Assistant Context - PeddleNet Festival Chat

**Quick Reference for Claude and other AI assistants helping with this project**

---

## 🎯 Project Essence

**What:** Real-time WebSocket chat for music festivals  
**Stack:** Next.js 15, React 19, Socket.IO, Tailwind CSS 4  
**Deploy:** Vercel (frontend) + Cloud Run (backend)  
**Philosophy:** Simple, fast, mobile-first, no accounts needed

---

## ⚠️ CRITICAL CONTEXT (Read First)

### Current Status: POST-RESET Clean State
**Date:** October 7, 2025  
**Action:** Hard reset to June 15, 2025 baseline  
**Why:** Fatal deployment issues from mesh networking attempts  
**Result:** Clean, stable, simple WebSocket-only chat

### What Was Removed (Don't Re-introduce)
❌ Mesh networking / P2P (too complex, caused issues)  
❌ Advanced admin analytics (caused build errors)  
❌ Experimental features (broke deployment)

### What's Working Now
✅ Simple WebSocket chat (fast < 500ms)  
✅ QR code room invites  
✅ Mobile-responsive UI  
✅ Basic admin dashboard  
✅ Auto-reconnection  
✅ Background notifications

**See:** `docs/OCTOBER-2025-RESET-AND-RECOVERY.md` for full context

---

## 📁 Key Files You'll Work With

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── chat/[roomId]/page.tsx     # Main chat UI
│   ├── admin-analytics/page.tsx   # Admin dashboard
│   └── api/                       # API routes
├── components/                     # React components
├── hooks/
│   └── use-hybrid-chat.ts         # WebSocket connection
└── utils/
    └── server-utils.ts            # Server URL detection

signaling-server.js                # Backend WebSocket server
docs/DEPLOYMENT.md                 # Deployment guide
```

---

## 🚀 Common Commands

```bash
# Development
npm run dev:mobile              # Start with mobile access

# Build & Test
npm run build                   # Test production build

# Deployment (automatic)
git push origin main            # Vercel auto-deploys

# Backend (manual, only when needed)
./scripts/deploy-websocket-staging.sh      # Staging
./scripts/deploy-websocket-cloudbuild.sh   # Production
```

---

## 🎯 Deployment Strategy

### Platform: Vercel (NOT Firebase)
- **Why Vercel:** Native Next.js + API routes support
- **Why NOT Firebase:** Static hosting only, no API routes
- **Legacy scripts:** Firebase scripts archived, don't use

### Workflow
1. **Development:** `npm run dev:mobile`
2. **Staging:** Push to any branch → Vercel creates preview
3. **Production:** Push to main → Auto-deploys to peddlenet.app

### Environment Detection
- `localhost` or IP → Development (local server)
- `.vercel.app` or `peddlenet.app` → Production
- `.web.app` → Staging (legacy, not used)

**Full guide:** `docs/DEPLOYMENT.md`

---

## 🔧 When Helping Users

### Always Check First
1. Read `docs/DEPLOYMENT.md` - Official deployment guide
2. Read `docs/OCTOBER-2025-RESET-AND-RECOVERY.md` - Reset context
3. Check if their issue is deployment-related

### Common User Confusions
1. **"Should I use Firebase?"** → No, use Vercel
2. **"QR codes don't work on preview"** → Known issue, test on production
3. **"Deployment scripts failing"** → Probably using Firebase scripts (archived)
4. **"WebSocket won't connect"** → Check env vars in Vercel dashboard

### Best Practices When Assisting
✅ Suggest simple solutions first  
✅ Test on staging before production  
✅ Update docs if making changes  
✅ Respect the post-reset clean state  
❌ Don't re-introduce mesh networking  
❌ Don't suggest Firebase deployment  
❌ Don't overcomplicate simple features

---

## 🐛 Known Issues

### QR Codes on Vercel Previews
**Problem:** Redirect errors when scanning QR on preview URLs  
**Why:** Preview URLs may not be publicly accessible  
**Solution:** Test QR codes on production or local dev only

### Firebase Scripts Still Exist
**Problem:** User might try to use them  
**Why:** Archived for backup, but broken (need static export)  
**Solution:** Direct them to use Vercel instead

---

## 📊 Architecture Quick Reference

### Frontend (Vercel)
- Next.js 15 App Router
- React 19 components
- Tailwind CSS 4 styling
- API routes in `/api/*`

### Backend (Cloud Run)
- `signaling-server.js` (root directory)
- Express + Socket.IO
- Two instances: staging + production
- In-memory data (resets on restart)

### Communication
- Primary: WebSocket (Socket.IO)
- Fallback: Long-polling
- Admin API: REST via Next.js API routes

---

## 🎨 Code Patterns

### State Management
- Local state: `useState`
- Custom hooks for shared logic
- No global state library (Redux/Zustand)

### WebSocket Connection
- Hook: `src/hooks/use-hybrid-chat.ts`
- Auto-reconnect on disconnect
- Status tracking: connected/connecting/disconnected

### Mobile Optimization
- Mobile-first responsive design
- Touch-friendly targets (min 44px)
- Fixed positioning to avoid scroll issues

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

# 4. Deploy to production
./scripts/deploy-websocket-cloudbuild.sh

# Frontend uses env var to connect to correct server
```

---

## 🎯 Project Goals to Maintain

1. **Simple:** No accounts, instant QR access
2. **Fast:** < 500ms connections, instant messages
3. **Mobile-first:** Works great on phones
4. **Resilient:** Auto-reconnect, graceful degradation
5. **Stable:** Don't break what's working

---

## 📚 Documentation Structure

```
docs/
├── DEPLOYMENT.md                    ⭐ Start here
├── OCTOBER-2025-RESET-AND-RECOVERY.md  Important context
├── README.md                        Documentation index
├── 01-QUICK-START.md               Getting started
├── 04-ARCHITECTURE.md              System design
├── 11-TROUBLESHOOTING.md           Common issues
└── archive/                        Old/archived docs
```

---

## 🚨 Red Flags to Watch For

### User Might Be Going Wrong Direction If:
- ❌ Trying to use Firebase deployment scripts
- ❌ Asking about mesh networking implementation
- ❌ Wanting to add accounts/authentication
- ❌ Suggesting complex features before stability
- ❌ Modifying `next.config.ts` for static export

### Correct Direction:
- ✅ Using Vercel for deployments
- ✅ Keeping architecture simple
- ✅ Testing on staging first
- ✅ Maintaining mobile performance
- ✅ Updating documentation

---

## 💡 Quick Answers to Common Questions

**Q: How do I deploy to staging?**  
A: Push to any branch, Vercel creates preview automatically

**Q: Should I use Firebase or Vercel?**  
A: Vercel - it's already set up and working

**Q: QR codes don't work on my preview**  
A: Known issue, test QR codes on production or local dev

**Q: How do I update the WebSocket server?**  
A: Modify `signaling-server.js`, then run `./scripts/deploy-websocket-[staging|cloudbuild].sh`

**Q: Can I add [complex feature]?**  
A: Test thoroughly on feature branch first, maintain simplicity

**Q: Where's the documentation?**  
A: `docs/DEPLOYMENT.md` for deployment, `PROJECT-INSTRUCTIONS.md` for everything

---

## 🎯 Your Role as AI Assistant

When helping with this project:

1. **Understand the reset:** This is a clean slate, don't suggest re-adding removed complexity
2. **Prioritize stability:** Working > Feature-rich
3. **Mobile first:** Every suggestion should work well on phones
4. **Document changes:** Update relevant docs when making changes
5. **Test workflow:** Always suggest testing on staging before production
6. **Simplicity:** When in doubt, simpler is better

**Remember:** The user hard-reset this project to escape complexity. Help them maintain the clean, stable state while building forward carefully.

---

**Last Updated:** October 7, 2025  
**Status:** Post-reset, clean, ready for development  
**Primary Docs:** `docs/DEPLOYMENT.md` + `PROJECT-INSTRUCTIONS.md`
