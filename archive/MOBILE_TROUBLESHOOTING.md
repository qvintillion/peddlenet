# Mobile Connection Troubleshooting Guide

## Quick Diagnosis

1. **Start development server:**
   ```bash
   npm run dev:mobile
   ```

2. **Test connection on mobile:**
   - Open `http://YOUR_IP:3000/diagnostics` on your mobile browser
   - All tests should pass ✅

## Common Issues & Solutions

### ❌ "Server Offline" on Mobile

**Cause:** Mobile device can't reach the signaling server

**Solutions:**
1. **Check both devices are on same WiFi:**
   - Computer and phone must be on identical network
   - Not guest network vs main network
   - Not 5GHz vs 2.4GHz bands (try connecting both to same band)

2. **Verify IP detection worked:**
   ```bash
   npm run dev:mobile
   ```
   - Should show: "✅ Detected local IP: 192.168.x.x"
   - If shows "localhost": WiFi connection issue

3. **Test server manually:**
   - Open `http://YOUR_IP:3001/health` in mobile browser
   - Should show server status JSON
   - If fails: firewall or network isolation issue

4. **Check firewall settings:**
   - macOS: System Settings > Network > Firewall > Turn off temporarily
   - Windows: Windows Defender Firewall > Turn off temporarily
   - Router: Check if client isolation is enabled (disable it)

### ❌ QR Code Shows "localhost"

**Cause:** IP detection failed or environment variable not set

**Solutions:**
1. **Always use the mobile dev script:**
   ```bash
   npm run dev:mobile  # ✅ Correct
   npm run dev         # ❌ Won't work for mobile
   ```

2. **Manual IP detection:**
   - Find your IP: `ifconfig | grep "inet "` (macOS/Linux)
   - Export manually: `export NEXT_PUBLIC_DETECTED_IP=192.168.1.100`
   - Then start: `npm run dev`

### ❌ Connection Test Fails

**Check these in order:**

1. **Frontend Test Fails:**
   - Check mobile browser can load any page
   - Try `http://YOUR_IP:3000` directly

2. **Server Health Test Fails:**
   - Check signaling server is running (port 3001)
   - Try `http://YOUR_IP:3001/health` in mobile browser
   - Should return: `{"status":"ok","rooms":0,"totalUsers":0}`

3. **WebSocket Test Fails:**
   - Most common issue: corporate/school network blocking WebSockets
   - Try different network (mobile hotspot)
   - Check router QoS/gaming mode settings

### ❌ Messages Not Syncing

**Cause:** WebSocket connection drops

**Solutions:**
1. **Check browser console:**
   - Open dev tools on mobile
   - Look for WebSocket errors

2. **Network stability:**
   - Try moving closer to router
   - Check WiFi signal strength

3. **Restart servers:**
   ```bash
   # Stop current process (Ctrl+C)
   npm run dev:mobile
   ```

## Network Requirements

### Router Settings
- **Client Isolation:** DISABLED
- **AP Isolation:** DISABLED  
- **Guest Network:** Use main network, not guest
- **UPnP:** ENABLED (helps with port communication)

### Firewall Ports
- **3000:** Next.js frontend
- **3001:** Signaling server
- Allow both TCP and UDP

### WiFi Networks That Work
✅ Home WiFi (WPA2/WPA3)
✅ Mobile hotspot
✅ Coffee shop WiFi (usually)

### WiFi Networks That Don't Work
❌ Corporate networks (often block P2P)
❌ School networks (strict firewall)
❌ Hotel WiFi (client isolation)
❌ Public WiFi with captive portal

## Advanced Debugging

### Manual IP Detection
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"

# Alternative for macOS
route get default | grep interface | awk '{print $2}' | xargs ifconfig
```

### Test Server Directly
```bash
# Test server health
curl http://YOUR_IP:3001/health

# Should return:
# {"status":"ok","rooms":0,"totalUsers":0,"timestamp":1234567890}
```

### Check Ports
```bash
# Check if ports are open
netstat -an | grep :3000
netstat -an | grep :3001

# Should show LISTEN on both ports
```

## Emergency Workarounds

### Can't Get IP Detection Working?
1. **Manual setup:**
   ```bash
   # Find your IP first
   ifconfig | grep "inet "
   
   # Export it manually
   export NEXT_PUBLIC_DETECTED_IP=192.168.1.100
   
   # Start normally
   npm run dev
   ```

2. **Use QR code manually:**
   - Generate QR for: `http://YOUR_IP:3000/chat/test-room`
   - Use any QR generator website

### Still Not Working?
1. **Try mobile hotspot:**
   - Connect computer to phone's hotspot
   - Phone will be able to access computer

2. **Use ngrok (last resort):**
   ```bash
   npm install -g ngrok
   ngrok http 3000
   # Use the ngrok URL instead
   ```

## Success Indicators

✅ **IP Detection Works:**
```bash
$ npm run dev:mobile
✅ Detected local IP: 192.168.1.100
```

✅ **Mobile Can Access Frontend:**
Open `http://192.168.1.100:3000` → Shows festival chat homepage

✅ **Server Health Check Works:**
Open `http://192.168.1.100:3001/health` → Shows JSON status

✅ **Diagnostics Page Passes:**
Open `http://192.168.1.100:3000/diagnostics` → All tests show ✅

✅ **QR Code Works:**
- Shows network IP in QR modal
- Mobile can scan and connect to chat room
- Messages sync between devices

If all these pass, your setup is working correctly!
