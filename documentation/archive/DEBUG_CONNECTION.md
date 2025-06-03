# 🔧 P2P Connection Debugging Guide

## Current Issues 🐛

From your logs, I can see these problems:

1. **Peer Recreation Loop**: 
   - Peer ID: `c9bdd3b7-a2ce-42fc-b487-d7290962a02e` 
   - Then: `🔒 Peer closed`
   - New Peer: `9983ff90-2595-446f-965f-4c8839ccb645`

2. **Connection Failures**:
   - `⚠️ Config 1 error: peer-unavailable`
   - Trying to connect to old/closed peer IDs

3. **Auto-reconnect Issues**:
   - System trying to connect to stale peer IDs from localStorage

## Root Causes 🔍

### **Issue 1: Peer Instability**
- PeerJS connections are being recreated too often
- Likely due to React StrictMode or effect dependencies
- Network/ngrok tunnel instability

### **Issue 2: Stale Peer Discovery**  
- Old peer IDs stored in localStorage
- Auto-reconnect attempts to dead peers
- No cleanup of invalid peer entries

### **Issue 3: Timing Issues**
- QR code generated before peer is stable
- Mobile device tries to connect to unstable peer
- Race conditions in initialization

## Quick Fixes to Try 🚀

### **Option 1: Disable React StrictMode**
Edit `src/app/layout.tsx` and wrap children without StrictMode:

```tsx
// Remove React.StrictMode wrapper if present
return (
  <html lang="en">
    <body>
      {children}  {/* No StrictMode wrapper */}
    </body>
  </html>
);
```

### **Option 2: Clear localStorage**
In browser console, run:
```javascript
// Clear all old peer data
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && key.includes('presence_v3_')) {
    localStorage.removeItem(key);
  }
}
location.reload();
```

### **Option 3: Use Manual Peer IDs**
Try connecting with manual peer IDs instead of QR:

1. Desktop: Note your peer ID from console
2. Mobile: Use "Manual Connect" button  
3. Enter the exact peer ID from desktop
4. This bypasses QR/localStorage issues

## Debugging Steps 🔍

### **Step 1: Check Peer Stability**
1. Open desktop app
2. Watch console for 30 seconds
3. Count how many times "✅ P2P ready" appears
4. **Should be only 1 time** - if more, peer is unstable

### **Step 2: Test Manual Connection**
1. Desktop: Copy peer ID from console  
2. Mobile: Open same room
3. Mobile: Use "Manual Connect" 
4. Paste peer ID and connect
5. This tests if P2P works without QR issues

### **Step 3: Check Network Tunnel**
1. Verify ngrok is stable
2. Try refreshing the ngrok tunnel
3. Test with different ngrok region: `ngrok http 3000 --region=us`

## Expected Console Flow ✅

**Correct startup sequence:**
```
🚀 Trying PeerJS config 1: default
✅ P2P ready with config 1: [peer-id]
📱 Generated invite QR with ACTUAL peer info: [same-peer-id]
```

**Correct connection sequence:**
```
Mobile: 📱 Found host peer info in URL: [peer-id]
Mobile: 📱 My current peer ID: [different-peer-id]  
Mobile: 📱 Will attempt connection to host peer in 3 seconds...
Desktop: 📞 Incoming connection: [mobile-peer-id]
Desktop: ✅ Connection opened: [mobile-peer-id]
```

## Next Steps 🎯

1. **Try Option 1** (disable StrictMode) first
2. **Clear localStorage** and test
3. **Test manual connection** to isolate QR issues
4. **Check ngrok stability**
5. **Enable debug panel** for more connection details

Let me know which of these steps helps identify the issue!
