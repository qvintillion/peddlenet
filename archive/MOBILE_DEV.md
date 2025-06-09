# Festival Chat - Mobile Development Setup

## 🚀 Quick Start

```bash
npm run dev:mobile
```

That's it! This will:
- Detect your computer's local IP address
- Start both Next.js app and signaling server  
- Show mobile-accessible URLs
- Set up QR codes for instant mobile connections

## 📱 Testing on Mobile

1. **Start the servers:** `npm run dev:mobile`
2. **Check IP detection:** Should show "✅ Detected local IP: 192.168.x.x"
3. **Test diagnostics:** Open `http://YOUR_IP:3000/diagnostics` on mobile
4. **Try chat rooms:** All QR codes will automatically use your network IP

## 🔧 Troubleshooting

**Mobile says "Server Offline"?**
- Check [MOBILE_TROUBLESHOOTING.md](./MOBILE_TROUBLESHOOTING.md) for detailed solutions
- Try the diagnostics page: `http://YOUR_IP:3000/diagnostics`
- Ensure both devices are on same WiFi network

**QR codes showing localhost?**
- Make sure you used `npm run dev:mobile` (not `npm run dev`)
- Check your WiFi connection

## 🛠 What Was Fixed

✅ **Infinite Loop Bug**: Removed message persistence causing infinite re-renders  
✅ **QR IP Detection**: QR codes automatically use your local network IP  
✅ **WebSocket Connection**: Server connection uses detected IP for mobile compatibility  
✅ **Message Sync**: Clean server-based messaging without loops  
✅ **Debug Tools**: Added connection testing and diagnostics page

## 📖 Alternative Methods

### Manual Start (two terminals)
```bash
# Terminal 1: Start the signaling server
npm run server

# Terminal 2: Start Next.js with IP detection
export NEXT_PUBLIC_DETECTED_IP=$(ifconfig | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
npm run dev
```

### Custom IP Override
```bash
# If auto-detection fails, set manually:
export NEXT_PUBLIC_DETECTED_IP=192.168.1.100
npm run dev:mobile
```

## 📊 Architecture

- **Frontend**: Next.js on port 3000 (bound to all interfaces with `-H 0.0.0.0`)
- **Backend**: Socket.IO server on port 3001 (listens on `0.0.0.0`)
- **Connection**: WebSocket with polling fallback
- **Persistence**: Server-side message storage (survives page refreshes)
- **Mobile**: QR codes with IP detection for instant connections
- **Debug**: Built-in diagnostics and connection testing

## 🌐 Environment Variables

- `NEXT_PUBLIC_DETECTED_IP`: Your local network IP (auto-set by dev:mobile script)
- `NEXT_PUBLIC_SIGNALING_SERVER`: Override server URL (optional)

## 📁 Key Files

- `scripts/dev-mobile.sh`: IP detection and server startup
- `signaling-server.js`: WebSocket server with CORS for local IPs
- `src/hooks/use-websocket-chat.ts`: Client WebSocket connection logic
- `src/components/QRModal.tsx`: QR generation with IP detection
- `src/components/ConnectionTest.tsx`: Debug connection testing
- `src/app/diagnostics/page.tsx`: Mobile diagnostics page

## 🎯 Network Requirements

**Both devices must be on the same WiFi network and:**
- Router has client isolation disabled
- Firewall allows ports 3000 and 3001
- Network supports device-to-device communication

**Works with:** Home WiFi, mobile hotspot, most coffee shops  
**Doesn't work with:** Corporate networks, hotel WiFi with isolation

For detailed troubleshooting, see [MOBILE_TROUBLESHOOTING.md](./MOBILE_TROUBLESHOOTING.md)
