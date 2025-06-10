# 🛠️ Troubleshooting Guide - Festival Chat

## 🆕 **LATEST FIXES** (June 2025)

### ✅ **Auto-Reconnection System Active**
**No more manual refresh needed!** The app now automatically recovers from connection drops:
- **3-second auto-reconnect** after unexpected disconnections
- **30-second health monitoring** catches silent connection failures
- **Visual "Reconnecting..." status** with yellow pulsing indicator
- **Smart recovery logic** integrated with circuit breaker patterns

### ✅ **Mobile Connection Reliability Fixed** 
**80% fewer false "server disconnected" errors:**
- **Smart error detection** only shows after proven connectivity
- **8-second mobile tolerance** accommodates slower mobile networks
- **Connection state tracking** prevents errors during initial load
- **Enhanced user experience** with less error noise

### ✅ **UI Cleanup Applied**
**Streamlined interface improvements:**
- **Removed redundant invite button** from message input area
- **Single prominent QR button** in header for invitations
- **Cleaner visual hierarchy** with reduced clutter
- **Better mobile layout** with less cramped footer area

*Most connection issues now resolve automatically - try waiting 8 seconds before manual intervention!*

---

## 🎯 Quick Diagnosis

**First step for any issue**: Open the diagnostics page and check all systems.

### **Diagnostic URLs**
- **Local Development**: http://[your-ip]:3000/diagnostics
- **Production**: https://peddlenet.app/diagnostics
- **Backup**: https://festival-chat-peddlenet.web.app/diagnostics

### **Expected Diagnostic Results**
```
✅ Environment Badge: Development/Production
✅ Frontend Access: Basic connectivity working
✅ Server Health (HTTP): API endpoints responding
✅ WebSocket Connection: Real-time messaging ready
```

If any show ❌, follow the specific troubleshooting section below.

---

## 🔧 Connection Issues

### **\"Server Offline\" Error**

**Symptoms**: Mobile device shows \"Server offline\" or \"Connection failed\"

**Root Cause**: Network connectivity or server availability issues

**Solutions (in order of likelihood)**:

1. **Check Network Connectivity**
   ```bash
   # Verify both devices on same WiFi
   # Desktop: Check your IP
   ipconfig getifaddr en0  # macOS
   ipconfig | findstr IPv4  # Windows
   
   # Mobile: Try accessing http://[that-ip]:3000
   ```

2. **Verify Development Server Running**
   ```bash
   # Check terminal for these messages:
   # ✅ Detected local IP: 192.168.x.x
   # 🎵 Festival Chat Server running on port 3001
   
   # If not running:
   npm run dev:mobile
   ```

3. **Test Server Health Directly**
   ```bash
   # Desktop test:
   curl http://localhost:3001/health
   
   # Mobile test (use your IP):
   curl http://192.168.x.x:3001/health
   
   # Expected response:
   # {\"status\":\"ok\",\"timestamp\":...}
   ```

4. **Restart Development Environment**
   ```bash
   # Kill existing processes
   pkill -f \"node.*signaling-server\"
   pkill -f \"next-server\"
   
   # Clear cache
   rm -rf .next node_modules/.cache
   
   # Restart
   npm run dev:mobile
   ```

5. **Check Firewall/Network Settings**
   ```bash
   # macOS: Allow Node.js in firewall
   # Windows: Allow through Windows Defender
   # Router: Ensure client isolation disabled
   ```

### **\"Connection Rate Limit Exceeded\"**

**Symptoms**: Error message about rate limits, especially on mobile

**Root Cause**: Too many connection attempts in short time (mobile optimization active)

**Solutions**:

1. **Wait for Rate Limit Reset**
   ```javascript
   // Check current circuit breaker state in browser console:
   window.ConnectionResilience.getState()
   
   // Expected recovery: 10-15 seconds for rate limits
   ```

2. **Manual Circuit Breaker Reset**
   ```javascript
   // In browser console:
   window.ConnectionResilience.reset()
   window.MobileConnectionDebug.resetCircuitBreaker()
   
   // Then refresh page
   ```

3. **Use Mobile Debug Tools**
   ```javascript
   // Start monitoring:
   window.MobileConnectionDebug.start()
   
   // View connection attempts:
   window.MobileConnectionDebug.showLog()
   
   // Get help:
   window.MobileConnectionDebug.help()
   ```

4. **Avoid Rapid Reconnection**
   ```markdown
   ❌ AVOID:
   - Refreshing page multiple times quickly
   - Rapid room switching
   - Multiple browser tabs open to same site
   
   ✅ DO:
   - Wait 10-15 seconds between connection attempts
   - Use single browser tab
   - Let circuit breaker recover naturally
   ```

