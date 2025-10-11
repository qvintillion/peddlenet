# 🏗️ Architecture Overview - Festival Chat

## 🎯 System Overview

Festival Chat is a hybrid WebSocket-based real-time messaging platform optimized for mobile devices and festival environments. It combines the reliability of centralized messaging with the performance benefits of client-side optimization.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Festival Chat System               │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)           Backend (Universal Server)    │
│  ┌─────────────────────┐     ┌─────────────────────────────┐ │
│  │ React Components    │     │ Universal Server            │ │
│  │ - Chat Interface    │ ←→  │ - Auto-environment detect   │ │
│  │ - QR Code Scanner   │     │ - Real-time messaging      │ │
│  │ - Room Management   │     │ - Room management          │ │
│  └─────────────────────┘     └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Client-Side Optimizations    Server-Side Features │
│  - Circuit Breaker Pattern    - Connection Throttling│
│  - Exponential Backoff       - Rate Limiting        │
│  - Mobile Connection Debug    - Health Monitoring   │
│  - Message Persistence       - Room Code System     │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### **Frontend Stack**
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 (dark mode optimized)
- **WebSocket Client**: Socket.IO Client
- **QR Code**: qrcode library for generation
- **Camera**: Browser native camera API for scanning
- **Storage**: localStorage for message persistence

### **Backend Stack**
- **Runtime**: Node.js 18+
- **Web Server**: Express.js
- **WebSocket**: Socket.IO Server
- **Storage**: In-memory (development) / SQLite (production)
- **CORS**: Configured for cross-origin support

### **🧡 Universal Server Architecture (Cleaned & Unified)**

**Revolutionary Clean Architecture**:
```
festival-chat/
├── signaling-server.js            # 🧡 THE UNIVERSAL SERVER
│   ├── Auto-environment detection (NODE_ENV + PLATFORM)
│   ├── Dev mode: Mock data, debug endpoints, local IPs
│   ├── Staging mode: Firebase detection, optimized config
│   └── Production mode: GitHub/CloudRun, full optimization
│
├── Dockerfile.minimal            # → Uses signaling-server.js
├── deployment/
│   ├── cloudbuild-*.yaml        # → All reference signaling-server.js
│   ├── Dockerfile.cloudrun      # → Uses signaling-server.js
│   └── package.json             # → Updated for universal server
│
├── scripts/
│   ├── deploy-websocket-*.sh    # → All use signaling-server.js
│   └── dev-mobile.sh           # → Uses signaling-server.js
│
├── package.json                 # → "server": "node signaling-server.js"
└── archive/                     # 🗂️ All old servers safely archived
    ├── signaling-server-universal.js
    ├── signaling-server-dev-FIXED.js
    └── signaling-server-production-FIXED.js
```

**Universal Server Features**:
```javascript
// Environment Detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local';
const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun';

// Smart Configuration
if (isDevelopment) {
  // Enhanced logging, debug endpoints, mock analytics
  devLog(`🐛 Debug endpoint: /debug/rooms`);
  app.get('/analytics/dashboard', mockAnalyticsHandler);
} else if (isProduction) {
  // Production optimizations, real analytics
  app.get('/analytics/dashboard', realAnalyticsHandler);
}
```

**Benefits of Universal Architecture**:
- ✅ **One File to Rule Them All** - No confusion about which server to use
- ✅ **Auto-Environment Detection** - Adapts behavior based on deployment context
- ✅ **Future-Ready Endpoints** - Analytics and mesh features built-in
- ✅ **Clean Deployment** - All scripts reference the same universal file
- ✅ **Enhanced Development** - Better debugging and mobile support
- ✅ **Production Optimized** - Full performance and reliability features

**Deployment Flow**:
```
Development: signaling-server.js (local detection)
     ↓
Staging: signaling-server.js (firebase detection) 
     ↓
Production: signaling-server.js (production detection)
```

