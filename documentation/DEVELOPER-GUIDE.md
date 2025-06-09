# 🛠️ Developer Guide - PeddleNet

## 🚀 Quick Setup

### Prerequisites
```bash
node -v    # Node.js 18+
npm -v     # npm or yarn
git --version
```

### Installation & First Run
```bash
# Clone and navigate
cd festival-chat

# Install dependencies
npm install

# Start development server with mobile support
./mobile-dev.sh
```

**Expected Result**: 
- Next.js app at `https://your-ngrok-url.io`
- Signaling server at `https://your-ngrok-url.io:3001` (or localhost)
- QR codes work between desktop ↔ mobile devices

## 🏗️ Architecture Overview

### Core Components
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage with room creation
│   ├── admin/             # Room creation interface
│   ├── chat/[roomId]/     # P2P chat rooms
│   └── layout.tsx         # Root layout with PWA support
├── components/            # Reusable React components
│   ├── QRModal.tsx        # QR code generation & display
│   ├── DebugPanel.tsx     # Real-time connection monitoring
│   └── ui/                # Shadcn/ui components
├── hooks/                 # Custom React hooks
│   ├── use-p2p-persistent.ts    # 🔥 Main P2P logic
│   ├── use-signaling-client.ts  # Room discovery
│   └── use-signaling-room-discovery.ts
├── utils/                 # Utility functions
│   ├── qr-peer-utils.ts        # QR code + peer connection
│   ├── network-utils.ts        # Network detection
│   ├── peer-utils.ts           # Peer ID generation
│   └── connection-resilience.ts # Retry & health monitoring
└── lib/                   # Configuration & types
    ├── types.ts           # TypeScript definitions
    └── constants.ts       # App configuration
```

### Key Technical Decisions

**1. WebRTC + PeerJS**
- ✅ Simplified P2P implementation
- ✅ Built-in signaling for initial handshake
- ✅ Mobile-optimized ICE configuration
- ✅ Multiple STUN/TURN server fallbacks

**2. Hybrid Architecture**
- **P2P Layer**: Direct device-to-device messaging
- **Signaling Layer**: Room discovery & connection coordination
- **Application Layer**: React UI with real-time updates

**3. Production-Ready Pattern**
- **Mobile-first**: Touch interface, QR scanning, network resilience
- **Progressive Enhancement**: Works with/without signaling server
- **Deployment Flexibility**: Vercel → Cloudflare migration path

## 🔧 Development Workflow

### Daily Development Commands
```bash
# Standard development (localhost only)
npm run dev

# Mobile development (HTTPS tunnel for cross-device testing)
./mobile-dev.sh

# Production build testing
npm run build && npm run start
```

### Development URLs
- **Homepage**: `https://your-ngrok.io` or `http://localhost:3000`
- **Admin Panel**: `https://your-ngrok.io/admin`
- **Test Room**: `https://your-ngrok.io/test-room`
- **Chat Room**: `https://your-ngrok.io/chat/[room-name]`
- **Signaling Health**: `http://localhost:3001/health`
- **Ngrok Dashboard**: `http://localhost:4040`

### Development Scripts

**mobile-dev.sh** (🔥 Cross-Network Development Script)
```bash
# What it does:
# 1. Starts signaling server (port 3001)
# 2. Starts Next.js dev server (port 3000)
# 3. Creates ngrok tunnels for both
# 4. Updates .env.local with tunnel URLs
# 5. Restarts Next.js to pick up new env vars

# Usage:
./mobile-dev.sh
# Follow printed URLs for testing
# Best for: Cross-network testing (desktop WiFi ↔ mobile cellular)
```

**mobile-ip-fix.sh** (🏠 Same-Network Development Script)
```bash
# What it does:
# 1. Detects your local network IP
# 2. Starts signaling server (port 3001)
# 3. Starts Next.js with signaling URL pointing to local IP
# 4. Mobile can reach signaling server on same WiFi network

# Usage:
./mobile-ip-fix.sh
# Access at http://[your-local-ip]:3000 from mobile
# Best for: Same WiFi network testing (faster, no ngrok needed)
```

