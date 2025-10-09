# Admin Dashboard Staging Testing Guide

**Purpose:** Test Phase 1 optimizations on staging before production deployment  
**Platform:** Vercel Preview Deployment + Staging WebSocket Server  
**Estimated Time:** 30-45 minutes

---

## 🔐 Admin Credentials

**Username:** `th3p3ddl3r`  
**Password:** `letsmakeatrade`

---

## 🚀 Quick Start

### 1. Deploy Staging WebSocket Server
```bash
./scripts/deploy-websocket-staging.sh
```

### 2. Create Vercel Preview
```bash
git checkout -b test/phase1-optimizations
git push origin test/phase1-optimizations
# Wait for Vercel preview URL
```

### 3. Access Admin Dashboard
```
https://[your-preview-url]/admin-analytics
Login with credentials above
```

---

## 🧪 10 Critical Test Scenarios

### ✅ Test 1: Dashboard Access
- Navigate to `/admin-analytics`
- Login with credentials
- Verify dashboard loads

### ✅ Test 2: Single User Real-Time Updates
- Open chat in new tab as "Alice"
- Watch dashboard update WITHOUT refresh
- User count: 0 → 1 (instant)
- Room count: 0 → 1 (instant)

### ✅ Test 3: Multiple Users & Rooms
- Add 3 more users across 2 rooms
- Verify all counts accurate
- Verify real-time updates

### ✅ Test 4: Room Switching (CRITICAL FIX)
- User switches from room-1 to room-2
- Old room count decreases
- New room count increases
- User appears in correct room only

### ✅ Test 5: User Disconnect
- Close user's tab
- User removed from dashboard
- Empty rooms disappear
- No phantom users

### ✅ Test 6: Background Notifications (CRITICAL)
```javascript
// In browser console
window.notificationManager?.subscribeToRoom('test-room', 'User');
```
- User count DOESN'T increase
- Background connection logged but not counted

### ✅ Test 7: Message Counting
- Send messages from users
- Message count increases
- User counts DON'T change

### ✅ Test 8: Admin Broadcast All
- Send broadcast from dashboard
- All rooms receive message
- Prefixed with "📢 ADMIN BROADCAST"

### ✅ Test 9: Room-Specific Broadcast
- Broadcast to specific room
- Only that room receives it
- Other rooms don't receive it

### ✅ Test 10: Stress Test (Optional)
- Open 10 tabs
- Rapidly switch rooms
- Send messages
- Verify counts stay accurate

---

## 🔍 What to Look For

### ❌ Red Flags (Should NOT happen):
- User count doubles with background connection
- Phantom users after disconnect
- Dashboard requires refresh to update
- User appears in multiple rooms
- Inconsistent counts between sections

### ✅ Green Flags (Should happen):
- Dashboard updates instantly
- Counts always accurate
- Background connections don't count
- Room switching updates both rooms
- Empty rooms disappear

---

## 📊 Before vs After Phase 1

| Scenario | Before (Broken) | After (Fixed) |
|----------|----------------|---------------|
| Background connection | Count +1 ❌ | No change ✅ |
| Room switching | In both rooms ❌ | Updates correctly ✅ |
| Disconnect | Phantom user ❌ | Clean removal ✅ |
| Dashboard | Refresh needed ❌ | Real-time ✅ |

---

## 🐛 Debugging

### Check Server Logs:
```bash
# Google Cloud Console
# Cloud Run → peddlenet-websocket-server-staging → Logs
# Look for:
# "🔍 Connection type: chat, isBackground: false"
# "🔔 Background connection: ..."
```

### Check Browser Console:
```javascript
// Should see staging WebSocket URL
console.log('Connected to staging server');
```

---

## ✅ Sign-Off Checklist

Ready for production when:
- [ ] All 10 tests pass
- [ ] User counts always accurate
- [ ] Background connections not counted
- [ ] Room switching works correctly
- [ ] Real-time updates working
- [ ] No phantom users
- [ ] No console errors
- [ ] No server errors

---

## 🚀 Deploy to Production

After staging success:
```bash
./scripts/deploy-websocket-cloudbuild.sh
git checkout main
git merge test/phase1-optimizations
git push origin main
```

Monitor: https://peddlenet.app/admin-analytics

---

**Admin Credentials (reminder):**
- Username: `th3p3ddl3r`
- Password: `letsmakeatrade`

Good luck testing! 🎉
