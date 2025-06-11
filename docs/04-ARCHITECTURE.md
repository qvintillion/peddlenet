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

### **🧹 Signaling Server Architecture (Cleaned & Simplified)**

**Current Clean Architecture**:
```
festival-chat/
├── signaling-server.js                    # 🟢 ACTIVE: Local development
├── signaling-server-sqlite-enhanced.js    # 🟢 ACTIVE: Production (Cloud Run)
├── sqlite-persistence.js                  # 🟢 ACTIVE: Database helper
├── Dockerfile                             # → Uses sqlite-enhanced
├── package.json                           # → "server" uses basic version
└── archive/                               # 🗂️ Safely stored backups
    ├── signaling-server-*.js              # 📦 All previous versions archived
    └── [backup files]                     # 📦 Old development iterations
```

**Development Server** (`signaling-server.js`):
- **Purpose**: Local development and testing
- **Features**: In-memory storage, basic room handling, mobile-accessible URLs
- **Used by**: `npm run server` and `npm run dev:with-server`
- **When to use**: Local development, testing, quick prototyping

**Production Server** (`signaling-server-sqlite-enhanced.js`):
- **Purpose**: Production deployment on Google Cloud Run
- **Features**: SQLite persistence, mobile optimization, health monitoring, connection throttling
- **Used by**: Dockerfile and Cloud Run deployment
- **When to use**: Production deployment, staging environments, performance testing

**Benefits of Clean Architecture**:
- ✅ **Clear separation** - Development vs production environments
- ✅ **Reduced confusion** - Only 2 active server files vs previously 6+ versions
- ✅ **Better maintenance** - Single source of truth for each environment
- ✅ **Easier collaboration** - Team knows exactly which files are active
- ✅ **Backup preservation** - All old versions safely archived for rollback if needed

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

## 🔔 Notification Architecture

### **Cross-Room Background Notification System** 🎯

Festival Chat features a sophisticated **global notification system** that works across all rooms when users are away from the app. This breakthrough feature ensures users never miss important messages from any subscribed rooms.

#### **Notification Flow Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                  Global Notification System                │
├─────────────────────────────────────────────────────────────┤
│  Homepage (Global Handler)     Chat Rooms (Room Handler)   │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   │
│  │ useGlobalNotifications  │   │ useRoomNotifications    │   │
│  │ - Cross-room alerts     │   │ - Room-specific setup   │   │
│  │ - Permission management │   │ - Subscription toggle   │   │
│  │ - Service worker API    │   │ - Custom settings       │   │
│  └─────────────────────────┘   └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              Background WebSocket Connection                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Background Notification Manager (Singleton)         │     │
│  │ - Persistent connection to WebSocket server         │     │
│  │ - Subscription management for multiple rooms        │     │
│  │ - Global + room-specific message handlers          │     │
│  │ - localStorage persistence of subscriptions        │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### **Notification Permission Flow** 🔐

```typescript
// 1. Homepage: Global Permission Request
function GlobalNotificationSettings() {
  const { requestPermission, subscribeToNotifications } = usePushNotifications();
  
  // One-time browser permission request
  const enableNotifications = async () => {
    const permission = await requestPermission(); // Browser prompt
    if (permission === 'granted') {
      await subscribeToNotifications(); // Service worker setup
    }
  };
}

// 2. Chat Room: Room-Specific Subscription
function NotificationSettings({ roomId }) {
  const { subscribeToRoom } = useBackgroundNotifications();
  
  // Subscribe to this specific room's notifications
  const enableRoomNotifications = () => {
    subscribeToRoom(roomId, displayName);
  };
}
```

#### **Background Notification Architecture** 🔄

```typescript
// Background Manager (Singleton)
class BackgroundNotificationManager {
  private socket: Socket; // Persistent WebSocket connection
  private globalHandler: (message: Message) => void; // Homepage handler
  private roomHandlers: Map<string, Function>; // Room-specific handlers
  private subscriptions: Map<string, Subscription>; // Active room subscriptions
  
  // Message handling priority:
  onMessage(message) {
    const roomHandler = this.roomHandlers.get(message.roomId);
    if (roomHandler) {
      // Use room-specific handler if available (user in room)
      roomHandler(message);
    } else if (this.globalHandler) {
      // Fallback to global handler (user on homepage/other pages)
      this.globalHandler(message);
    }
  }
}
```

#### **Notification Triggers** 📱

