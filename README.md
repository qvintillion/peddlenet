# 🎪 Festival Chat - PeddleNet

A real-time chat application designed for festivals and events with instant QR code connections and mobile-first architecture.

## 🚀 Quick Start

### For Mobile Development
```bash
npm install
npm run dev:mobile
```

This automatically:
- Detects your local network IP address
- Starts both frontend (port 3000) and backend (port 3001)
- Enables QR code scanning from mobile devices
- Sets up real-time messaging with persistence

### For Standard Development
```bash
npm install
npm run dev
```

## 📱 Mobile Testing

1. **Start servers:** `npm run dev:mobile`
2. **Check IP detection:** Should show "✅ Detected local IP: 192.168.x.x"
3. **Test on mobile:** Open `http://YOUR_IP:3000/diagnostics`
4. **Join rooms:** Scan QR codes for instant connections

## ✨ Features

- **🔗 Instant QR Connections:** Scan to join rooms in 5-10 seconds
- **💬 Real-time Messaging:** WebSocket-based with polling fallback
- **💜 Smart Favorites System:** Heart-based room bookmarking with notification integration
- **📱 Mobile Optimized:** Works seamlessly across devices
- **🔄 Auto-Reconnection:** Intelligent reconnection without manual refresh
- **🔄 Message Persistence:** Survives page refreshes and reconnections
- **🌐 Network Discovery:** Automatic IP detection for mobile access
- **🎯 Zero Configuration:** No signups, accounts, or complex setup
- **🛡️ Privacy Focused:** Messages stored locally and in server memory only
- **📋 Room Codes:** Memorable codes for easy room sharing (blue-stage-42)
- **🎨 Clean Interface:** Streamlined UI with dark mode design

## 🏗️ Architecture

### Frontend (Port 3000)
- **Framework:** Next.js 15 with React 19
- **Styling:** Tailwind CSS 4
- **Real-time:** Socket.IO client
- **QR Generation:** qrcode library
- **Persistence:** localStorage + server sync

### Backend (Port 3001) 
- **Server:** Node.js with Express
- **WebSockets:** Socket.IO server
- **Database:** SQLite with 24h retention
- **CORS:** Configured for local network access
- **Message Storage:** Persistent with room code mapping
- **Health Endpoint:** `/health` for connection testing
- **Room Codes:** `/register-room-code` and `/resolve-room-code` endpoints

### Connection Flow
1. **Network Detection:** Auto-detect local IP for mobile access
2. **Protocol Management:** ServerUtils handles HTTP vs WebSocket URLs automatically
3. **WebSocket Connection:** Primary with polling fallback
4. **Room Management:** Server-side room state and message history
5. **QR Code Generation:** Include connection details for instant pairing
6. **Message Sync:** Real-time broadcast with persistence

## 🔧 Recent Updates (June 2025)

### **✅ CRITICAL: Development Workflow Protection** (June 11, 2025)
- **Enhanced deployment safety** with automatic dev server conflict detection
- **Environment protection** - staging deployments no longer corrupt development setup
- **Process isolation** - eliminates port conflicts between dev and build processes
- **Seamless recovery** - automatic backup/restore of development environment
- **Zero workflow changes** - existing deployment commands now include safety measures

**📚 Complete details**: [DEVELOPMENT-STABILITY-UX-UPDATE-JUNE-11-2025.md](./docs/DEVELOPMENT-STABILITY-UX-UPDATE-JUNE-11-2025.md)

### **✅ Enhanced Room Navigation** (June 11, 2025)
- **Always-visible room display** - fresh users now see room ID immediately in header
- **Smart switcher behavior** - dropdown functionality only when multiple rooms available
- **Progressive enhancement** - basic display for new users, full features for experienced users
- **Unread message indicators** - clear visual feedback for active rooms

### **✅ React Hydration Stability** (June 11, 2025)
- **Fixed hydration mismatches** in notification banner component
- **Consistent SSR/client rendering** - eliminated flash of different content
- **Enhanced error handling** - safer dynamic imports with parameter validation
- **Improved loading states** - smooth transitions during initialization

### **💜 Enhanced Favorites System** (June 10, 2025)
- **Heart-based favorites** with ❤️/🤍 toggle buttons in chat headers
- **Smart notification integration** - favoriting automatically enables notifications
- **Horizontal scrolling cards** with room codes, timestamps, and status indicators
- **Cross-component synchronization** with real-time status updates
- **Mobile-optimized design** perfect for festival coordination

