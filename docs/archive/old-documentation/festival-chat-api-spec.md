# Festival Chat API Specification

## Overview

This document defines the API interfaces for the Festival Chat application, including P2P messaging protocols, signaling server endpoints, and client-side APIs.

## Base Configuration

```typescript
const API_BASE = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'https://your-worker.your-subdomain.workers.dev';
const WS_BASE = API_BASE.replace('https:', 'wss:');
const API_VERSION = 'v1';
```

## 1. Signaling Server API (Cloudflare Workers)

### 1.1 Room Management

#### POST /api/v1/rooms/{roomId}/announce
Announce peer presence in a room.

**Request:**
```typescript
interface AnnounceRequest {
  peerId: string;
  roomId: string;
  userInfo: {
    displayName?: string;
    joinedAt: number;
    capabilities: string[]; // ['webrtc', 'geolocation', 'orientation']
  };
}
```

**Response:**
```typescript
interface AnnounceResponse {
  success: boolean;
  peerId: string;
  roomInfo: {
    roomId: string;
    activeUsers: number;
    created: number;
  };
}
```

**Example:**
```bash
curl -X POST "${API_BASE}/api/v1/rooms/mainstage_north/announce" \
  -H "Content-Type: application/json" \
  -d '{
    "peerId": "peer_abc123",
    "roomId": "mainstage_north",
    "userInfo": {
      "displayName": "MusicLover42",
      "joinedAt": 1672531200000,
      "capabilities": ["webrtc", "geolocation"]
    }
  }'
```

#### GET /api/v1/rooms/{roomId}/peers
Get list of active peers in a room.

**Response:**
```typescript
interface PeersResponse {
  peers: Array<{
    peerId: string;
    displayName?: string;
    joinedAt: number;
    lastSeen: number;
    capabilities: string[];
  }>;
  total: number;
}
```

#### DELETE /api/v1/rooms/{roomId}/peers/{peerId}
Remove peer from room (cleanup on disconnect).

**Response:**
```typescript
interface LeaveResponse {
  success: boolean;
  message: string;
}
```

### 1.2 WebRTC Signaling

#### POST /api/v1/signaling/offer
Send WebRTC offer to specific peer.

**Request:**
```typescript
interface SignalingOffer {
  targetPeerId: string;
  senderPeerId: string;
  roomId: string;
  offer: RTCSessionDescriptionInit;
}
```

#### POST /api/v1/signaling/answer
Send WebRTC answer to specific peer.

**Request:**
```typescript
interface SignalingAnswer {
  targetPeerId: string;
  senderPeerId: string;
  roomId: string;
  answer: RTCSessionDescriptionInit;
}
```

#### POST /api/v1/signaling/ice-candidate
Exchange ICE candidates.

**Request:**
```typescript
interface ICECandidate {
  targetPeerId: string;
  senderPeerId: string;
  roomId: string;
  candidate: RTCIceCandidateInit;
}
```

### 1.5 Room Discovery & QR Management

#### POST /api/v1/poi/create
Create a new Point of Interest.

**Request:**
```typescript
interface CreatePOIRequest {
  type: POIType;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  name: string;
  description?: string;
  roomId: string; // Associated room
}
```

**Response:**
```typescript
interface CreatePOIResponse {
  success: boolean;
  poiId: string;
  poi: PointOfInterest;
}
```

#### GET /api/v1/poi/nearby
Get nearby Points of Interest.

**Query Parameters:**
- `lat`: number (latitude)
- `lng`: number (longitude)
- `radius`: number (meters, default: 500)
- `types`: string[] (filter by POI types)

**Response:**
```typescript
interface NearbyPOIResponse {
  pois: PointOfInterest[];
  total: number;
  radius: number;
}
```

#### POST /api/v1/poi/{poiId}/crowd-update
Update crowd density for a POI.

**Request:**
```typescript
interface CrowdUpdateRequest {
  crowdLevel: CrowdDensity['level'];
  waitTime?: number;
  location?: { lat: number; lng: number }; // For validation
}
```

#### GET /api/v1/poi/{poiId}/crowd-history
Get crowd density history for analysis.

