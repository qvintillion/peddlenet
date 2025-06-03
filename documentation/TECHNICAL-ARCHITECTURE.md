# 🔧 Technical Architecture

## Overview

Festival Chat implements a **persistent P2P architecture** that solves the fundamental challenges of reliable peer-to-peer communication in web browsers. The system uses WebRTC for direct device connections, with a React-based frontend that maintains stable peer states across component lifecycles.

## 🏗️ Core Architecture

### Persistent P2P System
The heart of the application is the `useP2PPersistent` hook, which implements:

```typescript
// Global peer storage - survives React cleanup
window.globalPeer = peer;

// Status calculation with stable peer ID
const currentPeerId = window.globalPeer?.id || peerId;
```

**Key Innovation**: Storing the peer connection globally prevents React's useEffect cleanup from destroying active WebRTC connections.

### Component Hierarchy
```
App
├── AdminPage (/admin)
│   └── Room Creation & Auto-join
├── ChatRoomPage (/chat/[roomId])
│   ├── useP2PPersistent Hook
│   ├── QRModal Component
│   ├── Message Management
│   └── Connection Status UI
└── TestRoom (/test-room)
    └── Simplified P2P Testing
```

## 🔌 P2P Implementation Details

### WebRTC Configuration
```typescript
const iceServers = [
  // Multiple STUN servers for NAT traversal
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.nextcloud.com:443' },
  
  // TURN servers for complex network scenarios
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];
```

### Connection Flow
1. **Peer Initialization**: Create stable peer with enhanced ICE configuration
2. **QR Generation**: Embed actual peer ID in QR code for direct connection
3. **Connection Handshake**: WebRTC negotiation with timeout handling
4. **Status Synchronization**: Real-time UI updates across all connected devices
5. **Message Routing**: Direct P2P message transmission with delivery confirmation

## 📱 Mobile Compatibility

### HTTPS Requirement
Mobile browsers require HTTPS for WebRTC APIs:
```bash
# Development: ngrok tunnel
./mobile-dev.sh

# Production: Vercel automatic HTTPS
vercel --prod
```

### Browser Support Matrix
| Browser | Desktop | Mobile | WebRTC Support |
|---------|---------|--------|----------------|
| Chrome | ✅ | ✅ | Full |
| Safari | ✅ | ✅ | Full |
| Firefox | ✅ | ✅ | Full |
| Edge | ✅ | ✅ | Full |

## 🔄 State Management

### React State Flow
```typescript
// Connection state
const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
const [status, setStatus] = useState<ConnectionStatus>(...);

// Refs for stable references (prevent re-renders)
const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
```

### Status Calculation
```typescript
const updateStatus = useCallback(() => {
  const activeConnections = Array.from(connectionsRef.current.values())
    .filter(conn => conn.open).length;
  
  // Use global peer ID to prevent stale closures
  const currentPeerId = window.globalPeer?.id || peerId;
  
  setStatus({
    isConnected: activeConnections > 0 && !!currentPeerId,
    connectedPeers: activeConnections,
    networkReach: activeConnections > 0 ? 'local' : 'isolated',
    signalStrength: activeConnections > 0 ? 'medium' : 'none',
  });
}, []); // No dependencies to prevent stale closures
```

## 🛡️ Error Handling & Recovery

### Connection Timeouts
```typescript
// 10-second timeout for stuck connections
const connectionTimeout = setTimeout(() => {
  if (!conn.open) {
    console.warn('Connection stuck, closing:', connId);
    try { conn.close(); } catch (e) { /* ignore */ }
  }
}, 10000);
```

### Retry Mechanisms
- **Connection Attempts**: Maximum 2 retries per peer
- **Message Queue**: Store messages when no connections available
- **Status Recovery**: Automatic status recalculation on connection changes

## 🔍 Debug Architecture

### Debug Utilities
```typescript
// Global debug access
window.P2PDebug = {
  forceStatusUpdate: () => updateStatus(),
  getConnections: () => connectionsRef.current,
  getPeer: () => window.globalPeer
};
```

### Logging Strategy
- **Development**: Verbose logging with emoji indicators
- **Production**: Minimal error logging only
- **Debug Panel**: Real-time connection status and peer information

## 🚀 Performance Optimizations

### Memory Management
- **Stable References**: useRef for objects that don't trigger re-renders
- **Event Cleanup**: Proper removal of WebRTC event listeners
- **Connection Limits**: Maximum 5 simultaneous peer connections

### Network Optimization
- **ICE Candidate Pool**: Size 10 for faster connection establishment
- **Bundle Policy**: max-bundle for efficient media transmission
- **RTCP Mux**: Required for reduced network overhead

## 🔐 Security Considerations

### P2P Security
- **Direct Connections**: No data passes through servers
- **WebRTC Encryption**: Built-in DTLS encryption for all data
- **Peer Validation**: Connection metadata verification

### Client-Side Security
- **Input Sanitization**: All user inputs sanitized before transmission
- **XSS Prevention**: React's built-in protections
- **CSP Headers**: Content Security Policy in production

## 📊 Monitoring & Analytics

### Connection Metrics
- **Success Rate**: Percentage of successful P2P connections
- **Connection Time**: Average time from QR scan to active chat
- **Network Types**: Success rates across WiFi/cellular combinations
- **Browser Compatibility**: Success rates by browser/device type

### Performance Tracking
```typescript
// Connection timing
const startTime = Date.now();
conn.on('open', () => {
  const connectionTime = Date.now() - startTime;
  console.log(`Connection established in ${connectionTime}ms`);
});
```

## 🎯 Production Deployment

### Vercel Configuration
```typescript
// next.config.ts
module.exports = {
  images: { unoptimized: true },
  // No trailingSlash to prevent redirect loops
};
```

### Environment Variables
```bash
# Production STUN/TURN servers
NEXT_PUBLIC_STUN_SERVERS=stun1,stun2,stun3
NEXT_PUBLIC_TURN_SERVER=turn:your-server.com
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=credential
```

## 🔄 Future Architecture Considerations

### Scalability
- **Signaling Server**: For peer discovery in larger groups
- **TURN Server**: Dedicated TURN infrastructure for enterprise use
- **Room Persistence**: Optional server-side room state backup

### Advanced Features
- **Media Streaming**: Voice/video chat capabilities
- **File Transfer**: P2P file sharing implementation
- **Mesh Networking**: Automatic peer discovery and routing

---

*This architecture successfully solves the complex intersection of React state management, WebRTC networking, and mobile browser compatibility to create a production-ready P2P communication system.*
