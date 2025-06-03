# 🔍 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Connection Issues

#### ❌ "Peer recreations" or "Peer closed" loops
**Symptoms**: Console shows multiple peer creations, connections fail
```
🚀 Trying PeerJS config 1: default
✅ P2P ready with peer ID: abc123...
🔒 Peer closed
🚀 Trying PeerJS config 1: default  [RECREATION - BAD]
```

**Solutions**:
```bash
# 1. Use persistent P2P hook (production fix)
# In chat/[roomId]/page.tsx:
import { useP2PPersistent } from '@/hooks/use-p2p-persistent';

# 2. Clear React cache
rm -rf .next
npm run dev

# 3. Check for React StrictMode (should be disabled)
# In layout.tsx - ensure no <React.StrictMode> wrapper
```

#### ❌ "peer-unavailable" errors
**Symptoms**: Connection attempts fail with peer-unavailable
```
⚠️ Config 1 error: peer-unavailable
```

**Solutions**:
```bash
# 1. Check peer ID consistency
# Desktop console: Copy current peer ID
# Mobile: Use manual connect instead of QR

# 2. Wait for peer stabilization
# Give 10-15 seconds after peer creation before QR scan

# 3. Clear old peer data
localStorage.clear();
location.reload();
```

#### ❌ Mobile connections hang at "CONNECTING"
**Symptoms**: Connection starts but never completes
```
🔍 Connection state: CONNECTING
[Never shows: ✅ Connection opened]
```

**Solutions**:
```bash
# 1. Verify HTTPS (required for mobile WebRTC)
# URL should show 🔒 in mobile browser

# 2. Test different network combinations
# - Both on WiFi (same network)
# - Desktop WiFi → Mobile cellular  
# - Mobile hotspot for both devices

# 3. Try different mobile browser
# Safari → Chrome or Chrome → Firefox

# 4. Check STUN server access
# In mobile console:
fetch('https://stun.l.google.com:19302')
  .then(() => console.log('STUN OK'))
  .catch(e => console.log('STUN blocked:', e));
```

### UI/Status Issues

#### ❌ Status stays red despite successful connection
**Symptoms**: Logs show connection working, UI shows disconnected
```
✅ Connection opened: abc123...
📊 Updated connections. Count: 1
[But UI still shows red status]
```

**Solutions**:
```bash
# 1. Check for stale useCallback closures
# Should be fixed in useP2PPersistent hook

# 2. Force status update in console
window.P2PDebug?.forceStatusUpdate?.();

# 3. Check global peer ID
console.log('Global peer ID:', window.globalPeer?.id);
console.log('State peer ID:', /* from component state */);
```

#### ❌ QR codes contain wrong URLs or peer IDs
**Symptoms**: QR leads to wrong page or non-existent peer
```
🌐 QR URL: http://localhost:3000/... [Wrong - should be HTTPS]
🌐 QR URL: .../scan/... [Wrong - should be /chat/ or /test-room]
```

**Solutions**:
```bash
# 1. Ensure ngrok tunnel is stable
curl -I https://your-ngrok-url.io

# 2. Regenerate QR after peer stabilizes
# Click "🔄 Refresh QR" button

# 3. Check QR URL in console logs
# Should contain current peer ID and HTTPS URL
```

### Development Issues

#### ❌ "crypto.randomUUID is not a function"
**Symptoms**: App crashes during initialization
```
TypeError: crypto.randomUUID is not a function
```

**Solutions**:
```bash
# Fixed in current version - uses compatible UUID generation
# If you see this, update to latest peer-utils.ts:

import { generateCompatibleUUID } from '@/utils/peer-utils';
```

#### ❌ "forceReconnect is not defined" 
**Symptoms**: Chat page crashes on load
```
ReferenceError: forceReconnect is not defined
```

**Solutions**:
```bash
# Fixed in current version - update chat page:
# Change useP2POptimized → useP2PPersistent
# Remove references to forceReconnect, forceCleanup
```

#### ❌ Hydration mismatch warnings
**Symptoms**: React hydration warnings about form attributes
```
A tree hydrated but some attributes didn't match...
```