**Choose Your Development Mode:**
- **Same WiFi Network**: Use `./mobile-ip-fix.sh` (simpler, faster)
- **Different Networks**: Use `./mobile-dev.sh` (more complex, requires ngrok)

**Key Files** (DO NOT MODIFY):
- ✅ `mobile-dev.sh` - Cross-network development (ngrok tunnels)
- ✅ `mobile-ip-fix.sh` - Same-network development (local IP)
- ✅ `signaling-server.js` - Room discovery backend
- ✅ `package.json` - Dependencies and scripts
- ✅ `vercel.json` - Production deployment config

## 🧪 Testing Strategy

### Local Testing (Same Device)
```bash
# 1. Start dev server
npm run dev

# 2. Open multiple tabs
# http://localhost:3000/test-room

# 3. Test manual peer connections
# Use peer IDs shown in debug panel
```

### Cross-Device Testing (Mobile ↔ Desktop)

**Option 1: Same WiFi Network (Recommended for development)**
```bash
# 1. Start same-network dev server
./mobile-ip-fix.sh

# 2. Desktop: Create room at http://localhost:3000/admin
# 3. Desktop: Generate QR code ("📱 Invite" button)
# 4. Mobile: Open http://[your-local-ip]:3000 and scan QR
# 5. Test bidirectional messaging
# 6. Test host refresh (desktop F5) → auto-reconnect
```

**Option 2: Different Networks (For production-like testing)**
```bash
# 1. Start cross-network dev server
./mobile-dev.sh

# 2. Desktop: Create room at https://ngrok-url.io/admin
# 3. Desktop: Generate QR code ("📱 Invite" button)
# 4. Mobile: Scan QR with camera app
# 5. Test bidirectional messaging
# 6. Test host refresh (desktop F5) → auto-reconnect
```

### Network Testing Scenarios
```bash
# Test different network combinations:
# ✅ Desktop WiFi → Mobile WiFi (same network)
# ✅ Desktop WiFi → Mobile Cellular (different networks)
# ✅ Mobile Hotspot (both devices connected)
# ✅ Host refresh with active connections
```

## 🎯 Core Implementation Guide

### 1. P2P Connection Flow

**Simplified Connection Process**:
```typescript
// 1. Initialize global peer (survives React cleanup)
const peer = new Peer(undefined, {
  config: { iceServers: MOBILE_OPTIMIZED_STUN_SERVERS }
});
window.globalPeer = peer; // Persist globally

// 2. Generate room with friendly name
const roomId = slugify(roomName);
const peerInfo = { peerId: peer.id, roomId, displayName };

// 3. Create QR code with peer connection info
const qrData = createQRData(peerInfo);
generateQRCode(qrData); // Displays QR code

// 4. Guest scans QR → direct P2P connection
const guestPeer = parseQRData(scannedData);
const connection = peer.connect(guestPeer.peerId);

// 5. Real-time messaging
connection.on('open', () => {
  connection.send({ type: 'chat', content: 'Hello!' });
});
```

**Key Innovation**: QR codes contain peer connection info for direct connections (no discovery delays).

### 2. Signaling Server Integration

**Room Discovery Enhancement**:
```typescript
// Optional signaling for enhanced features
const signaling = useSignalingClient(signalingUrl);

// Auto-discover peers in same room
useEffect(() => {
  signaling.joinRoom(roomId);
  signaling.onPeerJoined((peer) => {
    // Auto-connect to new room members
    connectToPeer(peer.peerId);
  });
}, [roomId]);

// Host refresh resilience
signaling.onPeerLeft((peer) => {
  // Clean up dead connections
  removeConnection(peer.peerId);
});
```

**Benefits**:
- ✅ Auto-reconnection when host refreshes
- ✅ Discovery of multiple room participants
- ✅ Enhanced reliability for multi-peer scenarios

### 3. Mobile Optimization Patterns

**Mobile WebRTC Configuration**:
```typescript
const MOBILE_OPTIMIZED_CONFIG = {
  debug: 2, // Enable WebRTC debugging
  config: {
    iceServers: [
      // Multiple STUN servers for reliability
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      // TURN servers for difficult networks
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10, // More candidates = better connection
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle'
  }
};
```

