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

## ❤️ Favorites System Architecture

### **Overview**

The Favorites system is Festival Chat's central room management feature that combines bookmarking, quick access, and intelligent notification management. It transforms the app from a simple chat interface into a comprehensive festival communication hub.

### **Component Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     Favorites System Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  Homepage (JoinedRooms.tsx)           Chat Room (FavoriteButton.tsx)  │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐  │
│  │ Favorites Cards Display      │     │ ❤️ Add/Remove Toggle      │  │
│  │ - Horizontal scrolling       │     │ - Instant favorites update │  │
│  │ - Notification status        │ ↔️  │ - Auto notification sync   │  │
│  │ - Quick "Enter" buttons      │     │ - Visual feedback          │  │
│  │ - Remove (×) buttons         │     │ - localStorage updates     │  │
│  └─────────────────────────────┘     └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                        Data Storage Layer                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ localStorage['favoriteRooms'] ↔️ RoomCodeManager.getRecentRoomCodes() │  │
│  │ - Simple array of room IDs    ↔️ - Room metadata + codes          │  │
│  │ - Cross-tab synchronization   ↔️ - Timestamp tracking             │  │
│  └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Notification Integration                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ useBackgroundNotifications() ↔️ usePushNotifications()       │  │
│  │ - Real-time status sync       ↔️ - Room-specific toggle         │  │
│  │ - Cross-room notifications    ↔️ - Service worker integration   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Core Components**

#### **1. JoinedRooms Component (Homepage Display)**
```typescript
// Main favorites interface component
export function JoinedRooms({ className = '' }: FavoritesProps) {
  const { subscriptions, unsubscribeFromRoom } = useBackgroundNotifications();
  const [favoritesKey, setFavoritesKey] = useState(0); // Force re-renders
  
  // Combine favorites list with room metadata
  const favoriteRooms = useMemo(() => {
    const recentRooms = RoomCodeManager.getRecentRoomCodes();
    const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
    
    return recentRooms
      .filter(room => favorites.includes(room.roomId))
      .map(room => {
        const subscription = subscriptions.find(sub => sub.roomId === room.roomId);
        return {
          ...room,
          isSubscribed: subscription ? subscription.subscribed : false
        };
      });
  }, [favoritesKey, subscriptions]);
}
```

**Key Features:**
- **Horizontal Card Layout**: Touch-optimized scrolling interface
- **Real-time Status**: Live notification status indicators
- **Quick Actions**: One-tap room entry and removal
- **Performance Optimized**: Memoized rendering prevents unnecessary updates

#### **2. FavoriteButton Component (In-Chat Toggle)**
```typescript
// Add/remove favorites button in chat interface
export function FavoriteButton({ roomId, displayName }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { subscribeToRoom, unsubscribeFromRoom } = useBackgroundNotifications();
  
  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
    
    if (isFavorite) {
      // Remove from favorites AND disable notifications
      const updatedFavorites = favorites.filter((id: string) => id !== roomId);
      localStorage.setItem('favoriteRooms', JSON.stringify(updatedFavorites));
      unsubscribeFromRoom(roomId);
    } else {
      // Add to favorites AND enable notifications
      const updatedFavorites = [...favorites, roomId];
      localStorage.setItem('favoriteRooms', JSON.stringify(updatedFavorites));
      subscribeToRoom(roomId, displayName);
    }
    
    // Notify other components via custom event
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };
}
```

**Key Features:**
- **Instant Feedback**: Visual state changes immediately
- **Automatic Notification Management**: Subscribes/unsubscribes automatically
- **Cross-Component Communication**: Custom events for real-time updates
- **Persistent State**: localStorage integration for durability

### **Data Flow Architecture**

#### **Adding a Room to Favorites**
```
1. User clicks ❤️ button in chat room
   ↓
2. FavoriteButton.handleToggleFavorite()
   ↓
3. localStorage['favoriteRooms'] updated
   ↓
4. backgroundNotificationManager.subscribeToRoom()
   ↓
5. window.dispatchEvent('favoritesChanged')
   ↓
6. JoinedRooms component re-renders
   ↓
7. New favorite card appears on homepage
   ↓
8. Notification status shows "🔔 On"
```

#### **Removing a Room from Favorites**
```
1. User clicks × button on favorites card OR ❤️ in chat
   ↓
2. Confirmation dialog (for card removal)
   ↓
3. localStorage['favoriteRooms'] updated (remove roomId)
   ↓
4. backgroundNotificationManager.unsubscribeFromRoom()
   ↓
5. window.dispatchEvent('favoritesChanged')
   ↓
6. JoinedRooms component re-renders
   ↓
7. Favorite card disappears from homepage
   ↓
8. Notifications disabled for that room
```