### **Infrastructure**
- **Frontend Hosting**: Firebase Hosting + Vercel
- **Backend Hosting**: Google Cloud Run
- **Domain**: Cloudflare DNS + CDN
- **SSL**: Automatic HTTPS/WSS via hosting providers
- **Monitoring**: Built-in health endpoints

## 📱 Client Architecture

### **React Component Structure**

```typescript
// Component Hierarchy
App (layout.tsx)
├── HomePage (page.tsx)
│   ├── RoomCreator
│   ├── RoomJoiner
│   └── RecentRooms
└── ChatPage ([roomId]/page.tsx)
    ├── ChatHeader
    ├── MessageList
    ├── MessageInput
    ├── RoomCodeDisplay
    └── QRModal

// Key Hooks
useWebSocketChat()     // Main chat functionality
useQRScanner()        // Camera and QR code handling
useMobileDebug()      // Connection debugging
useRoomCodes()        // Room code management
```

### **State Management**

```typescript
// Primary State (useWebSocketChat)
interface ChatState {
  isConnected: boolean;
  messages: Message[];
  connectedPeers: string[];
  isRetrying: boolean;
  retryCount: number;
  connectionCooldown: boolean;
}

// Message Structure
interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  type: 'chat' | 'system';
  roomId: string;
  synced: boolean;
}

// Connection Management
interface ConnectionStatus {
  isConnected: boolean;
  connectedPeers: number;
  networkReach: 'server' | 'p2p' | 'isolated';
  signalStrength: 'strong' | 'medium' | 'weak' | 'none';
}
```

### **Client-Side Optimizations**

**1. JavaScript Initialization Safety** 🎯
```typescript
// CRITICAL FIX: Safe global variable assignment
// Prevents Temporal Dead Zone (TDZ) errors in production bundles
setTimeout(() => {
  try {
    window.ConnectionResilience = ConnectionResilience;
    window.ServerUtils = ServerUtils;
    window.MobileConnectionDebug = MobileConnectionDebug;
    console.log('🔧 All utilities loaded safely');
  } catch (error) {
    console.warn('⚠️ Global assignment failed:', error);
  }
}, 0);

// Fixed module loading order prevents initialization crashes
// Eliminated "Cannot access 'E' before initialization" errors
// Production JavaScript bundles now load cleanly
```

**2. Circuit Breaker Pattern**
```typescript
class ConnectionResilience {
  // Prevents connection spam when server unavailable
  static shouldAllowConnection(): boolean;
  static recordSuccess(): void;
  static recordFailure(): void;
  
  // Configuration
  private static readonly FAILURE_THRESHOLD = 5; // Mobile optimized
  private static readonly RECOVERY_TIMEOUT = 15000; // 15s recovery
  private static readonly SUCCESS_THRESHOLD = 1; // Fast recovery
}
```

**3. Exponential Backoff**
```typescript
// Gentle mobile-optimized backoff curve
static getExponentialBackoffDelay(attempt: number): number {
  const baseDelay = 500; // 500ms base (was 1s)
  const maxDelay = 8000; // 8s max (was 30s)
  const jitter = Math.random() * 500;
  
  return Math.min(baseDelay * Math.pow(1.5, attempt) + jitter, maxDelay);
}
```

**4. Smart Error Handling**
```typescript
// Rate limits don't trigger circuit breaker
if (!error.message.includes('rate limit')) {
  ConnectionResilience.recordFailure();
} else {
  console.log('🕰️ Rate limit detected, not counting as failure');
}
```

## 🖥️ Server Architecture

### **Universal Server Structure**

```javascript
// signaling-server.js - The ONE and ONLY server
const express = require('express');
const { Server } = require('socket.io');

// Universal environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local';
const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun';

// Core Components
const app = express();                    // HTTP endpoints
const server = createServer(app);         // HTTP server
const io = new Server(server, config);    // WebSocket server

// Environment-specific features
if (isDevelopment) {
  app.get('/debug/rooms', debugHandler);
  app.get('/analytics/dashboard', mockAnalyticsHandler);
} else {
  app.get('/analytics/dashboard', realAnalyticsHandler);
}
```