**Mobile-Specific Patterns**:
```typescript
// Network detection for mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Touch-optimized UI
const handleQRShare = async () => {
  if (navigator.share) {
    // Use native sharing on mobile
    await navigator.share({ url: qrCodeUrl });
  } else {
    // Fallback to copy/clipboard
    copyToClipboard(qrCodeUrl);
  }
};

// Battery optimization
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Reduce connection polling when app backgrounded
      peer.socket._heartbeatTimeout = 60000;
    } else {
      // Restore normal polling
      peer.socket._heartbeatTimeout = 25000;
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

## 🐛 Debugging Guide

### Debug Tools & Console Commands

**Browser Console Debugging**:
```javascript
// Check global peer status
console.log('Global peer:', window.globalPeer);
console.log('Peer ID:', window.globalPeer?.id);
console.log('Connections:', window.globalPeer?._connections);

// Force status updates
if (window.P2PDebug) {
  window.P2PDebug.forceStatusUpdate();
  window.P2PDebug.getConnections();
}

// Network utilities
if (window.NetworkUtils) {
  console.log('Base URL:', window.NetworkUtils.getBaseURL());
  console.log('Mobile accessible:', window.NetworkUtils.isMobileAccessible());
}

// Clear session data
localStorage.clear();
sessionStorage.clear();
```

### Common Issues & Solutions

**Issue**: "Peer recreated constantly"
```bash
# Cause: React StrictMode or state dependency loops
# Solution: Use refs and global peer storage
const peerRef = useRef(null);
window.globalPeer = peerRef.current;
```

**Issue**: "Mobile connections timeout"
```bash
# Cause: Default WebRTC timeout too short for mobile
# Solution: Increase timeout and add more STUN servers
connectionTimeout: 15000, // Increased from 5000
iceServers: [...MOBILE_OPTIMIZED_STUN_SERVERS]
```

**Issue**: "Cross-device discovery fails"
```bash
# Cause: Signaling server not accessible or localStorage isolation
# Solution: Check signaling URL and network connectivity
curl -I http://localhost:3001/health
# Should return 200 OK
```

**Issue**: "QR codes don't work on mobile"
```bash
# Cause: HTTP vs HTTPS - WebRTC requires HTTPS on mobile
# Solution: Use ngrok or deploy to production
./mobile-dev.sh  # Provides HTTPS via ngrok
```

**Issue**: "Room codes create new rooms instead of joining"
```bash
# Cause: getRoomIdFromCode returns null when room not found
# Solution: Enhanced room code system with triple fallback
# 1. Cache lookup (localStorage)
# 2. Server lookup with proper timeout
# 3. Reverse engineering with 28+ pattern variations
# User confirmation dialog prevents accidental room creation
```

**Issue**: "Room codes not working across devices"
```bash
# Cause: Server endpoints not deployed or cache not syncing
# Solution: Deploy updated server with room code endpoints
npm run deploy:firebase:complete
# Verify endpoints: /register-room-code and /resolve-room-code
curl -X POST server/register-room-code -d '{"roomId":"test","roomCode":"blue-stage-42"}'
```

## 🚢 Build & Deployment

### Local Build Testing
```bash
# Test production build locally
npm run build
npm run start

# Test with HTTPS (mobile-compatible)
npm run build
# Then manually start ngrok
ngrok http 3000
```

### Environment Configuration

**.env.local Example**:
```bash
# Optional signaling server (auto-detected in mobile-dev.sh)
NEXT_PUBLIC_SIGNALING_SERVER=https://your-signaling-server.com

# Optional custom STUN/TURN servers
NEXT_PUBLIC_STUN_SERVERS=stun:custom-server.com
NEXT_PUBLIC_TURN_SERVER=turn:custom-server.com
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=password

# Debug mode
NEXT_PUBLIC_DEBUG=true
```

### Vercel Deployment
```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod

# Environment variables needed:
# - Automatic HTTPS ✅ (Vercel provides)
# - No additional config needed for basic P2P ✅
# - Optional: NEXT_PUBLIC_SIGNALING_SERVER for enhanced features
```

### Cloudflare Deployment (Future)
```bash
# For mesh network features
npm run build
npx wrangler pages deploy out/

