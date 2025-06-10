# Festival Chat App - Technical Documentation

## Project Overview

A P2P mesh chat application designed for offline-first environments like music festivals. Users join chat rooms by scanning QR codes placed at specific locations, with future compass/proximity features for social discovery.

## Phase 1: Core Implementation (MVP)

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript
- **P2P Communication**: PeerJS (WebRTC wrapper)
- **QR Code**: qrcode (generation) + jsqr (scanning)
- **Local Storage**: Browser localStorage (Phase 1) → IndexedDB (Phase 2)
- **PWA**: Next.js PWA plugin (optional for Phase 1)
- **Hosting**: Vercel/Netlify (static) + ngrok (testing)
- **Signaling**: PeerJS cloud server (Phase 1) → Custom server (Phase 2)

### Working Project Structure
```
festival-chat/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── scan/page.tsx               # QR Scanner
│   │   ├── chat/[roomId]/page.tsx      # Chat room with manual P2P
│   │   ├── admin/page.tsx              # QR Generator
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── DebugPanel.tsx              # P2P debugging (dev only)
│   │   └── ui/                         # Future UI components
│   ├── lib/
│   │   ├── constants.ts                # App configuration
│   │   └── types.ts                    # TypeScript interfaces
│   ├── hooks/
│   │   └── use-p2p.ts                  # P2P connection management
│   └── utils/
│       └── qr-utils.ts                 # QR generation and scanning
├── P2P-TESTING-GUIDE.md               # Complete testing instructions
├── documentation/                      # All documentation files
└── package.json
```

## Core Features - Phase 1

### 1. QR Code System

**QR Data Format:**
```typescript
interface QRData {
  roomId: string;           // e.g., crypto.randomUUID()
  displayName: string;      // e.g., "Main Stage North"
  timestamp: number;        // creation time
  version: string;          // app version compatibility
  coordinates?: {           // optional GPS coordinates
    lat: number;
    lng: number;
  };
}
```

**Implementation:**
```typescript
// QR Generation using qrcode library
import QRCode from 'qrcode';

export async function generateQRCode(data: QRData): Promise<string> {
  try {
    return await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

// QR Scanning using jsqr library (more reliable than ZXing)
import jsQR from 'jsqr';

export class QRScanner {
  private stream: MediaStream | null = null;
  private scanning: boolean = false;
  
  async start(video: HTMLVideoElement): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    video.srcObject = this.stream;
    // ... canvas-based scanning loop with jsQR
  }
}
```

### 2. P2P Connection Management (Fixed Implementation)

**Key Insight: Manual Peer ID Exchange for Phase 1**
Phase 1 uses manual peer ID exchange because automatic peer discovery requires a custom signaling server (Phase 2 feature).

```typescript
// hooks/use-p2p.ts - Working implementation
import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

export function useP2P(roomId: string) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  
  // Use refs to prevent stale closures
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<void> => {
    if (!peer || connections.has(targetPeerId) || targetPeerId === peerId) {
      return;
    }

    const conn = peer.connect(targetPeerId);
    return new Promise<void>((resolve, reject) => {
      conn.on('open', () => {
        setupConnection(conn);
        resolve();
      });
      conn.on('error', reject);
    });
  }, [peer, peerId]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    // Send to all connected peers
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(fullMessage);
      }
    });

    return fullMessage.id;
  }, []);

  // ... initialization and cleanup logic
}
```

### 3. Chat Room with Manual Connection UI

**User Experience:**
- Users scan QR codes to join rooms
- Debug panel shows peer IDs
- "Connect to Peer" button for manual connection
- Copy/paste peer IDs between devices
- Real-time messaging once connected

```typescript
// app/chat/[roomId]/page.tsx
export default function ChatRoom({ params }: { params: { roomId: string } }) {
  const { peerId, status, connectToPeer, sendMessage, onMessage } = useP2P(params.roomId);
  const [manualPeerId, setManualPeerId] = useState('');

  const handleManualConnect = async () => {
    try {
      await connectToPeer(manualPeerId.trim());
      // Store peer ID for future reconnection
      const storedPeers = JSON.parse(localStorage.getItem(`roomPeers_${params.roomId}`) || '[]');
      localStorage.setItem(`roomPeers_${params.roomId}`, 
        JSON.stringify([...storedPeers, manualPeerId.trim()]));
    } catch (error) {
      alert('Failed to connect to peer');
    }
  };

  // ... UI with peer ID display, manual connection form, and debug panel
}
```