### **Room Management**

```javascript
// Phase 1 Data Structures (Simplified)
const activeUsers = new Map(); // userKey → UserData
const rooms = new Map();       // roomId → Set<userKey>

// User Key Format: "displayName_socketId"
// Allows multiple connections per user (multi-tab support)

interface UserData {
  displayName: string;
  socketId: string;
  currentRoom: string;
  joinedAt: number;
  isBackgroundConnection: boolean;
}
```

### **Duplicate Socket Prevention**

The server implements intelligent duplicate detection to handle page navigation scenarios:

```javascript
// Prevents duplicate sockets in the SAME room (page refresh, multi-tab)
// Allows sockets in DIFFERENT rooms (page navigation)
socket.on('join-room', ({ roomId, displayName }) => {
  // Find duplicate sockets with same displayName in the SAME room
  const duplicateSocketsInSameRoom = [];
  for (const [userKey, userData] of activeUsers.entries()) {
    if (userData.displayName === displayName &&
        userData.socketId !== socket.id &&
        userData.currentRoom === roomId) {
      duplicateSocketsInSameRoom.push({ userKey, userData });
    }
  }

  // Disconnect duplicates (older sockets)
  if (duplicateSocketsInSameRoom.length > 0) {
    for (const { userData } of duplicateSocketsInSameRoom) {
      const oldSocket = io.sockets.sockets.get(userData.socketId);
      if (oldSocket) oldSocket.disconnect(true);
    }
  }
});
```

**Behavior**:
- ✅ **Room Navigation**: User navigates from Room A → Room B. Both sockets exist briefly until old page unmounts. Admin dashboard shows most recent room only.
- ✅ **Page Refresh**: User refreshes page while in Room A. New socket disconnects old socket in same room.
- ✅ **Multi-tab**: User opens same room in 2 tabs. Newest tab disconnects older tab's socket.
- ✅ **Admin Deduplication**: `/admin/mesh-status` shows only the most recently joined room per user (highest `lastSeen` timestamp).

### **Message Flow (Universal)**

```javascript
// Environment-aware message handling
socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
  if (isDevelopment) {
    console.log(`💬 DEV: Chat message from ${socket.id} in room ${roomId}`);
  }
  
  // Universal message broadcasting (includes sender)
  io.to(roomId).emit('chat-message', enhancedMessage);
  
  // Send delivery confirmation
  socket.emit('message-delivered', {
    messageId: enhancedMessage.id,
    timestamp: Date.now()
  });
});
```

### **Future Features Foundation**

```javascript
// Environment-aware analytics
if (isDevelopment) {
  app.get('/analytics/dashboard', (req, res) => {
    res.json({
      mockData: true,
      totalUsers: Math.floor(Math.random() * 100) + 50,
      activeRooms: rooms.size,
      environment: 'development'
    });
  });
} else {
  app.get('/analytics/dashboard', (req, res) => {
    res.json({
      totalUsers: connectionStats.totalConnections,
      activeRooms: rooms.size,
      currentConnections: connectionStats.currentConnections,
      environment: 'production'
    });
  });
}

// Environment-aware mesh network configuration
if (isDevelopment) {
  app.get('/mesh/config', (req, res) => {
    res.json({
      mockMesh: true,
      maxPeers: 4,
      stunServers: ['stun:stun.l.google.com:19302'],
      environment: 'development'
    });
  });
} else {
  app.get('/mesh/config', (req, res) => {
    res.json({
      maxPeers: 8,
      stunServers: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ],
      environment: 'production'
    });
  });
}
```

### **Connection Throttling**

```javascript
// Mobile-optimized rate limiting
const CONNECTION_LIMIT = 15; // Increased from 5 for mobile
const CONNECTION_WINDOW = 60000; // 1 minute window
const THROTTLE_DURATION = 10000; // Reduced from 30s to 10s

// Per-IP tracking
const connectionAttempts = new Map(); // IP -> attempts info
```