### **Storage Architecture**

#### **localStorage Schema**
```typescript
// Favorites storage (simple array)
localStorage['favoriteRooms'] = JSON.stringify([
  'mainstage-vip',
  'backstage-crew', 
  'vip-lounge-42'
]);

// Room metadata storage (managed by RoomCodeManager)
localStorage['peddlenet_recent_rooms'] = JSON.stringify([
  {
    roomId: 'mainstage-vip',
    code: 'magic-stage-42',
    timestamp: 1699123456789,
    lastVisited: 1699123456789
  },
  // ... more rooms
]);

// Notification subscriptions (managed by BackgroundNotificationManager)
localStorage['background_notification_subscriptions'] = JSON.stringify([
  {
    roomId: 'mainstage-vip',
    displayName: 'John',
    subscribed: true,
    lastSeen: 1699123456789
  },
  // ... more subscriptions
]);
```

#### **Data Relationship**
```typescript
// How components combine the data
interface FavoriteRoom {
  roomId: string;        // From favoriteRooms array
  code: string;          // From RoomCodeManager.getRecentRoomCodes()
  timestamp: number;     // From RoomCodeManager (last visited)
  isSubscribed: boolean; // From BackgroundNotificationManager
}

// The magic happens in the memoized favoriteRooms calculation
const favoriteRooms = useMemo(() => {
  const recentRooms = RoomCodeManager.getRecentRoomCodes();
  const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
  
  return recentRooms
    .filter(room => favorites.includes(room.roomId))  // Only favorited rooms
    .map(room => {
      const subscription = subscriptions.find(sub => sub.roomId === room.roomId);
      return {
        ...room,
        isSubscribed: subscription ? subscription.subscribed : false
      };
    });
}, [favoritesKey, subscriptions]);
```

### **Event-Driven Updates**

#### **Cross-Component Communication**
```typescript
// Custom event system for real-time synchronization
interface FavoritesEventSystem {
  // Event dispatching (from FavoriteButton and JoinedRooms)
  dispatch: () => window.dispatchEvent(new CustomEvent('favoritesChanged'));
  
  // Event listening (in JoinedRooms)
  listen: () => {
    const handleFavoritesChange = () => setFavoritesKey(prev => prev + 1);
    window.addEventListener('favoritesChanged', handleFavoritesChange);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange);
  };
}

// Usage in components
useEffect(() => {
  const cleanup = listen();
  return cleanup;
}, []);
```

**Benefits:**
- **Real-time Updates**: Changes instantly reflect across all components
- **Loose Coupling**: Components don't need direct references to each other
- **Performance**: Only triggers re-renders when needed
- **Reliability**: Works across browser tabs and page refreshes

### **Mobile Optimization Architecture**

#### **Touch-Friendly Interface**
```css
/* CSS architecture for mobile optimization */
.favorite-card {
  min-width: 160px;           /* Prevents cards from being too narrow */
  touch-action: manipulation; /* Optimizes touch response */
}

.favorite-card button {
  min-height: 44px;           /* iOS/Android minimum touch target */
  min-width: 44px;
}

.favorites-container {
  overflow-x: auto;           /* Horizontal scrolling */
  -webkit-overflow-scrolling: touch; /* Smooth iOS scrolling */
  scrollbar-width: none;      /* Hide scrollbars on mobile */
}
```

#### **Responsive Layout**
```typescript
// Responsive design patterns
const mobileOptimizations = {
  cardWidth: {
    mobile: 'min-w-[160px]',     // Minimum width for readability
    tablet: 'min-w-[180px]',     // Slightly larger for tablets
    desktop: 'min-w-[200px]'     // Full width for desktop
  },
  spacing: {
    mobile: 'space-x-3',         // Tight spacing for mobile
    desktop: 'space-x-4'         // More spacious for desktop
  },
  scrolling: {
    mobile: 'overflow-x-auto pb-3', // Account for scroll indicators
    desktop: 'overflow-x-hidden'    // No horizontal scroll needed
  }
};
```

### **Performance Architecture**