### **WebSocket Connection Fails**

**Symptoms**: \"WebSocket connection failed\" in browser console

**Root Cause**: WebSocket transport issues, often on corporate/restricted networks

**Solutions**:

1. **Check Transport Fallback**
   ```javascript
   // In browser console, check what transport is being used:
   // Look for these messages:
   // \"🔌 Connecting to chat server...\"
   // \"⬆️ Transport upgraded to websocket\" OR
   // \"📡 Using polling transport\"
   ```

2. **Test Different Networks**
   ```bash
   # Try in this order:
   1. Home WiFi (usually works)
   2. Mobile hotspot (bypasses network restrictions)  
   3. Different WiFi network
   4. Cellular data only
   ```

3. **Browser Compatibility Check**
   ```markdown
   ✅ SUPPORTED:
   - Chrome 90+ (desktop/mobile)
   - Safari 14+ (iOS/macOS)  
   - Firefox 88+ (desktop/mobile)
   - Edge 90+ (desktop)
   
   ❌ KNOWN ISSUES:
   - Internet Explorer (not supported)
   - Very old mobile browsers
   - Some corporate proxy configurations
   ```

4. **Manual Transport Test**
   ```javascript
   // Force polling transport (in browser console):
   // This bypasses WebSocket issues
   io.connect(serverUrl, { transports: ['polling'] })
   ```

---

## 📱 Mobile-Specific Issues

### **QR Code Scanner Not Working**

**Symptoms**: Camera doesn't open, scanning fails, or permission denied

**Solutions**:

1. **Check Camera Permissions**
   ```markdown
   iOS Safari:
   - Settings → Safari → Camera → Allow
   - Or tap 🛡️ icon in address bar
   
   Android Chrome:
   - Settings → Site Settings → Camera → Allow
   - Or tap 🔒 icon in address bar
   ```

2. **Test Camera Manually**
   ```javascript
   // In browser console, test camera access:
   navigator.mediaDevices.getUserMedia({ video: true })
     .then(stream => console.log('✅ Camera works'))
     .catch(err => console.log('❌ Camera error:', err))
   ```

3. **Manual Room Code Entry**
   ```markdown
   If QR scanning fails:
   1. Ask for room code (e.g., \"bright-stage-42\")
   2. Click \"Join Room\" instead of \"Scan QR\"
   3. Type room code exactly as provided
   4. Click \"Join Room\"
   ```

4. **QR Code Display Issues**
   ```markdown
   If QR shows localhost instead of IP:
   - Stop server: Ctrl+C
   - Restart: npm run dev:mobile (not npm run dev)
   - Check terminal shows network IP
   ```

### **Mobile Touch Issues**

**Symptoms**: Buttons hard to tap, interface not mobile-friendly

**Solutions**:

1. **Check Zoom Level**
   ```markdown
   - Ensure browser zoom at 100%
   - Try landscape mode for better typing
   - Use two-finger pinch to adjust if needed
   ```

2. **Test Touch Targets**
   ```javascript
   // All buttons should be minimum 44px per Apple/Google guidelines
   // If buttons feel small, try:
   // 1. Refresh page
   // 2. Clear browser cache
   // 3. Try different browser
   ```

3. **Keyboard Handling**
   ```markdown
   If message input disappears when typing:
   - Try landscape mode
   - Scroll down to reveal input
   - Close other apps to free memory
   ```

### **Mobile Network Switching**

**Symptoms**: Connection lost when switching WiFi ↔ cellular

**Solutions**:

1. **Enable Auto-Reconnection**
   ```javascript
   // Check circuit breaker allows reconnection:
   window.ConnectionResilience.getState()
   // Should show: { isOpen: false }
   ```

2. **Manual Reconnection**
   ```markdown
   When network switches:
   1. Wait 10-15 seconds for auto-reconnection
   2. If still offline, refresh page
   3. Check \"Connected\" status indicator
   4. Resend any unsent messages
   ```

3. **Optimize for Network Changes**
   ```javascript
   // Monitor network changes:
   window.MobileConnectionDebug.start()
   // Will log network transitions and recovery
   ```

---

## 💬 Messaging Issues

### **Messages Not Appearing**

**Symptoms**: Sent messages don't show on other devices

**Root Cause**: Connection sync issues or room mismatch

**Solutions**:

1. **Verify Same Room**
   ```markdown
   Check all devices show same room code:
   - Look for room code display (e.g., \"bright-stage-42\")
   - Ensure everyone joined same room
   - Case doesn't matter: \"BRIGHT-STAGE-42\" = \"bright-stage-42\"
   ```