## 🔄 Message Flow Architecture

### **Message Lifecycle**

```
1. User Types Message
   ↓
2. Client validates + assigns temp ID
   ↓
3. Send via WebSocket to universal server
   ↓
4. Server validates + handles with environment awareness
   ↓
5. Server broadcasts to all room peers (including sender)
   ↓
6. Clients receive + update UI
   ↓
7. Clients persist to localStorage
```

### **Connection Establishment Flow**

```
1. User opens Festival Chat
   ↓
2. Server Utils detect environment (dev/staging/production)
   ↓
3. Circuit breaker checks if connection allowed
   ↓
4. WebSocket connection with mobile-optimized config
   ↓
5. Universal server auto-detects environment
   ↓
6. Polling-first transport (mobile reliability)
   ↓
7. Upgrade to WebSocket when stable
   ↓
8. Join room + sync message history
   ↓
9. Real-time messaging active
```

## 📊 Data Architecture

### **Room Code System** (Simplified - October 2025)

> **📝 For detailed information, see [Room Code/ID Simplification Guide](./ROOM-CODE-ID-SIMPLIFICATION.md)**

```typescript
// Random memorable code generation - codes ARE the room IDs
function generateRoomCode(): string {
  const adjectives = ['cosmic', 'happy', 'bright', 'electric', ...];
  const nouns = ['dragon', 'phoenix', 'tiger', 'eagle', ...];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 90) + 10; // 10-99

  return `${adjective}-${noun}-${number}`;
}

// Prettification fallback when no custom display name exists
function prettifyRoomCode(code: string): string {
  return code
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

**Key Changes (October 2025):**
- ✅ Memorable codes ARE the room IDs (no dual system)
- ✅ Random generation (not deterministic)
- ✅ Display names stored in localStorage: `room:${roomCode}:name`
- ✅ Prettification as fallback: `cosmic-dragon-42` → `Cosmic Dragon 42`
- ✅ Same system on web and Android

### **Message Storage Strategy**

**Client-Side (localStorage)**:
```typescript
interface LocalStorage {
  'peddlenet_room_messages_[roomId]': Message[];
  'peddlenet_recent_rooms': RecentRoom[];
  'peddlenet_user_settings': UserSettings;
}

// Limits
const MAX_MESSAGES_PER_ROOM = 500;
const MAX_ROOMS = 10;
const RETENTION_DAYS = 7;
```

**Server-Side (Environment-aware)**:
```javascript
// Development: In-memory storage
const messages = new Map(); // roomId -> Message[]

// Production: Could integrate SQLite or other persistence
// Universal server is ready for any storage backend
```

## ❤️ Favorites System Architecture

*[Previous Favorites System documentation remains the same, fully compatible with universal server]*

## 📱 Mobile Architecture Optimizations

### **Network Resilience**
```typescript
// Mobile-optimized Socket.IO config
const mobileConfig = {
  transports: ['polling', 'websocket'], // Polling first
  timeout: 8000,         // Reduced for mobile responsiveness
  reconnection: false,   // Disable built-in (use circuit breaker)
  upgrade: true,         // Allow WebSocket upgrade
  pingTimeout: 30000,    // Match server config
  pingInterval: 10000    // Frequent health checks
};
```

### **Battery Optimization**
- **Efficient polling** - Only when WebSocket unavailable
- **Smart reconnection** - Circuit breaker prevents spam
- **Minimal data** - Text-only messages, no media
- **Background handling** - Proper tab backgrounding support

### **Touch Interface**
- **44px minimum** touch targets (iOS/Android standards)
- **Responsive breakpoints** - Mobile, tablet, desktop
- **Safe area support** - iPhone notch, Android navigation
- **Keyboard avoidance** - Input stays visible when typing

## 🔧 Development Architecture

### **Build System**
```bash
# Development (all use universal server)
npm run dev          # Frontend only
npm run dev:mobile   # Frontend + universal server with IP detection
npm run server       # Universal server only