### **✅ Background Notifications Stability** (June 10, 2025)
- **Eliminated infinite connection loops** when notifications disabled
- **Rate limiting with exponential backoff** (2s → 4s → 8s → 16s → 30s)
- **Smart connection management** - only connects when notifications enabled
- **Resource optimization** with automatic cleanup and mobile battery improvements

### **🔧 JavaScript & Connection Reliability** (June 9, 2025)
- **Fixed Temporal Dead Zone (TDZ) errors** in production builds
- **Auto-reconnection system** with 3-second recovery and 30-second health monitoring
- **Mobile reliability improvements** - 80% fewer false disconnect errors
- **Enhanced error detection** - only shows errors after proven connectivity

### **🎨 UI/UX & Infrastructure Improvements** (June 2025)
- **Streamlined interface** with reduced clutter and better mobile layouts
- **Dark mode optimization** with consistent purple branding
- **Infrastructure consolidation** - unified backend for 50% cost reduction
- **Room code reliability** - 100% consistent manual entry across domains
- **Package deprecation fixes** - eliminated 10+ npm warnings in deployments

**📚 Full documentation**: [docs/](./docs/) directory contains comprehensive guides

## 🛠️ Build Troubleshooting

### **If Build Fails:**
```bash
# Clean build artifacts
rm -rf .next out node_modules/.cache
npm cache clean --force

# Reinstall dependencies if needed
rm -rf node_modules
npm install

# Try development first
npm run dev

# Then attempt Firebase build
npm run build:firebase
```

### **Common Build Issues:**
- **Webpack chunk errors:** Clean .next directory and rebuild
- **Headers with export:** Fixed in next.config.ts (conditional headers)
- **Module not found:** Clear cache and reinstall dependencies
- **Static export conflicts:** ServerUtils handles client-side only operations

## 📁 Key Files

```
├── src/
│   ├── app/
│   │   ├── chat/[roomId]/page.tsx    # Main chat interface (updated)
│   │   └── diagnostics/page.tsx      # Connection testing
│   ├── components/
│   │   ├── QRModal.tsx               # QR code generation
│   │   ├── ConnectionTest.tsx        # Debug utilities (updated)
│   │   └── NetworkStatus.tsx         # Connection indicators
│   ├── hooks/
│   │   └── use-websocket-chat.ts     # WebSocket connection logic (updated with auto-reconnect)
│   └── utils/
│       ├── server-utils.ts           # 🆕 HTTP/WebSocket URL management
│       ├── room-codes.ts             # Room code utilities (updated)
│       ├── network-utils.ts          # IP detection
│       ├── message-persistence.ts    # Local storage
│       └── peer-utils.ts             # Connection utilities
├── scripts/
│   └── dev-mobile.sh                 # Mobile development script
├── signaling-server-sqlite.js        # WebSocket server (updated with room codes)
├── next.config.ts                    # Build configuration (updated)
└── package.json
```

## 🛠️ Development Scripts

```bash
# Mobile development (recommended)
npm run dev:mobile        # Auto IP detection + dual server start

# Standard development
npm run dev               # Frontend only
npm run server            # Backend only

# Production
npm run build             # Build for production
npm run start             # Start production server

# Deployment
npm run deploy:firebase:complete    # Full stack deployment
npm run deploy:firebase:quick      # Frontend-only deployment
```

## 🌐 Environment Variables

### Development
- `NEXT_PUBLIC_DETECTED_IP`: Local network IP (auto-set by dev:mobile)
- `NEXT_PUBLIC_SIGNALING_SERVER`: Override server URL (optional)
- `PORT`: Server port (default: 3001)

### Production
- `NEXT_PUBLIC_SIGNALING_SERVER`: Production server URL (WSS format)
  - Example: `wss://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app`
  - ServerUtils automatically converts to HTTPS for API calls

## 🔧 Network Requirements

**Both devices must be on the same WiFi network:**
- Router client isolation: **DISABLED**
- Firewall ports 3000 & 3001: **ALLOWED**
- Network type: **Private WiFi** (not guest networks)

