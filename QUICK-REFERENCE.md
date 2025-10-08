# 🎪 PeddleNet Quick Reference Card

**One-page cheat sheet for daily development**

---

## 🚀 Essential Commands

```bash
# Development
npm run dev:mobile              # Start dev server with mobile access
npm run build                   # Test production build locally

# Deployment (automatic via Git)
git push origin main            # Deploy to production (peddlenet.app)
git push origin [branch]        # Create staging preview

# Backend (manual, only when signaling-server.js changes)
./scripts/deploy-websocket-staging.sh
./scripts/deploy-websocket-cloudbuild.sh
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage (create/join room) |
| `src/app/chat/[roomId]/page.tsx` | Main chat interface |
| `src/hooks/use-hybrid-chat.ts` | WebSocket connection logic |
| `src/components/QRModal.tsx` | QR code generation |
| `signaling-server.js` | Backend WebSocket server |
| `docs/DEPLOYMENT.md` | Official deployment guide |

---

## 🌐 URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Production** | https://peddlenet.app | wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app |
| **Staging** | [branch].vercel.app | wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app |
| **Local** | localhost:3000 | localhost:3001 |

---

## 🎯 Decision Tree

```
Need to deploy?
├─ Frontend only change?
│  └─ git push origin main (done!)
│
└─ Backend change?
   ├─ Deploy staging first
   ├─ Test
   └─ Deploy production
```

```
Something broken?
├─ WebSocket won't connect?
│  └─ Check env vars in Vercel dashboard
│
├─ Build fails?
│  └─ Run npm run build locally, fix errors
│
├─ QR codes don't work?
│  └─ Test on production or local dev (not preview)
│
└─ Changes not showing?
   └─ Hard refresh (Ctrl+Shift+R)
```

---

## ⚠️ Remember

✅ **Use Vercel** (NOT Firebase)  
✅ **Test on staging** before production  
✅ **Keep it simple** (post-reset clean state)  
✅ **Mobile first** always  
❌ **Don't re-add** mesh networking  
❌ **Don't use** Firebase deployment scripts

---

## 🐛 Known Issues

| Issue | Workaround |
|-------|------------|
| QR codes fail on preview | Test on production or local dev |
| Firebase scripts broken | Use Vercel instead |

---

## 📚 Documentation

| Doc | When to Use |
|-----|-------------|
| `docs/DEPLOYMENT.md` | Deployment questions |
| `PROJECT-INSTRUCTIONS.md` | Project overview |
| `AI-ASSISTANT-CONTEXT.md` | For AI assistants |
| `docs/11-TROUBLESHOOTING.md` | When things break |

---

## 🎪 Status

**Current:** Clean, stable, post-reset (Oct 7, 2025)  
**Architecture:** Simple WebSocket (no P2P)  
**Ready for:** Production deployment  
**Future:** Careful feature additions on branches

---

**Keep this card handy for daily work!** 📌
