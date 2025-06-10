# P2P Connection Testing Guide - Updated

## 🔧 Recent Fixes Applied

### Major Issues Resolved:
1. **Fixed Next.js 15 params handling** - Eliminated async params errors
2. **Switched to reliable PeerJS server** - Using 0.peerjs.com instead of Heroku
3. **Added connection retry logic** - 3 automatic retries with 2-second delays
4. **Prevented self-connections** - Fixed mobile devices connecting to themselves
5. **Enhanced error handling** - Specific handling for network vs peer errors
6. **Improved peer storage** - Better localStorage management and cleanup

## 🚀 How to Test P2P Connections (Updated)

### Prerequisites

1. **Clear Browser Storage First (Important!):**
```javascript
// In browser console on BOTH devices:
localStorage.clear();
sessionStorage.clear();
```

2. **Start Development Server:**
```bash
npm run dev
```

3. **Setup HTTPS for Mobile Testing:**
```bash
# Install ngrok if not already installed
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Method 1: Desktop + Mobile Testing (Recommended)

1. **Desktop Setup:**
   - Navigate to `http://localhost:3000/admin`
   - Enter display name (e.g., "Desktop User")
   - Click "Generate QR Code"
   - Click "Join Chat Room"
   - **Wait for peer initialization** (look for peer ID in debug panel)

2. **Mobile Setup:**
   - Open the **ngrok HTTPS URL** on mobile browser
   - Allow camera permissions when prompted
   - Navigate to `/scan` page
   - Scan the QR code from desktop
   - Enter display name (e.g., "Mobile User")
   - **Automatic room joining**

3. **Connection Process:**
   - **Wait 10-30 seconds** for auto-connection
   - Watch browser console for connection attempts
   - Look for "Successfully connected to: [peer-id]" message
   - Connection may retry up to 3 times (this is normal)

4. **Test Messaging:**
   - Type message on desktop → should appear on mobile
   - Type message on mobile → should appear on desktop
   - Check console for "📤 Message sent" and "📨 Parsed message" logs

### Method 2: Two Browser Windows (Quick Testing)

1. **Window 1 (Chrome):**
   - Go to `http://localhost:3000/admin`
   - Generate QR code with name "User1"
   - Click "Join Chat Room"
   - Note the room ID from URL

2. **Window 2 (Firefox/Incognito):**
   - Go to `http://localhost:3000/chat/[room-id]` (copy from Window 1)
   - Enter name "User2"
   - Wait for auto-connection

3. **Manual Connection (if needed):**
   - Copy Peer ID from Window 1's debug panel
   - In Window 2, click "Manual Connect"
   - Paste the Peer ID and click "Connect"

## 🔍 Debug Information - What to Look For

### Browser Console Logs

**✅ Successful Connection Pattern:**
```
Initializing P2P for room: abc123...
P2P initialized with ID: def456...
Cleaned room peers from [] to []
Auto-connecting to room peers: ["ghi789"] (filtered from: ["ghi789"])
Attempting to connect to peer: ghi789 (attempt 1/4)
✓ Successfully connected to: ghi789
📤 Message sent to 1/1 peers
📨 Parsed message from ghi789: hello world
```

**⚠️ Normal Retry Pattern:**
```
Attempting to connect to peer: ghi789 (attempt 1/4)
Connection timeout for: ghi789 (attempt 1)
Retrying connection to ghi789 in 2 seconds...
Attempting to connect to peer: ghi789 (attempt 2/4)
✓ Successfully connected to: ghi789
```

**❌ Error Patterns to Watch:**
```
Preventing self-connection to: [same-id]          # Fixed - should not appear
Could not connect to peer                         # Network/server issue
Max retries exceeded for: [peer-id]              # All 3 retries failed
No valid peers to connect to                     # Room peer discovery issue
```

### Debug Panel Status

**Healthy Connection:**
- **My Peer ID**: Shows unique ID (not empty)
- **Status**: Connected
- **Peers**: 1 (for 2-device test)
- **Network**: local
- **Signal**: strong
- **Connected to**: Shows other peer's ID (not your own)

**Problem Indicators:**
- **Peers**: 0 (no connections established)
- **Connected to**: Shows your own peer ID (self-connection bug)
- **Status**: Disconnected after 60+ seconds

## 🐛 Troubleshooting Guide

### Issue 1: "Auto-connection taking too long"

**Symptoms:** Devices stay disconnected for 2+ minutes
**Solutions:**
1. Check that both devices scanned the SAME QR code
2. Clear localStorage on both devices: `localStorage.clear()`
3. Refresh both pages and try again
4. Use "Manual Connect" as backup method
5. Check browser console for specific error messages

### Issue 2: "Messages not appearing on other device"