**Response:**
```typescript
interface CrowdHistoryResponse {
  poiId: string;
  history: Array<{
    crowdLevel: CrowdDensity['level'];
    waitTime?: number;
    timestamp: number;
    reportedBy: string;
  }>;
  analytics: {
    averageWaitTime: number;
    peakHours: number[];
    reliability: number;
  };
}
```

#### POST /api/v1/poi/{poiId}/confirm
Confirm or validate a POI location.

**Request:**
```typescript
interface ConfirmPOIRequest {
  confirmed: boolean;
  location?: { lat: number; lng: number }; // Current user location
  notes?: string;
}
```
Submit passive scanning data for crowd estimation.

**Request:**
```typescript
interface PassiveScanRequest {
  scannerLocation: { lat: number; lng: number };
  detectedDevices: Array<{
    anonymizedId: string;
    signalStrength: number;
    signalType: 'wifi' | 'bluetooth';
    estimatedDistance: number;
  }>;
  scanTimestamp: number;
  scanRadius: number;
}
```

**Response:**
```typescript
interface PassiveScanResponse {
  success: boolean;
  updatedCrowdEstimate?: CrowdDensity;
  contributingScans: number;
  estimatedQueueLength?: number;
}
```
Confirm or validate a POI location.

**Request:**
```typescript
interface ConfirmPOIRequest {
  confirmed: boolean;
  location?: { lat: number; lng: number }; // Current user location
  notes?: string;
}
```

#### GET /api/v1/qr/generate
Generate QR code data for room (admin endpoint).

**Query Parameters:**
- `roomId`: string
- `displayName`: string
- `coordinates`: string (lat,lng)

**Response:**
```typescript
interface QRGenerateResponse {
  qrData: QRData;
  qrCodeUrl: string; // Base64 data URL
  roomConfig: {
    maxUsers: number;
    features: string[];
    expiresAt?: number;
  };
}
```

#### POST /api/v1/qr/validate
Validate QR code data.

**Request:**
```typescript
interface QRValidateRequest {
  qrData: string; // JSON string from QR
  timestamp: number;
}
```

**Response:**
```typescript
interface QRValidateResponse {
  valid: boolean;
  roomData?: QRData;
  error?: string;
}
```

## 2. P2P Messaging Protocol

### 2.1 Message Types

```typescript
enum MessageType {
  CHAT = 'chat',
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  LOCATION_UPDATE = 'location_update',
  PING = 'ping',
  PONG = 'pong',
  MESH_DISCOVERY = 'mesh_discovery',
  ROUTE_UPDATE = 'route_update'
}

interface BaseMessage {
  id: string;
  type: MessageType;
  senderId: string;
  timestamp: number;
  roomId: string;
  ttl?: number; // Time to live for mesh routing
}
```

### 2.2 Chat Messages

```typescript
interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT;
  content: string;
  replyTo?: string; // Message ID being replied to
  mentions?: string[]; // User IDs mentioned
}
```

### 2.3 User Presence

```typescript
interface UserJoinMessage extends BaseMessage {
  type: MessageType.USER_JOIN;
  userInfo: {
    displayName: string;
    capabilities: string[];
    location?: {
      lat: number;
      lng: number;
      accuracy: number;
    };
  };
}

interface UserLeaveMessage extends BaseMessage {
  type: MessageType.USER_LEAVE;
  reason?: 'disconnect' | 'explicit' | 'timeout';
}
```

### 2.4 Location & Proximity (Phase 3)

```typescript
interface LocationUpdateMessage extends BaseMessage {
  type: MessageType.LOCATION_UPDATE;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
    heading?: number; // degrees
    speed?: number; // m/s
  };
  shareLevel: 'precise' | 'approximate' | 'zone'; // Privacy levels
}
```

### 2.7 Mesh Networking (Phase 2)