#### **Optimization Strategies**
```typescript
// 1. Memoization prevents unnecessary re-renders
const favoriteRooms = useMemo(() => {
  // Heavy computation only runs when dependencies change
  return computeFavoriteRooms(subscriptions, favoritesKey);
}, [subscriptions, favoritesKey]);

// 2. Ref-based subscription tracking
const subscriptionsRef = useRef(subscriptions);
useEffect(() => {
  subscriptionsRef.current = subscriptions;
}, [subscriptions]);

// 3. Debounced localStorage updates
const debouncedUpdateFavorites = useCallback(
  debounce((newFavorites: string[]) => {
    localStorage.setItem('favoriteRooms', JSON.stringify(newFavorites));
  }, 300),
  []
);
```

#### **Memory Management**
```typescript
// Cleanup strategies
interface MemoryManagement {
  // Event listeners are properly removed
  componentCleanup: () => {
    return () => {
      window.removeEventListener('favoritesChanged', handler);
      backgroundNotificationManager.removeListener(listener);
    };
  };
  
  // Stale data cleanup
  dataCleanup: () => {
    // Remove rooms not visited in 7+ days
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const activeFavorites = favorites.filter(room => room.timestamp > cutoff);
  };
}
```

### **Integration Points**

#### **Room Code System Integration**
```typescript
// Deep integration with room code management
class FavoritesRoomCodeIntegration {
  // Favorites leverage existing room code infrastructure
  static getFavoriteRoomData(roomId: string) {
    const recentRooms = RoomCodeManager.getRecentRoomCodes();
    const roomData = recentRooms.find(room => room.roomId === roomId);
    return {
      roomId: roomData?.roomId || roomId,
      code: roomData?.code || 'unknown-code',
      timestamp: roomData?.timestamp || Date.now()
    };
  }
  
  // Room codes stay consistent for sharing
  static getShareableCode(roomId: string): string {
    return RoomCodeManager.generateRoomCode(roomId);
  }
}
```

#### **Notification System Integration**
```typescript
// Seamless notification management
class FavoritesNotificationIntegration {
  // Adding to favorites automatically enables notifications
  static addToFavorites(roomId: string, displayName: string) {
    // 1. Update favorites list
    const favorites = this.getFavoritesList();
    favorites.push(roomId);
    localStorage.setItem('favoriteRooms', JSON.stringify(favorites));
    
    // 2. Enable notifications
    backgroundNotificationManager.subscribeToRoom(roomId, displayName);
    
    // 3. Sync UI
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  }
  
  // Removing from favorites disables notifications
  static removeFromFavorites(roomId: string) {
    // 1. Update favorites list
    const favorites = this.getFavoritesList().filter(id => id !== roomId);
    localStorage.setItem('favoriteRooms', JSON.stringify(favorites));
    
    // 2. Disable notifications
    backgroundNotificationManager.unsubscribeFromRoom(roomId);
    
    // 3. Sync UI
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  }
}
```

### **Future Scalability**

#### **Planned Enhancements**
```typescript
// Architecture designed for future features
interface FutureEnhancements {
  // Cloud sync for cross-device favorites
  cloudSync: {
    syncToCloud: (favorites: string[]) => Promise<void>;
    syncFromCloud: () => Promise<string[]>;
    mergeStrategy: 'union' | 'replace' | 'smart';
  };
  
  // Advanced categorization
  categories: {
    userDefined: string[];     // Custom categories
    automatic: string[];       // AI-generated categories
    filters: string[];         // Filter by category
  };
  
  // Analytics integration
  analytics: {
    trackFavoriteUsage: (roomId: string) => void;
    optimizeRecommendations: () => string[];
    exportUsageData: () => FavoriteUsageData;
  };
}
```

### **Key Architectural Benefits**

1. **🎯 Unified Experience**: Seamlessly integrates room management with notifications
2. **📱 Mobile-First**: Touch-optimized interface with responsive design
3. **⚡ Performance**: Memoized rendering and efficient event handling
4. **🔄 Real-Time**: Instant updates across all components and browser tabs
5. **💾 Persistent**: Survives page refreshes and browser restarts
6. **🔧 Extensible**: Architecture ready for future enhancements
7. **🧠 Intelligent**: Smart integration with existing room code and notification systems

**The Favorites system architecture transforms Festival Chat from a simple messaging app into a comprehensive festival communication hub, providing the foundation for advanced room management while maintaining simplicity and performance.** 🎪❤️

---

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

#### **Enhanced Notification Status Synchronization (June 2025)** 🎯

**Major Architecture Improvements:**