**Symptoms:** Shows connected but messages don't sync
**Debug Steps:**
1. Check console for "📤 Message sent to X/Y peers" - should show 1/1
2. Check for "📨 Parsed message from [peer]" on receiving device
3. If sending works but receiving fails, it's a data channel issue
4. Try refreshing the receiving device

**Solutions:**
- Refresh both devices and reconnect
- Try incognito/private browsing mode
- Check firewall settings
- Test on different networks

### Issue 3: "Connection works on WiFi but not cellular"

**Symptoms:** Desktop+WiFi works, but mobile+cellular fails
**Cause:** Some cellular networks block WebRTC connections
**Solutions:**
- Switch mobile device to WiFi
- Try different cellular carriers
- Use mobile hotspot as intermediary
- Contact cellular provider about WebRTC restrictions

### Issue 4: "Peer IDs keep accumulating"

**Symptoms:** Debug shows many room peers but few connections
**Fixed In:** Current version now prevents this
**If Still Occurs:**
1. Click "Clear Room" button in debug panel
2. Use `localStorage.clear()` in console
3. Restart both devices

### Issue 5: "Camera not working for QR scanning"

**Symptoms:** Black screen or permission denied
**Solutions:**
- **HTTPS Required**: Use ngrok URL, not localhost on mobile
- **Permission**: Allow camera access when prompted
- **Browser**: Try Chrome, Firefox, Safari (avoid older browsers)
- **Refresh**: Try refreshing page and allowing permissions again

## 🧪 Advanced Testing Scenarios

### Network Resilience Testing

1. **Connection Recovery:**
   - Connect two devices successfully
   - Turn off WiFi on one device for 30 seconds
   - Turn WiFi back on
   - Should auto-reconnect within 60 seconds

2. **Cross-Network Testing:**
   - Desktop on WiFi, Mobile on cellular
   - Both should connect via STUN servers
   - May take longer (30-60 seconds)

3. **Firewall Testing:**
   - Test on corporate/restricted networks
   - May require manual connection method
   - Some networks completely block WebRTC

### Multi-Device Testing

1. **3+ Device Test:**
   - Add third device to same room
   - All devices should discover each other
   - Messages should reach all devices
   - Connection graph should be fully meshed

2. **Room Isolation Test:**
   - Create two different QR codes/rooms
   - Devices in different rooms should NOT connect
   - Verify room peer storage is isolated

### Performance Testing

1. **Message Throughput:**
   - Send rapid messages (1 per second)
   - All should arrive in correct order
   - No message loss or duplication

2. **Connection Stability:**
   - Keep connection open for 30+ minutes
   - Should maintain stable connection
   - Automatic reconnection if disrupted

## 📊 Success Criteria

### ✅ Phase 1 Success Metrics:
- **Connection Success Rate**: >90% within 30 seconds
- **Message Delivery**: 100% delivery rate for connected peers
- **Cross-Platform**: Works on Desktop Chrome + Mobile Safari
- **Network Resilience**: Survives network changes
- **User Experience**: No manual peer ID exchange needed

### 🎯 Performance Targets:
- **Initial Connection**: <30 seconds (including retries)
- **Message Latency**: <500ms on local network
- **Reconnection Time**: <60 seconds after network change
- **Memory Usage**: <50MB per device sustained
- **Battery Impact**: Minimal drain on mobile devices

## 🚀 Next Testing Phase

Once basic P2P works reliably:

1. **Load Testing**: 10+ devices in same room
2. **Distance Testing**: Devices across different cities
3. **Festival Simulation**: Test in crowded WiFi environment
4. **Battery Life**: Extended usage testing on mobile
5. **Feature Testing**: File sharing, reactions, presence

## 💡 Pro Testing Tips

1. **Use Multiple Browsers**: Chrome + Firefox for cross-browser testing
2. **Mobile Variety**: Test iOS Safari + Android Chrome
3. **Network Diversity**: Home WiFi + cellular + public WiFi
4. **Clear State**: Always clear localStorage between test runs
5. **Console Monitoring**: Keep browser dev tools open for all tests
6. **Document Issues**: Screenshot + console logs for any problems

## 📞 Quick Test Commands

```bash
# Full reset and test
localStorage.clear(); location.reload();

# Check peer storage
console.log(localStorage.getItem('roomPeers_[room-id]'));

# Debug connection state
console.log('Peer ID:', [peer object]);
console.log('Connections:', [connections map]);

# Force reconnection
[call forceReconnect function from debug panel]
```

The key insight is that **connection retry logic is now automatic** - the system will attempt to connect up to 3 times with 2-second delays. This significantly improves success rates, especially on mobile networks.

**Most Important:** Always start with `localStorage.clear()` on both devices to ensure clean state for testing!