**Solutions**:
```bash
# Non-critical warning caused by browser extensions
# Add suppressHydrationWarning={true} to form inputs if bothersome
```

## 🔧 Debug Commands

### Browser Console Commands
```javascript
// Check peer status
window.globalPeer                    // Global peer object
window.globalPeer?.id               // Current peer ID
window.globalPeer?._connections     // Active connections

// Debug utilities
window.P2PDebug?.forceStatusUpdate?.()  // Force status recalculation
window.P2PDebug?.getConnections?.()     // Get connection map
window.NetworkUtils?.getBaseURL?.()     // Check base URL detection

// Clear data and restart
localStorage.clear();
location.reload();

// Test WebRTC support
!!window.RTCPeerConnection           // Should be true
navigator.mediaDevices !== undefined // Should be true
```

### Terminal Debug Scripts
```bash
# Step-by-step debugging
./debug-p2p.sh

# Mobile-specific issues  
./debug-mobile.sh

# WebRTC connection debugging
./debug-webrtc.sh

# Clean restart
rm -rf .next
./mobile-dev.sh
```

## 📱 Mobile-Specific Issues

### iOS Safari Issues
```bash
# 1. Ensure HTTPS (iOS requires secure context)
# 2. Check for iOS-specific WebRTC limitations
# 3. Test in private browsing mode
# 4. Try Chrome for iOS as alternative
```

### Android Chrome Issues  
```bash
# 1. Enable "Desktop site" if needed
# 2. Check mobile data vs WiFi
# 3. Clear browser cache/data
# 4. Test with mobile Firefox
```

### Cellular Network Issues
```bash
# Some carriers block P2P connections
# Test with WiFi first to isolate issue
# Try different cellular carriers if available
# Use mobile hotspot as workaround
```

## 🌐 Network Troubleshooting

### STUN Server Issues
```bash
# Test STUN server connectivity
curl -v stun.l.google.com:19302

# Try alternative STUN servers
# - stun.cloudflare.com:3478
# - stun.nextcloud.com:443
```

### Firewall Issues
```bash
# Corporate/school networks often block WebRTC
# Try different network (mobile hotspot)
# Check with network administrator about WebRTC policies
```

### NAT Traversal Issues
```bash
# Complex NAT setups may require TURN servers
# Current setup includes basic TURN fallback
# Consider dedicated TURN server for enterprise use
```

## 🎯 Performance Issues

### Slow Connections
```bash
# 1. Check STUN server response time
# 2. Try connecting on same network first
# 3. Monitor network quality
# 4. Reduce ICE candidate pool if needed
```

### Memory Leaks
```bash
# 1. Check for event listener cleanup
# 2. Monitor connection count over time
# 3. Ensure proper peer destruction on unmount
```

## 🆘 Emergency Fixes

### Quick Reset
```bash
# Clear everything and restart
localStorage.clear();
rm -rf .next
./mobile-dev.sh
```

### Fallback Testing
```bash
# Use test-room page for isolation
https://your-ngrok-url.io/test-room

# Test with manual connection (not QR)
# Copy peer ID manually between devices
```

### Production Issues
```bash
# If production deployment fails:
# 1. Test build locally first
npm run build && npm run start

# 2. Check Vercel deployment logs
vercel logs

# 3. Verify environment variables
vercel env ls
```

## 📞 Getting Help

### Information to Gather
When reporting issues, include:
- **Browser versions** (desktop + mobile)
- **Network setup** (WiFi/cellular, same/different networks)
- **Console logs** (full error messages)
- **Steps to reproduce**
- **Expected vs actual behavior**

### Debug Information Export
```javascript
// Run this in browser console to get debug info
const debugInfo = {
  globalPeer: !!window.globalPeer,
  peerId: window.globalPeer?.id,
  connections: window.globalPeer?._connections ? 
    Object.keys(window.globalPeer._connections).length : 0,
  webrtc: !!window.RTCPeerConnection,
  https: location.protocol === 'https:',
  userAgent: navigator.userAgent
};
console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

---

*This troubleshooting guide covers 95% of issues encountered during Festival Chat development and deployment. For additional help, see the [Development Guide](./DEVELOPMENT-GUIDE.md).*