# Production
npm run build        # Next.js static export
npm run deploy       # Git commit + deploy trigger
./deploy.sh          # Automated deployment script
```

### **Environment Configuration**
```typescript
// Environment detection
const environment = {
  development: hostname.includes('localhost') || isIPAddress(hostname),
  production: hostname.includes('peddlenet.app') || hostname.includes('firebaseapp.com')
};

// URL management
const serverUrl = environment.development 
  ? `http://${detectedIP}:3001`
  : 'wss://peddlenet-websocket-server-[hash]-uc.a.run.app';
```

### **Universal Deployment Workflow**
```bash
# Development workflow
npm run server                    # Uses signaling-server.js (auto-detects local)
npm run dev:with-server          # Frontend + universal server

# Staging deployment
npm run deploy:firebase:complete  # Uses signaling-server.js (auto-detects firebase)

# Production deployment
./deploy.sh                      # Uses signaling-server.js (auto-detects production)
```

**Universal Docker Configuration**:
```dockerfile
# Dockerfile.minimal - Now uses universal server
COPY signaling-server.js ./server.js
# Universal server auto-detects Cloud Run environment
CMD ["node", "server.js"]
```

## 📈 Performance Architecture

### **Optimization Strategies**
- **Static generation** - Next.js pre-builds pages
- **Edge deployment** - Firebase global CDN
- **Environment-aware features** - Optimal config per environment
- **Message batching** - Efficient operations
- **Smart caching** - Room codes cached locally and server-side

### **Monitoring & Health**
```typescript
// Universal health endpoint response
interface HealthCheck {
  status: 'ok';
  version: '1.2.0-phase1-optimized';
  environment: string;
  platform: string;
  mode: 'development' | 'staging' | 'production';
  timestamp: number;
  connections: {
    rooms: number;
    totalUsers: number;
    socketIOConnections: number;
  };
  // Environment-specific features
  ...(isDevelopment && {
    debug: '/debug/rooms',
    analytics: '/analytics/dashboard'
  })
}
```

## 🚀 Scalability Considerations

### **Current Architecture**
- **50+ users per room** (tested, memory-based)
- **Universal server** (auto-scales per environment)
- **Environment detection** (optimizes per deployment)
- **Future-ready endpoints** (analytics, mesh network)

### **Scaling Strategy**
- **Redis for room state** - Multi-instance support (universal compatible)
- **Database abstraction** - Universal server ready for any backend
- **Message queue system** - Async processing (can add to universal server)
- **Mesh network integration** - P2P optimization (endpoints already built-in)

---

## 🎯 Architecture Goals Achieved

### **✅ Universal Server Benefits**
- One server file for all environments (no confusion)
- Auto-environment detection (smart adaptation)
- Future features foundation (analytics, mesh ready)
- Clean deployment workflow (same server everywhere)
- Enhanced development experience (better debugging)
- Production optimization (full feature set)

### **✅ Mobile-First Design**
- Optimized connection patterns for mobile networks
- Touch-friendly interface with proper accessibility
- Battery-efficient polling and reconnection strategies
- Mobile debug tools for real-time troubleshooting

### **✅ Festival-Optimized**
- Dark mode interface for low-light conditions
- QR code integration for easy mass onboarding
- Room code system for verbal sharing
- Network resilience for challenging wifi environments

### **✅ Zero-Setup Experience**
- No accounts, downloads, or complex configuration
- Instant messaging via QR scan or room code
- Cross-platform compatibility (desktop ↔ mobile)
- Automatic network detection and optimization

### **✅ Production Reliability**
- Circuit breaker patterns prevent connection failures
- Rate limiting protects against abuse
- Universal server adapts to any environment
- Comprehensive health monitoring and diagnostics

**This universal architecture provides a solid, unified foundation for real-time festival communication while maintaining simplicity, reliability, and future extensibility.** 🎪📱🧡