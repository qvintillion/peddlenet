# 🏗️ Architecture Overview - Festival Chat

## 🎯 System Overview

Festival Chat is a hybrid WebSocket-based real-time messaging platform optimized for mobile devices and festival environments. It combines the reliability of centralized messaging with the performance benefits of client-side optimization.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Festival Chat System               │
├─────────────────────────────────────────────────────┤
│  Frontend (Next.js)           Backend (Node.js)    │
│  ┌─────────────────────┐     ┌─────────────────────┐ │
│  │ React Components    │     │ WebSocket Server    │ │
│  │ - Chat Interface    │ ←→  │ - Real-time msgs    │ │
│  │ - QR Code Scanner   │     │ - Room management   │ │
│  │ - Room Management   │     │ - SQLite persistence│ │
│  └─────────────────────┘     └─────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Client-Side Optimizations    Server-Side Features │
│  - Circuit Breaker Pattern    - Connection Throttling│
│  - Exponential Backoff       - Rate Limiting        │
│  - Mobile Connection Debug    - Health Monitoring   │
│  - Message Persistence       - Room Code System     │
└─────────────────────────────────────────────────────┘
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
- **Database**: SQLite with WAL mode
- **Persistence**: Custom SQLite message storage
- **CORS**: Configured for cross-origin support

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

**1. Circuit Breaker Pattern**
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

**2. Exponential Backoff**
```typescript
// Gentle mobile-optimized backoff curve
static getExponentialBackoffDelay(attempt: number): number {
  const baseDelay = 500; // 500ms base (was 1s)
  const maxDelay = 8000; // 8s max (was 30s)
  const jitter = Math.random() * 500;
  
  return Math.min(baseDelay * Math.pow(1.5, attempt) + jitter, maxDelay);
}
```

**3. Smart Error Handling**
```typescript
// Rate limits don't trigger circuit breaker
if (!error.message.includes('rate limit')) {
  ConnectionResilience.recordFailure();
} else {
  console.log('🕰️ Rate limit detected, not counting as failure');
}
```

## 🖥️ Server Architecture

### **WebSocket Server Structure**

```javascript
// signaling-server-sqlite.js
const express = require('express');
const { Server } = require('socket.io');
const MessagePersistence = require('./sqlite-persistence');

// Core Components
const app = express();                    // HTTP endpoints
const server = createServer(app);         // HTTP server
const io = new Server(server, config);    // WebSocket server
const persistence = new MessagePersistence(); // SQLite storage
```

### **Room Management**

```javascript
// In-Memory Room State
const rooms = new Map(); // roomId -> { peers: Map, created: timestamp }

// Room Structure
interface Room {
  peers: Map<socketId, PeerInfo>;
  created: number;
  lastActivity: number;
}

interface PeerInfo {
  peerId: string;
  displayName: string;
  joinedAt: number;
  socketId: string;
}
```

### **Message Persistence**

```javascript
// SQLite Schema
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_timestamp ON messages(room_id, timestamp);
CREATE INDEX idx_created_at ON messages(created_at);
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
3. Send via WebSocket to server
   ↓
4. Server validates + persists to SQLite
   ↓
5. Server broadcasts to all room peers
   ↓
6. Clients receive + update UI
   ↓
7. Clients persist to localStorage
```

### **Connection Establishment Flow**

```
1. User opens Festival Chat
   ↓
2. Server Utils detect environment (dev/prod)
   ↓
3. Circuit breaker checks if connection allowed
   ↓
4. WebSocket connection with mobile-optimized config
   ↓
5. Polling-first transport (mobile reliability)
   ↓
6. Upgrade to WebSocket when stable
   ↓
7. Join room + sync message history
   ↓
8. Real-time messaging active
```

## 📊 Data Architecture

### **Room Code System**

```typescript
// Deterministic room code generation
function generateRoomCode(roomId: string): string {
  const adjectives = ['blue', 'bright', 'magic', 'cosmic', ...];
  const nouns = ['stage', 'beat', 'vibe', 'party', ...];
  
  const hash = simpleHash(roomId);
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = (Math.abs(hash >> 16) % 99) + 1;
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}
```

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

**Server-Side (SQLite)**:
```sql
-- Automatic cleanup (runs hourly)
DELETE FROM messages 
WHERE created_at < datetime('now', '-24 hours');

-- Message limits per room
DELETE FROM messages 
WHERE room_id = ? 
AND id NOT IN (
  SELECT id FROM messages 
  WHERE room_id = ? 
  ORDER BY timestamp DESC 
  LIMIT 100
);
```

## 🛡️ Security Architecture

### **Data Protection**
- **No authentication** - Anonymous usage only
- **Temporary data** - 24h server retention, 7d client retention
- **Local network** - Development mode works offline
- **Encrypted transport** - HTTPS/WSS in production
- **No PII storage** - Only display names and messages

### **Rate Limiting & DDoS Protection**
```typescript
// Multi-layer protection
interface Protection {
  // Client-side circuit breaker
  circuitBreaker: {
    threshold: 5,      // failures before opening
    timeout: 15000,    // recovery time
    backoff: 'gentle'  // 1.5x multiplier vs 2x
  };
  
  // Server-side throttling
  rateLimiting: {
    attempts: 15,      // per minute per IP
    window: 60000,     // sliding window
    throttle: 10000    // cooldown duration
  };
}
```

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
# Development
npm run dev          # Frontend only
npm run dev:mobile   # Frontend + backend with IP detection
npm run server       # Backend only

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

## 📈 Performance Architecture

### **Optimization Strategies**
- **Static generation** - Next.js pre-builds pages
- **Edge deployment** - Firebase global CDN
- **Connection pooling** - SQLite WAL mode for concurrency
- **Message batching** - Efficient database operations
- **Smart caching** - Room codes cached locally and server-side

### **Monitoring & Health**
```typescript
// Health endpoint response
interface HealthCheck {
  status: 'ok';
  timestamp: number;
  version: string;
  connections: {
    rooms: number;
    totalUsers: number;
    socketIOConnections: number;
  };
  throttling: {
    activeIPs: number;
    blockedIPs: number;
    totalAttempts: number;
  };
  database: {
    totalMessages: number;
    totalRooms: number;
    oldestMessage: number;
  };
}
```

## 🚀 Scalability Considerations

### **Current Limits**
- **50+ users per room** (tested, memory-based)
- **100 messages per room** (server storage)
- **24-hour persistence** (automatic cleanup)
- **Single server instance** (Cloud Run auto-scaling)

### **Future Scaling Strategy**
- **Redis for room state** - Multi-instance support
- **Database connection pooling** - Higher concurrency
- **Message queue system** - Async processing
- **Mesh network integration** - P2P optimization

---

## 🎯 Architecture Goals Achieved

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
- Message persistence survives network interruptions
- Comprehensive health monitoring and diagnostics

**This architecture provides a solid foundation for real-time festival communication while maintaining simplicity and reliability.** 🎪📱