# Benefits:
# ✅ Global edge network
# ✅ Unlimited bandwidth
# ✅ Workers for enhanced signaling
# ✅ Better festival/event coverage
```

## 🎯 Code Quality Standards

### TypeScript Patterns
```typescript
// Strong typing for P2P messages
interface ChatMessage extends Message {
  type: 'chat';
  content: string;
  author: string;
  roomId: string;
}

interface SystemMessage extends Message {
  type: 'system';
  action: 'user_joined' | 'user_left' | 'room_created';
  metadata: Record<string, any>;
}

type P2PMessage = ChatMessage | SystemMessage;
```

### React Patterns
```typescript
// Proper dependency management
const memoizedConnectToPeer = useCallback(
  async (targetPeerId: string) => {
    return await connectToPeer(targetPeerId);
  },
  [connectToPeer] // Only re-create if connectToPeer changes
);

// Avoid stale closures in event handlers
const currentConnectionsRef = useRef(connections);
currentConnectionsRef.current = connections;

const handleMessage = useCallback((message: P2PMessage) => {
  // Use ref to get current connections without stale closure
  const currentConnections = currentConnectionsRef.current;
  // ... handle message
}, []); // Empty deps - no stale closures
```

### File Organization
```bash
# Follow this structure for consistency
src/hooks/use-[feature]-[pattern].ts
src/components/[Feature][Component].tsx
src/utils/[domain]-utils.ts
src/lib/[feature]-[type].ts

# Examples:
src/hooks/use-p2p-persistent.ts
src/components/QRModal.tsx
src/utils/peer-utils.ts
src/lib/types.ts
```

## 🚀 Next Steps for Developers

### Immediate Development Tasks
1. **Set up development environment** with `./mobile-dev.sh`
2. **Test cross-device functionality** with desktop ↔ mobile
3. **Explore debug panel** to understand connection flow
4. **Review core hooks** in `src/hooks/use-p2p-persistent.ts`

### Feature Development Workflow
1. **Start with existing patterns** - extend current hooks/components
2. **Test mobile-first** - always verify mobile compatibility
3. **Add debug logging** - use consistent console.log patterns
4. **Document new features** - update relevant documentation
5. **Test room code system** - use built-in diagnostics (🔧 Test Room Code System button)
6. **Verify cross-device sync** - test room codes work between different devices
7. **Check error handling** - ensure graceful fallbacks and user feedback

### Production Deployment Checklist
- [ ] Test production build locally (`npm run build && npm run start`)
- [ ] Verify mobile HTTPS compatibility
- [ ] Test cross-network scenarios (WiFi ↔ Cellular)
- [ ] Configure environment variables for production
- [ ] Set up monitoring/analytics (optional)
- [ ] Deploy to Vercel with custom domain

## 📖 Learning Resources

### WebRTC & P2P Development
- [WebRTC MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [PeerJS Documentation](https://peerjs.com/docs.html)
- [WebRTC Samples](https://webrtc.github.io/samples/)

### React & Next.js Best Practices
- [React Hooks Guide](https://react.dev/reference/react)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Festival/Event Tech Resources
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [Mobile Web Performance](https://web.dev/fast/)
- [Offline-First Design](https://offlinefirst.org/)

---

## 🏆 Development Success Checklist

- ✅ **Environment**: `./mobile-dev.sh` runs successfully
- ✅ **Cross-Device**: Desktop ↔ Mobile connections work
- ✅ **QR Codes**: Generate and scan QR codes for instant connections
- ✅ **Real-time Chat**: Bidirectional messaging with <100ms latency
- ✅ **Host Refresh**: Auto-reconnection survives browser refresh
- ✅ **Mobile Optimization**: Touch interface and camera integration
- ✅ **Production Build**: Successful deployment to Vercel/Cloudflare

**You're ready to build the future of festival communication! 🎪✨**

---

*This developer guide covers everything from setup to production deployment. For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md). For user-facing features, see [USER-GUIDE.md](USER-GUIDE.md).*