### 4. Debug Panel for Development

**Essential for P2P Testing:**
```typescript
// components/DebugPanel.tsx
export function DebugPanel({ peerId, connectedPeers, status, roomId }) {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs">
      <div className="mb-2 font-bold">Debug Info</div>
      <div><strong>Room:</strong> {roomId}</div>
      <div><strong>My Peer ID:</strong> {peerId || 'Not connected'}</div>
      <div><strong>Connected Peers:</strong> {status.connectedPeers}</div>
      {/* ... additional debug information */}
    </div>
  );
}
```

## Phase 1 User Flow (Actual Working Implementation)

1. **QR Generation**: Admin creates QR code with unique room ID
2. **QR Scanning**: Users scan QR codes to join specific chat rooms
3. **P2P Initialization**: Each user gets unique peer ID from PeerJS cloud server
4. **Manual Connection**: Users manually exchange peer IDs to establish connections
5. **Real-time Chat**: Messages flow directly between connected devices (P2P)
6. **Persistence**: Peer IDs stored locally for automatic reconnection

## Development Setup & Testing

### Essential Dependencies
```bash
# Core P2P and QR functionality (working versions)
npm install peerjs qrcode jsqr clsx lodash

# Type definitions
npm install -D @types/qrcode @types/lodash

# Testing tools
npm install -g ngrok
```

### Testing Workflow
```bash
# Terminal 1: Start development
npm run dev

# Terminal 2: Create public tunnel for mobile testing
ngrok http 3000

# Test URLs:
# Desktop: http://localhost:3000/admin
# Mobile: https://[ngrok-url]/scan
```

### Manual P2P Testing Process
1. **Desktop**: Generate QR code → Join chat room
2. **Mobile**: Scan QR code → Join same chat room
3. **Connection**: Copy peer ID from debug panel → Paste in "Connect to Peer" form
4. **Messaging**: Send messages → Verify they appear on both devices instantly

## Technical Architecture Insights

### Why Manual Peer Exchange Works
```typescript
// PeerJS provides the signaling (peer discovery)
const peer = new Peer(); // Connects to PeerJS cloud server automatically

peer.on('open', (id) => {
  console.log('My peer ID:', id); // Unique ID for this session
  // Users manually share this ID to establish connections
});

// Direct P2P connection (no server relay for messages)
const conn = peer.connect('other-peer-id');
conn.on('open', () => {
  conn.send('Hello!'); // Direct device-to-device
});
```

### Current Limitations & Solutions
- **Manual ID Exchange**: Solved in Phase 2 with automatic peer discovery
- **Internet Dependency**: Initial connection needs internet, then works offline
- **No Mesh Routing**: Messages only reach directly connected peers (Phase 2 feature)
- **Limited Scalability**: Max ~10 direct connections per device

## Future Roadmap

### Phase 2: Enhanced Mesh Networking (Weeks 3-4)
**Features:**
- Automatic peer discovery via custom signaling server
- Multi-hop message routing
- Network topology visualization
- Connection strength indicators

**Technical Additions:**
- Custom PeerJS signaling server (Cloudflare Workers)
- Message routing protocols
- Network topology management
- Signal strength APIs

### Phase 3: Compass & Social Discovery (Weeks 5-6)
**Features:**
- Compass interface showing nearby users
- Direction and distance estimation
- "Find me" beacon functionality
- User status indicators

**Technical Additions:**
- Device Orientation API
- Geolocation integration
- Bearing calculations
- Proximity estimation algorithms

### Phase 4: Advanced Features (Weeks 7-8)
**Features:**
- Zone bridging between QR locations
- Group formation and sub-chats
- Emergency message prioritization
- Crowd density tracking for amenities (bathrooms, beer lines)
- Location pinning and crowdsourced POI mapping
- Passive crowd detection via device signals