```typescript
interface POIMessage extends BaseMessage {
  type: MessageType.POI_CREATE | MessageType.POI_UPDATE | MessageType.CROWD_UPDATE;
  poiData?: PointOfInterest;
  crowdUpdate?: CrowdUpdate;
}

interface PointOfInterest {
  id: string;
  type: POIType;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  confirmed: boolean;
  confirmations: number;
  crowdData: CrowdDensity;
  lastUpdated: number;
}

enum POIType {
  BATHROOM = 'bathroom',
  BEER = 'beer',
  FOOD = 'food',
  WATER = 'water',
  MERCH = 'merch',
  ATM = 'atm',
  FIRST_AID = 'first_aid',
  STAGE = 'stage',
  ENTRANCE = 'entrance'
}

interface CrowdDensity {
  level: 'empty' | 'light' | 'moderate' | 'busy' | 'packed';
  waitTime?: number; // estimated minutes
  lastReported: number;
  reportCount: number;
  confidence: number; // 0-1 based on recent reports
}

interface CrowdUpdate {
  poiId: string;
  crowdLevel: CrowdDensity['level'];
  waitTime?: number;
  reportedBy: string;
  timestamp: number;
  location?: { lat: number; lng: number }; // For validation
}
```

```typescript
interface MeshDiscoveryMessage extends BaseMessage {
  type: MessageType.MESH_DISCOVERY;
  discoveredPeers: Array<{
    peerId: string;
    hops: number;
    signalStrength: 'strong' | 'medium' | 'weak';
    lastSeen: number;
  }>;
}

interface RouteUpdateMessage extends BaseMessage {
  type: MessageType.ROUTE_UPDATE;
  routes: Array<{
    targetPeerId: string;
    nextHop: string;
    hopCount: number;
    cost: number; // Routing cost
  }>;
}
```

## 3. Client-Side APIs

### 3.1 P2P Manager API

```typescript
interface P2PManagerAPI {
  // Connection management
  initialize(roomId: string, userInfo: UserInfo): Promise<string>; // Returns peerId
  connect(targetPeerId: string): Promise<boolean>;
  disconnect(peerId?: string): void; // Disconnect specific peer or all
  
  // Messaging
  sendMessage(message: ChatMessage): Promise<boolean>;
  broadcastMessage(message: BaseMessage): Promise<number>; // Returns success count
  
  // Events
  on(event: 'message', callback: (message: BaseMessage, senderId: string) => void): void;
  on(event: 'peer_connected', callback: (peerId: string) => void): void;
  on(event: 'peer_disconnected', callback: (peerId: string) => void): void;
  on(event: 'connection_status', callback: (status: ConnectionStatus) => void): void;
  
  // Status
  getConnectedPeers(): string[];
  getConnectionStatus(): ConnectionStatus;
  getNetworkTopology(): NetworkTopology; // Phase 2
}

interface ConnectionStatus {
  isConnected: boolean;
  connectedPeers: number;
  networkReach: 'isolated' | 'local' | 'mesh' | 'internet';
  signalStrength: 'none' | 'weak' | 'medium' | 'strong';
}
```

### 3.2 Message Store API

```typescript
interface MessageStoreAPI {
  // CRUD operations
  addMessage(message: BaseMessage): Promise<string>; // Returns message ID
  getMessage(id: string): Promise<BaseMessage | null>;
  getMessages(roomId: string, options?: QueryOptions): Promise<BaseMessage[]>;
  updateMessage(id: string, updates: Partial<BaseMessage>): Promise<boolean>;
  deleteMessage(id: string): Promise<boolean>;
  
  // Sync operations
  markSynced(messageId: string): Promise<void>;
  getUnsyncedMessages(roomId: string): Promise<BaseMessage[]>;
  clearRoom(roomId: string): Promise<void>;
  
  // Search & filtering
  searchMessages(roomId: string, query: string): Promise<BaseMessage[]>;
  getMessagesByType(roomId: string, type: MessageType): Promise<BaseMessage[]>;
  getMessagesAfter(roomId: string, timestamp: number): Promise<BaseMessage[]>;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  since?: number;
  until?: number;
  types?: MessageType[];
}
```

### 3.3 QR Scanner API

```typescript
interface QRScannerAPI {
  // Scanner control
  startScanning(): Promise<void>;
  stopScanning(): void;
  isScanning(): boolean;
  
  // Events
  on(event: 'scan_result', callback: (qrData: QRData) => void): void;
  on(event: 'scan_error', callback: (error: Error) => void): void;
  
  // Camera management
  switchCamera(): Promise<void>;
  getAvailableCameras(): Promise<MediaDeviceInfo[]>;
  setCamera(deviceId: string): Promise<void>;
}
```

### 3.6 Proximity API (Phase 3)

