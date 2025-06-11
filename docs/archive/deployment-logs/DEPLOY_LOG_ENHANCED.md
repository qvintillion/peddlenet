# Deploy Log - Enhanced Mobile Background Detection

## 🎯 Root Cause Identified

**The Issue**: When pressing home button on mobile:
1. Mobile disconnects from WebSocket (`👋 User left: q`)
2. When returning to app, mobile reconnects (`👋 User joined: q (new)`)  
3. System thinks user is "actively present" → no notifications sent
4. This reconnection cycle makes the notification system think user is actively using the app

## 🛠️ Enhanced Solution

### Background State Persistence
Added persistent tracking that survives disconnect/reconnect cycles:

**1. Background Detection Events**:
- `visibilitychange` - Standard browser event
- `pagehide` - Fired when home button pressed
- `pageshow` - Fired when returning to app

**2. Persistent State Storage**:
```javascript
// When backgrounded
localStorage.setItem('app_backgrounded_at', timestamp);

// Check during notification decision
const isRecentlyBackgrounded = backgroundTimestamp && 
  (Date.now() - parseInt(backgroundTimestamp)) < 30000; // 30 seconds
```

**3. Enhanced Notification Logic**:
```javascript
// Show notifications if ANY of these are true:
if (isDefinitelyBackground || !hasFocus || isRecentlyBackgrounded || typeof document === 'undefined') {
  return true; // Show notification
}
```

## 🔄 How It Fixes The Problem

**Before**:
1. Press home → disconnect → reconnect → "user is active" → no notifications

**After**:
1. Press home → `localStorage.setItem('app_backgrounded_at', timestamp)`
2. Disconnect/reconnect happens
3. Desktop sends message
4. Mobile checks: "Was I recently backgrounded?" → YES → show notification
5. Return to app → clear background state after 2s delay

## 🧪 Testing Process

1. **Mobile**: Join chat as "q"
2. **Mobile**: Press home button (should see: `📱 Page hidden (home button?) at: [time]`)
3. **Desktop**: Send message as "1" 
4. **Mobile**: Should receive notification because `isRecentlyBackgrounded = true`
5. **Mobile**: Return to app (should see: `📱 Page shown, cleared background state`)

## 📋 Enhanced Debugging

The logs will now show:
```
📱 Mobile visibility check: {
  isDefinitelyBackground: false,
  hasFocus: true, 
  isRecentlyBackgrounded: true,  // ← This is the key!
  backgroundTimestamp: "1749593507000"
}
📱 Mobile: showing notification {reason: 'recently backgrounded', ...}
```

## ⚙️ Configuration

- **Background window**: 30 seconds (adjustable)
- **Foreground delay**: 2 seconds (prevents rapid state changes)
- **Events tracked**: `visibilitychange`, `pagehide`, `pageshow`

---
**Deploy Command**: `npm run deploy:firebase:quick`
**Risk Level**: Low (additive feature, no breaking changes)
**Expected Result**: Mobile notifications work after pressing home button
