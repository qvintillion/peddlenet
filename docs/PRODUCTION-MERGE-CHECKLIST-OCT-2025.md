# Production Merge Checklist - WebSocket 4.0 Optimizations
## October 9, 2025

**Branch**: `feature/websocket-4.0-optimized`
**Target**: `main` → Production
**Status**: ✅ READY TO MERGE

---

## 📋 Pre-Merge Checklist

### Testing ✅
- [x] **Staging Environment Tested**
  - Room navigation works without auto-rejoin
  - Admin dashboard shows users in correct rooms
  - No disconnections during normal operation
  - Stale socket detection working

- [x] **Development Environment Tested**
  - All fixes verified locally
  - Server logs show correct behavior
  - Client logs show stale socket warnings when applicable

- [x] **Edge Cases Verified**
  - Page refresh works correctly
  - Multi-tab same room handled
  - Background notifications don't auto-subscribe
  - Circuit breaker doesn't trigger on normal disconnects

### Documentation ✅
- [x] Fix documentation updated (`docs/fixes/DUPLICATE-SOCKET-FIX-OCT-2025.md`)
- [x] Architecture documentation current
- [x] Code comments added to critical sections
- [x] Troubleshooting journey documented

### Code Quality ✅
- [x] No console errors in browser
- [x] No server errors in logs
- [x] Build passes locally
- [x] Vercel build passes
- [x] No TypeScript errors

---

## 🚀 Deployment Steps

### Step 1: Final Verification in Staging

```bash
# Check staging server health
curl https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app/health

# Expected response includes:
# "version": "4.0-optimized"
# "status": "healthy"
```

**Manual Testing Checklist:**
1. Navigate between multiple rooms 5+ times
2. Check admin dashboard after each navigation
3. Verify user appears in ONE room only
4. Check browser console for stale socket warnings (optional)
5. Verify no disconnections or reconnection loops

### Step 2: Merge to Main

```bash
# Ensure you're on the feature branch
git checkout feature/websocket-4.0-optimized

# Pull latest changes (if any)
git pull origin feature/websocket-4.0-optimized

# Switch to main and merge
git checkout main
git pull origin main
git merge feature/websocket-4.0-optimized

# Push to main (triggers Vercel production deployment)
git push origin main
```

### Step 3: Deploy Production WebSocket Server

```bash
# Deploy to Google Cloud Run production
npm run deploy:production

# Wait for deployment to complete (~2-3 minutes)
```

### Step 4: Verify Production Deployment

```bash
# Check production server health
curl https://peddlenet-websocket-server-production-XXXXX.a.run.app/health

# Expected response:
# "version": "4.0-optimized-final"
# "status": "healthy"
# "uptime": "Xm Ys"
```

### Step 5: Monitor Production

**Immediate Checks (0-5 minutes):**
1. Open admin dashboard in production
2. Navigate between rooms as a test user
3. Verify admin dashboard shows correct data
4. Check browser console for errors
5. Monitor server logs for errors

**Short-term Monitoring (1-24 hours):**
- Watch for unexpected disconnections
- Monitor admin dashboard accuracy
- Check for stale socket warnings (should be rare/none)
- Verify no increase in error rates

---

## 🔄 Rollback Plan

If critical issues are discovered:

### Quick Rollback (Revert Commits)

```bash
# On main branch
git revert 8012a3a  # Stale socket fix
git revert 78df1d9  # Syntax fix
git revert 26039a1  # Failed auto-reconnect disable
git revert b47ea0a  # First stale socket attempt
git revert 8739142  # Background notification fix
git revert 424b853  # Background notification revert

# Push reverts
git push origin main

# Redeploy WebSocket server
npm run deploy:production
```

### Alternative: Restore Previous Version

```bash
# Find last good commit before feature branch
git log --oneline main | grep -B1 "websocket-4"

# Reset to that commit
git reset --hard <commit-hash>
git push --force origin main

# Redeploy
npm run deploy:production
```

---

## 📊 Success Metrics

### Critical Metrics (Must Pass)
- [ ] Zero auto-rejoin incidents (users don't rejoin old rooms)
- [ ] Admin dashboard accuracy > 99% (users shown in correct room)
- [ ] Connection stability maintained (no increase in disconnections)
- [ ] Zero stale socket reconnection bugs

### Performance Metrics (Monitor)
- Average connection duration should be stable
- Admin dashboard response time < 500ms
- WebSocket reconnection rate should not increase

---

## 🐛 Known Acceptable Behaviors

These are **expected** and **not bugs**:

1. **Activity Log "after 0s" Entries**
   - Brief socket overlap during navigation (100-500ms)
   - Admin dashboard correctly shows user in ONE room
   - Old socket disconnects quickly

2. **Stale Socket Console Warnings**
   - `⚠️ Stale socket reconnected - disconnecting`
   - Rare occurrence, proves the fix is working
   - Socket immediately disconnected, no impact

3. **Background Notification Migration**
   - First load shows: `🔄 Clearing old background notification subscriptions`
   - One-time migration to v2.0
   - Clears old auto-subscription data

---

## 📞 Emergency Contacts

**If Critical Issues Arise:**

1. **Immediate Action**: Execute rollback plan above
2. **Check Server Logs**: Cloud Run logs for error patterns
3. **Check Admin Dashboard**: Verify user counts and room accuracy
4. **User Impact**: Monitor for user reports of disconnections

**Key Files to Check:**
- `/signaling-server.js` - Server-side logic
- `/src/hooks/use-websocket-chat.ts` - Frontend socket management
- `/src/hooks/use-background-notifications.ts` - Background connection logic

---

## ✅ Post-Merge Tasks

After successful production deployment:

- [ ] Monitor production for 24 hours
- [ ] Delete feature branch (optional): `git branch -d feature/websocket-4.0-optimized`
- [ ] Update project documentation with production deployment date
- [ ] Create release notes/changelog entry
- [ ] Archive staging test data if needed

---

## 📝 Deployment Log

| Step | Time | Status | Notes |
|------|------|--------|-------|
| Staging Verified | | ⏳ Pending | |
| Merge to Main | | ⏳ Pending | |
| Vercel Deploy | | ⏳ Pending | Auto-triggered |
| Cloud Run Deploy | | ⏳ Pending | Manual command |
| Production Verified | | ⏳ Pending | Manual testing |
| 1-Hour Check | | ⏳ Pending | Monitor metrics |
| 24-Hour Check | | ⏳ Pending | Final verification |

---

**Deployment Authorized By**: _____________
**Date**: October 9, 2025
**Version**: 4.0-optimized-final