```typescript
interface POIManagerAPI {
  // POI Management
  createPOI(poi: Omit<PointOfInterest, 'id' | 'createdAt'>): Promise<string>;
  updatePOI(poiId: string, updates: Partial<PointOfInterest>): Promise<boolean>;
  deletePOI(poiId: string): Promise<boolean>;
  confirmPOI(poiId: string, confirmed: boolean): Promise<boolean>;
  
  // Location queries
  getNearbyPOIs(radius?: number, types?: POIType[]): Promise<PointOfInterest[]>;
  getPOIById(poiId: string): Promise<PointOfInterest | null>;
  searchPOIs(query: string, location?: LocationData): Promise<PointOfInterest[]>;
  
  // Crowd density
  updateCrowdLevel(poiId: string, level: CrowdDensity['level'], waitTime?: number): Promise<void>;
  getCrowdDensity(poiId: string): Promise<CrowdDensity>;
  getCrowdHistory(poiId: string, timeRange?: number): Promise<CrowdReport[]>;
  
  // Events
  on(event: 'poi_created', callback: (poi: PointOfInterest) => void): void;
  on(event: 'poi_updated', callback: (poiId: string, updates: Partial<PointOfInterest>) => void): void;
  on(event: 'crowd_updated', callback: (poiId: string, crowdData: CrowdDensity) => void): void;
  
  // Passive crowd detection
  startPassiveScanning(): Promise<void>;
  stopPassiveScanning(): void;
  submitPassiveScanData(poiId: string, scanData: PassiveScanData): Promise<boolean>;
  
  // Analytics
  getPOIAnalytics(poiId: string): Promise<POIAnalytics>;
  getBusiestTimes(poiType: POIType): Promise<BusyTimeAnalytics>;
  getQueueAnalytics(poiId: string): Promise<QueueAnalytics>;
}

interface QueueAnalytics {
  poiId: string;
  averageQueueLength: number;
  peakQueueTimes: Array<{ hour: number; avgLength: number }>;
  queueMovementRate: number; // people per minute
  estimatedServiceTime: number; // average time per person
  lastUpdated: number;
}

interface PassiveScanData {
  scannerLocation: { lat: number; lng: number };
  detectedDevices: Array<{
    anonymizedId: string;
    signalStrength: number;
    signalType: 'wifi' | 'bluetooth';
    estimatedDistance: number;
  }>;
  scanTimestamp: number;
  scanRadius: number;
}

interface POIAnalytics {
  poiId: string;
  totalReports: number;
  averageWaitTime: number;
  peakHours: Array<{ hour: number; avgCrowdLevel: number }>;
  reliability: number; // 0-1 based on report consistency
  lastWeekTrend: 'increasing' | 'decreasing' | 'stable';
}

interface BusyTimeAnalytics {
  poiType: POIType;
  hourlyAverages: Array<{
    hour: number; // 0-23
    averageCrowdLevel: number;
    averageWaitTime: number;
    confidence: number;
  }>;
  recommendations: Array<{
    timeRange: string; // "14:00-16:00"
    suggestion: string; // "Best time to visit"
    crowdLevel: CrowdDensity['level'];
  }>;
}

interface CrowdReport {
  poiId: string;
  crowdLevel: CrowdDensity['level'];
  waitTime?: number;
  reportedBy: string;
  timestamp: number;
  location: { lat: number; lng: number };
  verified: boolean;
}
```

```typescript
interface ProximityAPI {
  // Location services
  startLocationTracking(): Promise<void>;
  stopLocationTracking(): void;
  getCurrentLocation(): Promise<LocationData>;
  
  // Compass functionality
  startCompass(): Promise<void>;
  stopCompass(): void;
  getHeading(): Promise<number>; // degrees
  
  // Proximity detection
  getNearbyUsers(): Promise<ProximityUser[]>;
  estimateDistance(peerId: string): Promise<number>; // meters
  calculateBearing(peerId: string): Promise<number>; // degrees
  
  // Events
  on(event: 'location_update', callback: (location: LocationData) => void): void;
  on(event: 'heading_update', callback: (heading: number) => void): void;
  on(event: 'proximity_update', callback: (users: ProximityUser[]) => void): void;
}

interface ProximityUser {
  peerId: string;
  displayName: string;
  distance: number; // meters
  bearing: number; // degrees
  signalStrength: 'strong' | 'medium' | 'weak';
  lastSeen: number;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
```

