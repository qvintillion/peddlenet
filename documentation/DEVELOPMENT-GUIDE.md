# 📋 Development Guide

## 🚀 Setup & Installation

### Prerequisites
```bash
# Required
node -v    # Node.js 18+
npm -v     # npm or yarn
git --version

# Optional but recommended
ngrok --version  # For mobile testing
```

### Initial Setup
```bash
# 1. Clone/navigate to project
cd festival-chat

# 2. Install dependencies
npm install

# 3. Make scripts executable (one-time)
chmod +x make-executable.sh
./make-executable.sh

# 4. Start development with HTTPS (mobile compatible)
./mobile-dev.sh
```

## 🛠️ Development Workflow

### Daily Development
```bash
# Standard development
npm run dev

# Mobile development (HTTPS tunnel)
./mobile-dev.sh

# Production build test
npm run build && npm run start
```

### Development URLs
- **Admin**: `https://your-ngrok.io/admin`
- **Chat**: `https://your-ngrok.io/chat/[room-name]`
- **Test Room**: `https://your-ngrok.io/test-room`
- **Ngrok Dashboard**: `http://localhost:4040`

## 🔧 Key Components

### Core Hooks
```typescript
// Production-ready persistent P2P
import { useP2PPersistent } from '@/hooks/use-p2p-persistent';

// Legacy (kept for reference)
import { useP2POptimized } from '@/hooks/use-p2p-optimized';
```

### Essential Components
```typescript
// QR code generation and sharing
import { QRModal } from '@/components/QRModal';

// Real-time connection debugging
import { DebugPanel } from '@/components/DebugPanel';
```

### Utility Functions
```typescript
// Compatible UUID generation
import { generateCompatibleUUID, generateShortId } from '@/utils/peer-utils';

// Network detection and utils
import { NetworkUtils } from '@/utils/network-utils';
```

## 🧪 Testing Strategy

### Local Testing
```bash
# 1. Test basic functionality
npm run dev
# Visit http://localhost:3000/test-room

# 2. Test P2P connections (same device)
# Open two browser tabs to /test-room
# Use manual connect with peer ID

# 3. Test mobile compatibility
./mobile-dev.sh
# Test desktop → mobile QR connections
```

### Cross-Device Testing
```bash
# 1. Start mobile dev server
./mobile-dev.sh

# 2. Desktop: Create room at /admin
# 3. Desktop: Generate QR code
# 4. Mobile: Scan QR code
# 5. Test bidirectional messaging
```

### Network Testing
```bash
# Test different network combinations:
# - Desktop WiFi → Mobile WiFi (same network)
# - Desktop WiFi → Mobile Cellular
# - Mobile Hotspot (both devices)
```

## 🐛 Debugging

### Debug Tools
```bash
# Enable debug mode in browser console
window.P2PDebug.forceStatusUpdate();
window.P2PDebug.getConnections();
window.P2PDebug.getPeer();

# Network utilities
window.NetworkUtils.getBaseURL();
window.NetworkUtils.isMobileAccessible();
```

### Common Debug Commands
```javascript
// Check peer status
console.log('Global peer:', window.globalPeer);
console.log('Peer ID:', window.globalPeer?.id);
console.log('Connections:', window.globalPeer?._connections);

// Force status update
window.location.reload();

// Clear localStorage
localStorage.clear();
```

### Debug Scripts
```bash
# Step-by-step debugging guide
./debug-p2p.sh

# Mobile-specific debugging  
./debug-mobile.sh

# WebRTC connection debugging
./debug-webrtc.sh
```

## 🔨 Build & Deployment

### Local Build Testing
```bash
# Test production build locally
npm run build
npm run start

# Test with HTTPS (mobile compatible)
npm run build
# Then start with ngrok manually
```

### Vercel Deployment
```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod

# Environment variables needed:
# - Automatic HTTPS (Vercel provides)
# - No additional config needed for basic setup
```

### Environment Configuration
```bash
# .env.local (optional)
NEXT_PUBLIC_STUN_SERVERS=custom-stun-server.com
NEXT_PUBLIC_TURN_SERVER=custom-turn-server.com
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=password
```

## 🎯 Code Organization

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Room creation
│   ├── chat/[roomId]/     # Main chat interface
│   ├── test-room/         # Testing environment
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── QRModal.tsx        # QR code generation
│   └── DebugPanel.tsx     # Development debugging
├── hooks/                 # Custom React hooks
│   ├── use-p2p-persistent.ts  # Production P2P hook
│   └── use-p2p-optimized.ts   # Legacy hook
├── utils/                 # Utility functions
│   ├── peer-utils.ts      # Peer ID generation
│   ├── network-utils.ts   # Network detection
│   └── qr-peer-utils.ts   # QR code utilities
└── lib/                   # Type definitions
    └── types.ts           # TypeScript types
```

### Key Files to Modify
- **New P2P features**: `src/hooks/use-p2p-persistent.ts`
- **UI changes**: `src/app/chat/[roomId]/page.tsx`
- **QR functionality**: `src/components/QRModal.tsx`
- **Types**: `src/lib/types.ts`

## 🔍 Performance Monitoring

### Connection Metrics
```typescript
// Add to useP2PPersistent hook
const startTime = Date.now();
conn.on('open', () => {
  const connectionTime = Date.now() - startTime;
  console.log(`📊 Connection time: ${connectionTime}ms`);
});
```

### Memory Usage
```javascript
// Check memory usage in browser console
console.log(performance.memory);

// Monitor connection count
setInterval(() => {
  console.log('Active connections:', 
    window.globalPeer?._connections ? 
    Object.keys(window.globalPeer._connections).length : 0
  );
}, 5000);
```

## 🚨 Troubleshooting Development Issues

### React Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for React strict mode issues
# Look for duplicate peer initialization in console
```

### WebRTC Issues
```bash
# Test WebRTC support
navigator.mediaDevices ? console.log('WebRTC supported') : console.log('No WebRTC');

# Check STUN server access
fetch('https://stun.l.google.com:19302')
  .then(() => console.log('STUN accessible'))
  .catch(e => console.log('STUN blocked:', e));
```

### Mobile Issues
```bash
# Ensure HTTPS is working
# Check certificate validity in mobile browser
# Test different mobile browsers (Chrome vs Safari)

# Debug ngrok tunnel
curl -I https://your-ngrok-url.io
```

## 📚 Learning Resources

### WebRTC Learning
- [WebRTC MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [PeerJS Documentation](https://peerjs.com/docs.html)

### React Patterns
- [React Hooks Best Practices](https://react.dev/reference/react)
- [useCallback and useRef patterns](https://react.dev/reference/react/useCallback)

### Network Debugging
- [Chrome WebRTC Internals](chrome://webrtc-internals/)
- [Network troubleshooting](./TROUBLESHOOTING.md)

---

*This development guide covers the essential workflows for building and debugging Festival Chat's P2P architecture.*
