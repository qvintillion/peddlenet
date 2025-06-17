# 🚨 WebRTC UseEffect Loop - Debugging Guide

## Issue: 9 Attempts in 360ms

The error shows **9 connection attempts in 360ms** - this means the `useEffect` in the WebRTC hook is running repeatedly, causing an infinite loop.

## 🔍 Debug Steps

### Step 1: Clear Everything First
```javascript
// Clear all blocking states
window.NativeWebRTCDebug.clearLoopDetection()
```

### Step 2: Check What's Triggering UseEffect
Run this **before** any other commands to see the stack trace:

```javascript
// This will show you exactly what's causing the useEffect to run
// Check console for: "🔍 [WebRTC Hook] useEffect call stack:"
```

### Step 3: Identify the Root Cause

Look for these patterns in the console:

**Pattern 1: Dependency Loop**
```
🔍 [WebRTC Hook] useEffect triggered with disabled=false
🔍 [WebRTC Hook] useEffect call stack: ... (at hybrid-chat.ts:123)
```
→ Something in hybrid chat is changing props rapidly

**Pattern 2: State Loop** 
```
🔍 [WebRTC Hook] useEffect triggered with disabled=false
🔍 [WebRTC Hook] useEffect triggered with disabled=false
🔍 [WebRTC Hook] useEffect triggered with disabled=false
```
→ React state changing in a loop

**Pattern 3: Multiple Instances**
```
🔍 [WebRTC Hook hook-abc123] useEffect triggered
🔍 [WebRTC Hook hook-def456] useEffect triggered  
🔍 [WebRTC Hook hook-ghi789] useEffect triggered
```
→ Multiple hook instances running

## 🛠 Temporary Fix

If you see the loop, try this **SAFE** initialization approach:

```javascript
// Method 1: Use the safe disable flag
// Don't use forceInitialize() - it bypasses ALL safety checks
// Instead, check if WebRTC is actually disabled:

window.HybridChatDebug.getWebRTCStatus()
// If disabled: true, then the loop is being prevented by the disable flag
// This means something else is causing the rapid useEffect calls

// Method 2: Manual connection attempt via hybrid chat
window.HybridChatDebug.enableMesh()
window.HybridChatDebug.attemptWebRTCUpgrade()
// This doesn't bypass the WebRTC hook's internal protections
```

## 🎯 What to Look For

### In Console Output:
1. **Stack traces** showing where useEffect is called from
2. **Hook instance IDs** - should be consistent, not changing
3. **Dependency values** - look for rapid changes in roomId/displayName
4. **Rate limiting messages** - "🚨 RATE LIMITED: X attempts in 10s"

### Common Causes:
- **Display name changing rapidly** (Anonymous ↔ real name)
- **Room ID changing** 
- **Parent component re-rendering**
- **Multiple tabs with same user**
- **React Strict Mode** (development only)

## 💡 Best Practice Testing

Instead of `forceInitialize()`, try this safer approach:

```javascript
// 1. Check current state
window.HybridChatDebug.getWebRTCStatus()

// 2. If WebRTC is disabled by design, enable via hybrid chat
window.HybridChatDebug.enableMesh()

// 3. Let the peer bridge handle connections naturally
// Just open a second tab and it should trigger connections automatically
```

## 🆘 Emergency Reset

If completely stuck:

```javascript
// Nuclear option - clears everything
window.NativeWebRTCDebug.clearLoopDetection()
window.NativeWebRTCDebug.clearGlobalInstances()
window.HybridChatDebug.clearPeerBridgeCache()

// Then refresh the page and start over
location.reload()
```

---

**The stack trace will tell us exactly what's causing the rapid useEffect calls. Check the console output after clearing loop detection!**