## 4. Error Handling

### 4.1 HTTP Error Codes

```typescript
enum APIErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  PEER_NOT_FOUND = 'PEER_NOT_FOUND',
  INVALID_QR_DATA = 'INVALID_QR_DATA',
  ROOM_FULL = 'ROOM_FULL',
  SIGNALING_FAILED = 'SIGNALING_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

interface APIError {
  error: APIErrorCode;
  message: string;
  details?: any;
  timestamp: number;
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid data)
- `404`: Not Found (room/peer doesn't exist)
- `409`: Conflict (room full, duplicate peer)
- `429`: Rate Limited
- `500`: Internal Server Error

### 4.2 P2P Error Types

```typescript
enum P2PErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  PEER_UNREACHABLE = 'PEER_UNREACHABLE',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  MESH_ROUTE_FAILED = 'MESH_ROUTE_FAILED'
}

interface P2PError extends Error {
  type: P2PErrorType;
  peerId?: string;
  details?: any;
}
```

## 5. Rate Limiting & Quotas

### 5.1 Signaling Server Limits

```typescript
const RATE_LIMITS = {
  announcements: '10/minute',
  signaling: '100/minute',
  peer_discovery: '30/minute',
  qr_generation: '5/minute' // Admin only
};

const QUOTAS = {
  max_rooms_per_ip: 5,
  max_peers_per_room: 50,
  message_size_limit: '10KB',
  room_lifetime: '24 hours'
};
```

### 5.2 P2P Limits

```typescript
const P2P_LIMITS = {
  max_connections: 15,
  max_message_size: 16384, // bytes
  message_queue_size: 1000,
  ping_interval: 30000, // ms
  connection_timeout: 10000 // ms
};
```

## 6. Authentication & Security (Future)

### 6.1 Room Access Control

```typescript
interface RoomSecurity {
  requiresPassword: boolean;
  allowedDomains?: string[];
  maxUsers: number;
  ephemeral: boolean; // Auto-delete after event
  moderatedUsers?: string[]; // Peer IDs with mod privileges
}
```

### 6.2 Message Encryption

```typescript
interface EncryptedMessage {
  encrypted: true;
  algorithm: 'AES-GCM' | 'ChaCha20-Poly1305';
  ciphertext: string; // Base64
  nonce: string; // Base64
  authTag: string; // Base64
}
```

## 7. Monitoring & Analytics

### 7.1 Metrics Collection

```typescript
interface Metrics {
  connections: {
    total_attempts: number;
    successful_connections: number;
    failed_connections: number;
    average_connection_time: number;
  };
  messages: {
    total_sent: number;
    total_received: number;
    delivery_rate: number;
    average_latency: number;
  };
  rooms: {
    active_rooms: number;
    peak_concurrent_users: number;
    average_session_duration: number;
  };
}
```

### 7.2 Health Check Endpoints

#### GET /api/v1/health
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  uptime: number;
  metrics: {
    active_connections: number;
    messages_per_second: number;
    error_rate: number;
  };
}
```

## 8. Development & Testing

### 8.1 Mock Data

```typescript
const MOCK_QR_DATA: QRData = {
  roomId: "test_room_001",
  displayName: "Test Stage",
  timestamp: Date.now(),
  version: "1.0.0",
  coordinates: { lat: 40.7128, lng: -74.0060 }
};

const MOCK_USERS = [
  { peerId: "peer_001", displayName: "Alice" },
  { peerId: "peer_002", displayName: "Bob" },
  { peerId: "peer_003", displayName: "Charlie" }
];
```

### 8.2 Test Endpoints

#### POST /api/v1/test/simulate-users
Create simulated users for testing.

#### GET /api/v1/test/network-topology
Get current network topology for debugging.

---

## API Versioning

All APIs use semantic versioning with the format `/api/v{major}`. Breaking changes increment the major version. The current stable version is `v1`.

## SDKs & Libraries

The following libraries are recommended for implementing these APIs:

- **WebRTC**: PeerJS, simple-peer
- **HTTP Client**: Fetch API, Axios
- **QR Codes**: @zxing/library, qrcode
- **Database**: Dexie.js (IndexedDB)
- **Geolocation**: Web Geolocation API
- **Encryption**: Web Crypto API, tweetnacl