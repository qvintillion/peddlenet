# 🛠️ Development Tools & Utilities

## 🚀 Main Development Script

### **Quick Start for Mobile Development**
```bash
# Start both servers with mobile support
chmod +x tools/dev-mobile.sh
./tools/dev-mobile.sh
```

**This is the main script to use for festival chat development!**

## Files

### **Primary Scripts**
- **`dev-mobile.sh`** - 🌟 **MAIN DEV SCRIPT** - Start both servers with mobile network support
- **`find-ip.sh`** - Find your local IP address for mobile QR codes (bash)
- **`find-ip.js`** - Find your local IP address for mobile QR codes (node.js)
- **`setup-mobile-env.js`** - Auto-configure environment variables for mobile

### **Utility Scripts**
- **`start-server.sh`** - Enhanced server startup script
- **`kill-port-3001.sh`** - Kill processes using port 3001
- **`check-port.js`** - Check what's using port 3001
- **`test-mobile-access.sh`** - Test mobile connectivity
- **`clear-connections.sh`** - Clear stuck WebSocket connections
- **`mobile-troubleshoot.sh`** - Comprehensive mobile connection troubleshooting

### **Legacy/Archive**
- **`debug-signaling.sh`** - Script for debugging signaling server connectivity (legacy)
- **`signaling-config.ts`** - Configuration utility for signaling server (experimental)
- **`fix-infinite-loop.sh`** - Fix React infinite loop issues (integrated into main script)
- **`archive-fix-mobile-network.sh`** - Old mobile network fix (replaced by dev-mobile.sh)

### Mobile Development Tools

#### Quick IP Detection
```bash
# Find your IP for mobile QR codes
node tools/find-ip.js
# or
./tools/find-ip.sh
```

#### Start Everything for Mobile Testing
```bash
# Start both signaling server and Next.js with mobile support
chmod +x tools/dev-mobile.sh
./tools/dev-mobile.sh
```

#### Individual Server Management
```bash
# Start signaling server (tries multiple ports)
node signaling-server.js

# Kill processes on port 3001
chmod +x tools/kill-port-3001.sh
./tools/kill-port-3001.sh

# Check what's using port 3001
node tools/check-port.js
```

## Usage

These tools are kept for reference and potential future use but are not required for the current production application.

### Mobile QR Code Development

1. **Auto IP Detection**: The app now automatically detects your local IP using WebRTC
2. **Manual Setup**: If auto-detection fails, use the IP finder tools above
3. **Testing**: Use `dev-mobile.sh` to start everything at once

### Archive Status
- All files in this folder are experimental/legacy
- Main app uses WebSocket-based chat (see `src/hooks/use-websocket-chat.ts`)
- P2P features archived in `../archive/hooks/` folder

## Current Implementation

The live production app uses:
- **Server**: `signaling-server.js` (WebSocket server)
- **Client**: `src/hooks/use-websocket-chat.ts` (Direct WebSocket communication)
- **QR Codes**: `src/components/QRModal.tsx` (Auto-detects IP for mobile access)
- **No P2P dependencies** in current stable version

---
*Moved here during project cleanup - June 2025*