2. **Check Connection Status**
   ```markdown
   Look for connection indicators:
   ✅ \"Connected • X people\" (good)
   ⚠️ \"Reconnecting...\" (temporary)
   ❌ \"Offline\" (needs troubleshooting)
   ```

3. **Force Message Sync**
   ```javascript
   // In browser console:
   // Force reconnection to sync messages
   location.reload()
   ```

4. **Test Message Flow**
   ```markdown
   Testing procedure:
   1. Send message from Device A
   2. Wait 5 seconds
   3. Check if appears on Device B
   4. Send reply from Device B
   5. Check if appears on Device A
   ```

### **Message History Missing**

**Symptoms**: Previous messages don't appear when rejoining room

**Root Cause**: Local storage or server persistence issues

**Solutions**:

1. **Check Local Storage**
   ```javascript
   // In browser console:
   localStorage.getItem('peddlenet_room_messages_[roomId]')
   
   // If null, messages weren't saved locally
   ```

2. **Server History Recovery**
   ```markdown
   Server keeps messages for 24 hours:
   - Refresh page to request server history
   - Recent messages should reappear
   - Very old messages (24h+) are permanently deleted
   ```

3. **Clear Corrupted Storage**
   ```javascript
   // If local storage corrupted:
   localStorage.removeItem('peddlenet_room_messages_[roomId]')
   location.reload()
   ```

### **Duplicate Messages**

**Symptoms**: Same message appears multiple times

**Root Cause**: Connection instability causing retransmission

**Solutions**:

1. **Refresh to Deduplicate**
   ```markdown
   - Refresh all affected devices
   - Messages should deduplicate automatically
   - Future messages should be normal
   ```

2. **Check Connection Stability**
   ```javascript
   // Monitor connection quality:
   window.MobileConnectionDebug.start()
   window.MobileConnectionDebug.showLog()
   
   // Look for frequent connect/disconnect cycles
   ```

---

## 🎪 Room Management Issues

### **\"Room Not Found\" Error**

**Symptoms**: Entering room code results in \"Room not found\"

**Root Cause**: Room code expired, mistyped, or server sync issues

**Solutions**:

1. **Verify Room Code Format**
   ```markdown
   Correct format: \"adjective-noun-number\"
   ✅ CORRECT:
   - \"bright-stage-42\"
   - \"purple-vibe-88\"
   - \"magic-beat-15\"
   
   ❌ INCORRECT:
   - \"bright stage 42\" (missing hyphens)
   - \"brightstage42\" (missing separators)
   - \"Bright-Stage-42\" (case doesn't matter, but check spelling)
   ```

2. **Check Room Age**
   ```markdown
   Rooms expire after 24 hours:
   - Ask room creator for current room code
   - Create new room if original expired
   - Recent rooms show creation time
   ```

3. **Test Server Room Registration**
   ```bash
   # Check if server knows about room:
   curl \"http://localhost:3001/resolve-room-code/bright-stage-42\"
   
   # Expected: {\"success\": true, \"roomId\": \"...\"}
   # Error: {\"success\": false, \"error\": \"Room code not found\"}
   ```

4. **Manual Room Registration**
   ```javascript
   // If room code should exist but doesn't:
   // Ask room creator to share QR code instead
   // QR codes include full room information
   ```

### **Recent Rooms Not Showing**

**Symptoms**: Previously joined rooms don't appear in recent list

**Root Cause**: Local storage cleared or corrupted

**Solutions**:

1. **Check Local Storage**
   ```javascript
   // In browser console:
   JSON.parse(localStorage.getItem('peddlenet_recent_rooms') || '[]')
   
   // Should show array of recent rooms
   ```

2. **Clear and Rebuild Recent Rooms**
   ```javascript
   // Clear corrupted recent rooms:
   localStorage.removeItem('peddlenet_recent_rooms')
   
   // Rejoin rooms manually to rebuild list
   ```

3. **Check Storage Limits**
   ```javascript
   // Recent rooms limited to 8 entries, 7 days retention
   // Older entries automatically removed
   ```

---

## 🔧 Development Issues

### **Build Failures**

**Symptoms**: `npm run build` or deployment fails

**Solutions**:

1. **Clear Build Cache**
   ```bash
   rm -rf .next out node_modules/.cache
   npm cache clean --force
   ```

2. **Check Node.js Version**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

3. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check TypeScript Errors**
   ```bash
   npx tsc --noEmit  # Check for type errors
   npm run lint      # Check for linting errors
   ```

### **Port Conflicts**

**Symptoms**: \"Port already in use\" errors