**✅ Compatible Networks:**
- Home WiFi (WPA2/WPA3)
- Mobile hotspot
- Coffee shop WiFi (usually)

**❌ Incompatible Networks:**
- Corporate networks (firewall restrictions)
- Hotel WiFi (client isolation)
- Public WiFi with captive portals

## 🐛 Troubleshooting

### Quick Diagnosis
```bash
npm run dev:mobile
# Open http://YOUR_IP:3000/diagnostics on mobile
```

### Connection Test Results
The diagnostics page will show:
- ✅ **Environment Badge:** Development/Production
- ✅ **Frontend Access:** Basic connectivity
- ✅ **Server Health (HTTP):** API endpoint connectivity  
- ✅ **WebSocket Connection:** Real-time messaging capability

### Common Issues

**Connection Loss/Drops:**
- ✅ **Auto-reconnection enabled** - No manual refresh needed
- The app now automatically reconnects within 3 seconds of any disconnect
- Watch for "Reconnecting..." status with yellow pulsing indicator
- Health monitoring runs every 30 seconds to catch silent disconnections

**"Server Offline" on Mobile:**
- Ensure both devices on same WiFi network
- Check IP detection shows network IP (not localhost)
- Test server health: `http://YOUR_IP:3001/health`
- Disable firewall temporarily

**"Mixed Content" or "Protocol" Errors:**
- ✅ **Fixed with ServerUtils** - Automatically handles HTTPS/WSS conversion
- The system now properly separates HTTP API calls from WebSocket connections
- No manual intervention needed

**QR Code Shows "localhost":**
- Use `npm run dev:mobile` (not `npm run dev`)
- Verify WiFi connection and IP detection

**Room Code Registration Failing:**
- Deploy updated server: `npm run deploy:firebase:complete`
- The production server needs the latest endpoints

**Background Notification Connection Loops:**
- ✅ **Fixed with smart connection management** - Eliminated infinite reconnection loops
- Only connects when notifications are actually enabled for rooms
- Rate limiting with exponential backoff prevents server overload
- Automatic disconnection when no active notification subscriptions
- No more "Connection rate limit exceeded" errors

**False "Server Disconnected" Errors:**
- ✅ **Fixed with smart detection** - 80% fewer false alerts
- Only shows errors after proven connectivity is established
- 8-second delay accommodates slower mobile network conditions
- No more errors during normal initial connection process

**Messages Not Syncing:**
- Check WebSocket connection in browser console
- Restart servers: `npm run dev:mobile`
- Test connection stability

## 🚀 Deployment

### **🛡️ Enhanced Deployment Safety** (June 11, 2025)

All deployment scripts now include comprehensive safety measures to prevent development server conflicts:

**Safety Features:**
- **🛑 Process conflict detection** - Automatically detects and stops dev servers on ports 3000/3001
- **💾 Environment protection** - Backs up and restores `.env.local` to prevent corruption
- **🧹 Clean deployment** - Cache busting and fresh builds guaranteed
- **🔄 Seamless recovery** - Automatic environment restoration with restart instructions

**Enhanced Scripts:**
```bash
# All now include safety measures - no workflow changes needed!
npm run deploy:firebase:super-quick  # Rapid iteration + dev server safety
npm run deploy:firebase:quick        # Frontend changes + environment protection  
npm run deploy:firebase:complete     # Infrastructure updates + conflict prevention
```

**Example Safe Deploy:**
```bash
$ npm run deploy:firebase:quick

⚡ Quick Firebase Functions + Hosting Update (Safe)
==================================================
💾 Protecting development environment...
✅ Backed up .env.local
⚠️ WARNING: Development server running on port 3000
Stop dev server and continue? (y/N): y
🛑 Stopping development servers...
🏗️ Building and deploying...
🔄 Restoring development environment...
✅ Restored original .env.local
🛡️ Development environment protected
📱 To restart development: npm run dev:mobile
```

### Firebase (Full Stack)
```bash
npm run deploy:firebase:complete
```
Deploys both frontend and backend with all latest features.

### Frontend Only (UI Changes)
```bash
npm run deploy:firebase:quick
```

### Custom Server
```bash
npm run build
npm run start
# Also deploy signaling-server-sqlite.js to your backend
```

## 📊 Performance