**Service Worker Notifications** (Primary Method):
```typescript
// Global notification handler for cross-room alerts
const globalHandler = (message: Message) => {
  navigator.serviceWorker.ready.then(registration => {
    return registration.showNotification(`New Message in "${message.roomId}"`, {
      body: `${message.sender}: ${message.content}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `festival-chat-${message.roomId}`,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      renotify: true,
      data: {
        url: `/chat/${message.roomId}`,
        roomId: message.roomId,
        messageId: message.id
      },
      actions: [
        { action: 'open', title: 'Open Chat' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  });
};
```

**Fallback Notifications** (Backup Method):
```typescript
// Direct Notification API fallback
try {
  const notification = new Notification(`New Message in "${roomId}"`, {
    body: `${message.sender}: ${message.content}`,
    icon: '/favicon.ico',
    vibrate: [200, 100, 200]
  });
  
  notification.onclick = () => {
    window.focus();
    window.location.href = `/chat/${roomId}`;
    notification.close();
  };
} catch (error) {
  console.warn('Notification fallback failed:', error);
}
```

#### **Mobile Notification Optimization** 📲

```typescript
// Mobile-specific notification logic
const shouldNotify = (message: Message): boolean => {
  // Enhanced mobile background detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isPageHidden = document.hidden;
  const visibilityState = document.visibilityState;
  const hasFocus = document.hasFocus();
  
  if (isMobile) {
    // Aggressive notification strategy for mobile
    // Show notification if ANY uncertainty about app state
    return (
      isPageHidden || 
      visibilityState === 'hidden' || 
      !hasFocus || 
      visibilityState !== 'visible'
    );
  } else {
    // Conservative desktop strategy
    return isPageHidden || visibilityState === 'hidden' || !hasFocus;
  }
};
```

#### **Subscription Management** 💾

```typescript
interface NotificationSubscription {
  roomId: string;
  displayName: string;
  subscribed: boolean;
  lastSeen: number; // For cleanup
}

// Persistent storage
class SubscriptionManager {
  // Save to localStorage
  saveSubscriptions() {
    const subscriptions = Array.from(this.subscriptions.values());
    localStorage.setItem('background_notification_subscriptions', JSON.stringify(subscriptions));
  }
  
  // Restore on app startup
  loadSubscriptions() {
    const saved = localStorage.getItem('background_notification_subscriptions');
    if (saved) {
      const data = JSON.parse(saved);
      // Only restore recent subscriptions (24h)
      data.forEach(sub => {
        if (Date.now() - sub.lastSeen < 24 * 60 * 60 * 1000) {
          this.subscriptions.set(sub.roomId, sub);
        }
      });
    }
  }
}
```

#### **Key Features** ✨

1. **🌍 Global Scope**: Works across all pages, not just chat rooms
2. **🔄 Persistent Connection**: Background WebSocket maintains subscriptions
3. **📱 Mobile Optimized**: Aggressive detection for mobile browsers
4. **💾 Persistence**: Subscriptions survive page refreshes and app restarts
5. **🎯 Smart Routing**: Room-specific vs global handler priority
6. **⚡ Instant Delivery**: Real-time notifications via WebSocket
7. **🔧 Fallback System**: Multiple notification methods for reliability
8. **🧹 Auto Cleanup**: 24-hour subscription expiry

#### **Notification Scopes** 🎯

| Scope | Handler | When Active | Purpose |
|-------|---------|-------------|---------|
| **Global** | `useGlobalBackgroundNotifications()` | Homepage, any non-chat page | Cross-room notifications when away |
| **Room-Specific** | `useRoomBackgroundNotifications()` | Inside chat rooms | Room-focused notifications with context |
| **Background Service** | `BackgroundNotificationManager` | Always (singleton) | Persistent connection management |

**This notification architecture ensures users never miss important messages, regardless of which page they're on or how they navigate the app.** 🎪📱

---

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

### **Deployment Server Selection**
```bash
# Development workflow
npm run server                    # Uses signaling-server.js (in-memory)
npm run dev:with-server          # Frontend + basic server

# Production deployment
npm run deploy:firebase:complete  # Uses signaling-server-sqlite-enhanced.js
./deploy.sh                      # Commits to GitHub → Cloud Run deployment
```

**Docker Configuration**:
```dockerfile
# Dockerfile automatically uses enhanced production server
COPY signaling-server-sqlite-enhanced.js ./
COPY sqlite-persistence.js ./
# Starts with full SQLite + mobile optimizations
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