**Solutions**:

1. **Find and Kill Conflicting Processes**
   ```bash
   # macOS/Linux:
   lsof -ti:3000 | xargs kill
   lsof -ti:3001 | xargs kill
   
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID [PID] /F
   ```

2. **Use Different Ports**
   ```bash
   PORT=3002 npm run dev:mobile
   ```

### **Environment Issues**

**Symptoms**: Wrong server URLs, localhost in production

**Solutions**:

1. **Check Environment Detection**
   ```javascript
   // In browser console:
   window.ServerUtils.getEnvironmentInfo()
   
   // Should correctly identify development vs production
   ```

2. **Verify Environment Variables**
   ```bash
   # Check .env files exist:
   ls -la .env*
   
   # Should see .env, .env.local, etc.
   ```

---

## 📊 Performance Issues

### **Slow Connection/Loading**

**Symptoms**: Takes >30 seconds to connect or load

**Solutions**:

1. **Check Network Quality**
   ```javascript
   // Test connection speed:
   window.MobileConnectionDebug.forceTest()
   
   // Check latency in network tab of browser dev tools
   ```

2. **Optimize Browser Performance**
   ```markdown
   - Close other browser tabs
   - Disable browser extensions temporarily
   - Clear browser cache
   - Restart browser entirely
   ```

3. **Server Performance Check**
   ```bash
   # Check server response time:
   curl -w \"@%{time_total}s\" http://localhost:3001/health
   
   # Should be <1 second
   ```

### **High Battery Usage (Mobile)**

**Symptoms**: Phone battery drains quickly when using Festival Chat

**Solutions**:

1. **Check Connection Frequency**
   ```javascript
   // Monitor connection attempts:
   window.MobileConnectionDebug.start()
   
   // Look for excessive reconnection attempts
   ```

2. **Optimize Usage Patterns**
   ```markdown
   - Keep app in single browser tab
   - Don't switch between apps frequently
   - Close app when not actively chatting
   - Use WiFi instead of cellular when possible
   ```

---

## 🆘 Emergency Troubleshooting

### **Complete Reset Procedure**

**When everything is broken and nothing works:**

1. **Client-Side Reset**
   ```javascript
   // In browser console:
   localStorage.clear()
   window.ConnectionResilience.reset()
   location.reload()
   ```

2. **Server-Side Reset**
   ```bash
   # Kill all processes:
   pkill -f \"node\"
   pkill -f \"next\"
   
   # Full clean:
   rm -rf .next out node_modules/.cache
   
   # Restart:
   npm run dev:mobile
   ```

3. **Network Reset**
   ```markdown
   - Disconnect from WiFi, reconnect
   - Try mobile hotspot
   - Clear browser cache completely
   - Try incognito/private browsing mode
   ```

### **Get Help Faster**

**Information to gather before asking for help:**

1. **System Information**
   ```javascript
   // Run in browser console:
   console.log({
     userAgent: navigator.userAgent,
     url: location.href,
     connectionState: window.ConnectionResilience?.getState(),
     environment: window.ServerUtils?.getEnvironmentInfo()
   })
   ```

2. **Error Messages**
   ```markdown
   - Copy exact error messages from browser console
   - Note when error occurs (connection, sending message, etc.)
   - Screenshot of diagnostic page results
   ```

3. **Network Information**
   ```bash
   # Desktop:
   ipconfig getifaddr en0  # Your local IP
   curl http://localhost:3001/health  # Server status
   
   # Include this information when asking for help
   ```

---

## 🎯 Prevention Tips

### **Avoid Common Issues**

```markdown
✅ BEST PRACTICES:
- Use `npm run dev:mobile` for development (not `npm run dev`)
- Keep both devices on same WiFi network
- Allow camera permissions for QR scanning
- Wait for rate limits to reset instead of rapid retrying
- Use room codes as backup when QR scanning fails

❌ COMMON MISTAKES:
- Opening multiple tabs to same site
- Rapid refresh when connection issues occur
- Ignoring firewall/permission prompts
- Using localhost URLs on mobile devices
- Assuming network issues are app bugs
```

### **Proactive Monitoring**

```javascript
// Enable mobile debug monitoring:
window.MobileConnectionDebug.start()

// Check health periodically:
window.ServerUtils.testHttpHealth()

// Monitor circuit breaker state:
window.ConnectionResilience.getState()
```

---

**🎪 Most issues resolve with a simple refresh and 15-second wait!** Festival Chat is designed to be resilient, so temporary network hiccups usually self-resolve.

*For persistent issues, check the [Architecture Overview](./04-ARCHITECTURE.md) to understand how the system works.*