**Technical Additions:**
- Advanced routing algorithms
- Message prioritization queues
- POI (Point of Interest) management system
- Passive device detection APIs
- Crowd density algorithms

## Feasibility & Technical Considerations

### Browser & Platform Limitations

#### WebRTC Constraints
- **Connection Limits**: Most browsers limit WebRTC connections to 10-50 simultaneous peers
- **Mobile Battery Impact**: Maintaining multiple P2P connections can drain battery quickly
- **Network Traversal**: NAT/firewall traversal may fail without STUN/TURN servers
- **iOS Safari Limitations**: Background processing restrictions may break connections when app is backgrounded

#### Passive Detection Challenges (Phase 4)
- **Limited Browser APIs**: WiFi and Bluetooth scanning APIs have very limited browser support
- **Privacy Restrictions**: Modern browsers increasingly restrict device enumeration
- **Permission Requirements**: Users must explicitly grant location and device access permissions
- **iOS Restrictions**: iOS Safari severely limits background scanning and device detection

#### PWA Limitations
- **iOS App Store**: PWAs on iOS have limited functionality compared to native apps
- **Push Notifications**: Limited push notification support without native app wrapper
- **File System Access**: Restricted access to device file system and hardware features

### Scalability Concerns

#### Mesh Network Constraints
- **Message Flooding**: Without proper routing protocols, messages may flood the network
- **Topology Fragmentation**: Network can split into isolated islands as people move
- **Latency Issues**: Multi-hop routing can introduce significant delays (>5 seconds)
- **Bandwidth Limitations**: Each device becomes a relay point, potentially overwhelming connections

#### Performance Bottlenecks
- **Memory Usage**: Storing message history and network topology can consume significant RAM
- **CPU Impact**: Continuous scanning and message routing can cause device heating
- **Storage Limits**: Browser storage quotas may be exceeded with heavy usage
- **Network Congestion**: High-density areas (>100 users) may overwhelm local infrastructure

### Security & Privacy Risks

#### P2P Security Vulnerabilities
- **Man-in-the-Middle**: Without proper encryption, messages can be intercepted
- **Identity Spoofing**: Malicious users can impersonate others without authentication
- **Message Injection**: Attackers could inject false crowd reports or malicious content
- **Network Poisoning**: Bad actors could disrupt mesh routing by providing false network information

#### Privacy Concerns
- **Location Tracking**: Passive device detection could enable location tracking across time
- **Social Graph Analysis**: Message patterns and connections could reveal social relationships
- **Device Fingerprinting**: Signal characteristics could be used to uniquely identify devices
- **Data Persistence**: Messages and user data stored locally could be accessed if device is compromised

#### Crowd Data Manipulation (Phase 4)
- **False Reporting**: Users could submit fake crowd density reports to manipulate others
- **Coordinated Attacks**: Groups could systematically provide false information
- **Business Impact**: Fake reports could unfairly impact vendors or festival areas
- **Safety Risks**: False emergency reports could misdirect resources or cause panic

### Mitigation Strategies

#### Technical Solutions
```typescript
// Connection pooling to manage WebRTC limits
class ConnectionPool {
  private maxConnections = 10;
  private priorityQueue: Connection[] = [];
  
  addConnection(peer: Peer, priority: 'high' | 'medium' | 'low') {
    if (this.connections.size >= this.maxConnections) {
      this.dropLowestPriorityConnection();
    }
    this.connections.set(peer.id, { peer, priority });
  }
}

// Message rate limiting
class RateLimiter {
  private messageCount = new Map<string, number>();
  private resetInterval = 60000; // 1 minute
  
  isAllowed(userId: string, messageType: string): boolean {
    const key = `${userId}:${messageType}`;
    const count = this.messageCount.get(key) || 0;
    const limit = this.getLimitForMessageType(messageType);
    return count < limit;
  }
}
```

#### Security Hardening
- **Message Encryption**: Implement end-to-end encryption for sensitive communications
- **Digital Signatures**: Sign messages to prevent tampering and verify authenticity
- **Reputation System**: Track user reliability for crowd reports and POI data
- **Anomaly Detection**: Identify suspicious patterns in reporting behavior