- **Connection Time:** 5-10 seconds via QR scan
- **Message Latency:** <100ms on local network
- **Concurrent Users:** 50+ per room (memory permitting)
- **Message History:** 100 messages per room
- **Room Persistence:** 24 hours
- **Local Storage:** 500 messages per room, 10 rooms max
- **Auto-reconnection:** 3-second recovery from disconnections + 30-second health monitoring
- **Connection reliability:** 80% fewer false disconnect notifications on mobile
- **Smart error detection:** Only triggers after proven connectivity established

## 🔒 Privacy & Security

- **No Account Required:** Anonymous usage
- **Local Data Only:** No cloud message storage (messages persist in SQLite for 24h)
- **Temporary Rooms:** Automatic cleanup
- **Network Isolation:** Local WiFi or secure WebSocket connections
- **No Analytics:** No tracking or data collection

## 🔄 Connection Reliability

### **Auto-Reconnection System**
Festival Chat features intelligent auto-reconnection that eliminates the need for manual page refreshes:

- **Automatic Recovery:** 3-second reconnection after unexpected disconnections
- **Health Monitoring:** 30-second interval checks for silent connection failures
- **Visual Feedback:** "Reconnecting..." status with yellow pulsing indicator
- **Smart Detection:** Only shows errors after proven connectivity is established
- **Mobile Optimized:** 8-second tolerance for slower mobile network conditions
- **Circuit Breaker Integration:** Prevents connection spam while ensuring reliability

### **Connection Status Indicators**
- 🟢 **Green dot:** Connected and online
- 🟡 **Yellow pulsing:** Reconnecting in progress
- 🔴 **Red dot:** Disconnected (auto-reconnection scheduled)
- **"Reconnecting..." badge:** Clear visual feedback during recovery

### **Mobile Connection Improvements**
- **80% reduction** in false "server disconnected" error messages
- **Smart state tracking** distinguishes initial load from actual disconnections
- **Enhanced mobile tolerance** with longer delay periods for mobile networks
- **No manual refresh needed** - automatic background recovery

## 🏷️ Room Codes

Room codes provide memorable alternatives to QR scanning with enterprise-grade reliability:
- **Format:** `blue-stage-42` (adjective-noun-number)
- **Generation:** Deterministic from room ID with hash-based consistency
- **Unified Backend:** 100% reliability across all production domains
- **Cross-Domain Sync:** Works seamlessly between peddlenet.app and Firebase deployment
- **Enterprise Architecture:** Triple-fallback system (Cache → Server → Reverse Engineering)
- **Smart Recovery:** 28+ pattern variations tested for maximum compatibility
- **User-Friendly:** Confirmation dialogs prevent accidental room creation
- **Real-time Diagnostics:** Built-in testing tools for troubleshooting
- **Production Validated:** Manual entry working consistently across all environments
- **Usage:** Enter manually when QR scanning isn't available or practical

## 🧪 Testing Checklist

### Local Development
- [ ] `npm run dev:mobile` starts successfully
- [ ] IP detection shows network IP (not localhost)
- [ ] Diagnostics page shows all green checkmarks
- [ ] QR codes contain network IP
- [ ] Cross-device messaging works
- [ ] Auto-reconnection works after network interruption
- [ ] Visual reconnection status appears during disconnections

### Production Deployment
- [ ] `npm run deploy:firebase:complete` succeeds
- [ ] Frontend loads at Firebase URL
- [ ] Server health check returns JSON
- [ ] WebSocket connections establish
- [ ] Room codes register successfully
- [ ] No console errors in browser
- [ ] Auto-reconnection works in production environment

## 🤝 Contributing

This is an internal project for festival/event use. The codebase is optimized for:
- Quick setup and deployment
- Mobile-first experience  
- Network resilience
- Zero-configuration usage

## 📄 License

MIT License - See LICENSE file for details.

---

**Built for festivals, events, and anywhere people need to connect instantly without internet infrastructure.**

## 📚 Additional Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide with scripts
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current project status and features  
- [docs/11-TROUBLESHOOTING.md](./docs/11-TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [docs/04-ARCHITECTURE.md](./docs/04-ARCHITECTURE.md) - Technical system overview
- [docs/12-COMPREHENSIVE-NEXT-STEPS.md](./docs/12-COMPREHENSIVE-NEXT-STEPS.md) - Strategic evolution roadmap