The notification system underwent significant improvements to ensure proper status synchronization across all UI components and preserve user preferences when navigating between rooms.

**Before (Issues Fixed):**
```typescript
// PROBLEMATIC: Always auto-subscribed regardless of preferences
useRoomBackgroundNotifications(roomId, displayName) {
  useEffect(() => {
    // ❌ This always subscribed, ignoring user preferences
    backgroundNotificationManager.subscribeToRoom(roomId, displayName);
  }, [roomId, displayName]);
}

// PROBLEMATIC: Push notifications hook didn't consider room preferences
const checkStatus = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const hasPermission = Notification.permission === 'granted';
  // ❌ Only checked global permission, not room-specific preference
  setIsSubscribed(!!registration && hasPermission);
};
```

**After (Current Architecture):**
```typescript
// ✅ ENHANCED: Respects existing preferences before auto-subscribing
useRoomBackgroundNotifications(roomId, displayName) {
  useEffect(() => {
    const currentState = backgroundNotificationManager.getState();
    const existingSubscription = currentState.subscriptions.get(roomId);
    
    // Only auto-subscribe if no preference exists OR notifications are enabled
    if (!existingSubscription || existingSubscription.subscribed) {
      backgroundNotificationManager.subscribeToRoom(roomId, displayName);
    } else {
      console.log('🔕 Respecting disabled notification preference');
    }
  }, [roomId, displayName]);
}

// ✅ ENHANCED: Considers both global permission AND room preference
const checkStatus = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const hasPermission = Notification.permission === 'granted';
  
  // Check room-specific preference if roomId provided
  let roomNotificationsEnabled = true;
  if (roomId) {
    const bgState = backgroundNotificationManager.getState();
    const roomSubscription = bgState.subscriptions.get(roomId);
    roomNotificationsEnabled = roomSubscription ? roomSubscription.subscribed : true;
  }
  
  // Only subscribed if ALL conditions met
  const finalStatus = !!registration && hasPermission && roomNotificationsEnabled;
  setIsSubscribed(finalStatus);
};
```

**Key Architectural Changes:**

1. **Preference Persistence**:
   ```typescript
   // Enhanced unsubscribeFromRoom - preserves preference instead of deleting
   unsubscribeFromRoom(roomId: string) {
     const existingSubscription = this.state.subscriptions.get(roomId);
     if (existingSubscription) {
       // ✅ Keep subscription but mark as disabled
       existingSubscription.subscribed = false;
       existingSubscription.lastSeen = Date.now();
     } else {
       // ✅ Create disabled subscription record for future reference
       this.state.subscriptions.set(roomId, {
         roomId, displayName: '', subscribed: false, lastSeen: Date.now()
       });
     }
   }
   ```

2. **Real-time Status Synchronization**:
   ```typescript
   // Push notifications hook now listens to background notification changes
   useEffect(() => {
     if (roomId) {
       const unsubscribe = backgroundNotificationManager.addListener(() => {
         checkStatus(); // Re-check when background notifications change
       });
       return unsubscribe;
     }
   }, [roomId]);
   ```

3. **Unified Subscribe/Unsubscribe**:
   ```typescript
   // Room settings toggle now manages both systems together
   const handleSubscriptionToggle = async () => {
     if (isSubscribed) {
       await unsubscribeFromNotifications(); // Push notifications
       unsubscribeFromRoom(roomId);         // Background notifications
     } else {
       if (permission === 'granted') {
         await subscribeToNotifications();   // Push notifications
         // Background notifications automatically enabled via room hook
       }
     }
   };
   ```

**Synchronization Flow:**
```
1. User enters room → Check existing preference
2. If preference exists and disabled → Respect it, don't auto-subscribe
3. If no preference or enabled → Auto-subscribe
4. User toggles in room settings → Update both systems immediately
5. Status change → Notify all listeners → Update UI across all components
6. User leaves room → Preference preserved for next visit
7. User re-enters room → Previous preference respected
```

**Benefits:**
- ✅ **Consistent UX**: Favorites cards and room settings always match
- ✅ **Preserved Preferences**: Notification choices persist across sessions
- ✅ **Real-time Updates**: Status changes immediately reflect everywhere
- ✅ **Smart Auto-Subscribe**: New rooms enable notifications, returning rooms respect preferences
- ✅ **Memory Efficient**: Disabled subscriptions don't consume WebSocket resources

**This enhancement ensures the notification system behaves predictably and respects user preferences, creating a polished and reliable user experience.** 🎪📱

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