#### Privacy Protection
- **Data Minimization**: Collect only essential data, auto-expire location data
- **Anonymization**: Use rotating pseudonyms instead of persistent user IDs
- **Local Processing**: Process crowd data locally instead of sharing raw device info
- **Consent Management**: Clear opt-in/opt-out for different privacy levels

### Development & Deployment Considerations

#### Testing Strategy
- **Gradual Rollout**: Start with small events (<500 people) before major festivals
- **Load Testing**: Gradually increase user count to identify breaking points
- **Failure Mode Testing**: Systematically test network partitions and device failures
- **Cross-Platform Testing**: Ensure consistent behavior across devices and browsers

#### Monitoring & Analytics
- **Performance Metrics**: Track connection success rates, message latency, battery usage
- **Error Logging**: Comprehensive logging for debugging network issues
- **User Feedback**: Built-in reporting for users to flag issues or inaccuracies
- **A/B Testing**: Test different mesh routing algorithms and connection strategies

#### Legal & Compliance
- **Data Protection**: Ensure GDPR/CCPA compliance for EU/CA users
- **Location Privacy**: Comply with local regulations on location data collection
- **Content Moderation**: Plan for handling inappropriate content and harassment
- **Emergency Protocols**: Ensure emergency messages reach proper authorities

### Alternative Approaches

#### Hybrid Architecture (Recommended for Production)
```typescript
// Fallback to centralized when mesh fails
class HybridNetworkManager {
  private meshManager: MeshManager;
  private centralizedManager: CentralizedManager;
  
  async sendMessage(message: Message) {
    try {
      await this.meshManager.sendMessage(message);
    } catch (meshError) {
      // Fallback to centralized when available
      if (this.hasInternetConnection()) {
        await this.centralizedManager.sendMessage(message);
      } else {
        throw new Error('No network available');
      }
    }
  }
}
```

#### Simplified Production MVP
- **Start with QR + P2P Chat**: Focus on basic messaging first
- **Add Mesh Gradually**: Implement mesh networking after proving basic concept
- **Manual Reporting Only**: Skip passive detection for initial version
- **WiFi Hotspot Mode**: Use one device as hotspot instead of true mesh

### Success Metrics & KPIs

#### Technical Performance
- **Connection Success Rate**: >90% of attempted P2P connections succeed
- **Message Delivery Rate**: >95% of messages reach intended recipients within 30 seconds
- **Battery Impact**: <20% additional battery drain compared to baseline
- **Network Resilience**: Maintain connectivity with >70% of network partitioned

#### User Experience
- **User Adoption**: >60% of users complete onboarding and send at least one message
- **Data Accuracy**: >85% of crowd reports verified as accurate by subsequent users (Phase 4)
- **Response Time**: <5 seconds average time from message send to delivery
- **User Retention**: >40% of users continue using app throughout event

## Getting Started

### Quick Setup
```bash
# 1. Create Next.js project
npx create-next-app@latest festival-chat --typescript --tailwind --app --src-dir

# 2. Install dependencies
npm install peerjs qrcode jsqr clsx lodash
npm install -D @types/qrcode @types/lodash

# 3. Copy fixed implementations from documentation
# 4. Start development
npm run dev

# 5. Test with ngrok
ngrok http 3000
```

### Essential Files to Implement
1. `src/lib/types.ts` - TypeScript interfaces
2. `src/lib/constants.ts` - App configuration
3. `src/utils/qr-utils.ts` - QR generation and scanning
4. `src/hooks/use-p2p.ts` - Fixed P2P connection logic
5. `src/components/DebugPanel.tsx` - Development debugging
6. `src/app/admin/page.tsx` - QR generator
7. `src/app/chat/[roomId]/page.tsx` - Chat room with manual connection
8. `P2P-TESTING-GUIDE.md` - Complete testing instructions

### Environment Variables
```env
NEXT_PUBLIC_APP_VERSION=1.0.0
# Phase 1 uses PeerJS cloud server (no custom server setup needed)
```

This comprehensive documentation provides a complete understanding of the Festival Chat app's current working state, technical architecture, challenges, and roadmap for future development. The Phase 1 implementation with manual peer exchange is fully functional and provides a solid foundation for building the advanced mesh networking and social discovery features in later phases.