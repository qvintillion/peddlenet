# Festival Chat - Complete Build Process Guide

## 🚀 Project Setup & Foundation

### Initial Project Creation

```bash
# Create Next.js project with recommended configuration
npx create-next-app@latest festival-chat --typescript --tailwind --app --src-dir

cd festival-chat

# When prompted for import alias, choose: @/*
```

### Core Dependencies Installation

```bash
# Core P2P and QR functionality
npm install peerjs qrcode jsqr clsx lodash

# Type definitions
npm install -D @types/qrcode @types/lodash

# PWA support (optional for Phase 1)
npm install next-pwa

# Enhanced ESLint configuration
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-import
```

### Project Structure Setup

```bash
# Create core directory structure
mkdir -p src/{components,lib,hooks,types,utils}
mkdir -p src/components/{ui,chat,compass,poi}
mkdir -p src/lib/{mesh,poi}
mkdir -p public/icons

# Create initial files
touch src/lib/types.ts
touch src/lib/constants.ts
touch src/utils/qr-utils.ts
touch src/hooks/use-p2p.ts
```

## 📁 Final Working Project Structure

```
festival-chat/
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── scan/page.tsx               # QR Scanner
│   │   ├── chat/[roomId]/page.tsx      # Chat room with manual P2P connection
│   │   ├── admin/page.tsx              # QR Generator (admin)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── DebugPanel.tsx              # P2P connection debugging
│   │   └── ui/                         # Future UI components
│   ├── lib/
│   │   ├── constants.ts                # App configuration
│   │   └── types.ts                    # TypeScript interfaces
│   ├── hooks/
│   │   └── use-p2p.ts                  # Fixed P2P connection hook
│   └── utils/
│       └── qr-utils.ts                 # QR generation and scanning
├── .eslintrc.json
├── next.config.js
├── tsconfig.json
├── package.json
└── P2P-TESTING-GUIDE.md               # Comprehensive testing instructions
```

## ⚙️ Essential Configuration Files

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "tunnel": "ngrok http 3000"
  }
}
```

## 🎯 Phase 1: Working MVP Implementation

### 1. Core Types (`src/lib/types.ts`)

```typescript
export interface QRData {
  roomId: string;
  displayName: string;
  timestamp: number;
  version: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Message {
  id: string;
  type: 'chat' | 'system';
  content: string;
  sender: string;
  roomId: string;
  timestamp: number;
  synced: boolean;
}

export interface User {
  id: string;
  displayName: string;
  joinedAt: number;
  capabilities: string[];
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectedPeers: number;
  networkReach: 'isolated' | 'local' | 'global';
  signalStrength: 'none' | 'weak' | 'medium' | 'strong';
}
```

### 2. App Constants (`src/lib/constants.ts`)

```typescript
export const APP_CONFIG = {
  name: 'Festival Chat',
  version: '1.0.0',
  maxConnections: 10,
  messageTimeout: 30000,
  scanTimeout: 10000,
  connectionTimeout: 10000,
} as const;

export const QR_CONFIG = {
  size: 256,
  margin: 4,
  errorCorrectionLevel: 'M' as const,
} as const;

export const MESH_CONFIG = {
  maxHops: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
} as const;
```

### 3. QR Code Utilities (`src/utils/qr-utils.ts`)

```typescript
import QRCode from 'qrcode';
import jsQRImport from 'jsqr';
import type { QRData } from '@/lib/types';

const jsQR = (jsQRImport as any).default ? (jsQRImport as any).default : jsQRImport;

export async function generateQRCode(data: QRData): Promise<string> {
  try {
    return await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function parseQRData(qrString: string): QRData {
  try {
    const data = JSON.parse(qrString);
    if (!data.roomId || !data.displayName) {
      throw new Error('Invalid QR data structure');
    }
    return data as QRData;
  } catch (error) {
    throw new Error('Failed to parse QR code data');
  }
}

export class QRScanner {
  private stream: MediaStream | null = null;
  private scanning: boolean = false;
  private canvas: HTMLCanvasElement | null = null;
  public onResult: ((result: string) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;

  async start(video: HTMLVideoElement): Promise<void> {
    try {
      this.scanning = true;
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      });
      video.srcObject = this.stream;
      await video.play();

      this.canvas = document.createElement('canvas');
      const ctx = this.canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const scan = async () => {
        if (!this.scanning) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          this.canvas!.width = video.videoWidth;
          this.canvas!.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const imageData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { 
            inversionAttempts: 'attemptBoth' 
          });
          if (code && code.data) {
            if (this.onResult) this.onResult(code.data);
            return;
          }
        }
        requestAnimationFrame(scan);
      };
      scan();
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      }
      throw error;
    }
  }

  stop(video?: HTMLVideoElement): void {
    this.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (video && video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    this.canvas = null;
  }
}
```

### 4. Fixed P2P Hook (`src/hooks/use-p2p.ts`)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { Message, ConnectionStatus } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';

export function useP2P(roomId: string) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  
  // Use refs to avoid stale closures
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const peerRef = useRef<Peer | null>(null);

  // Update refs when state changes
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  const updateStatus = useCallback(() => {
    const connectedCount = connectionsRef.current.size;
    setStatus({
      isConnected: connectedCount > 0,
      connectedPeers: connectedCount,
      networkReach: connectedCount > 0 ? 'local' : 'isolated',
      signalStrength: connectedCount > 0 ? 'strong' : 'none',
    });
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    if (connectionsRef.current.size >= APP_CONFIG.maxConnections) {
      console.log('Max connections reached, rejecting:', conn.peer);
      conn.close();
      return;
    }

    console.log('Setting up connection with:', conn.peer);

    const handleData = (data: any) => {
      if (data && typeof data === 'object' && 'type' in data) {
        const message = data as Message;
        console.log('Received message:', message);
        messageHandlersRef.current.forEach(handler => handler(message));
      }
    };

    const handleOpen = () => {
      console.log('Connection opened with:', conn.peer);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(conn.peer, conn);
        return newConnections;
      });
      updateStatus();
    };

    const handleClose = () => {
      console.log('Connection closed with:', conn.peer);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('Connection error with', conn.peer, ':', error);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    conn.on('data', handleData);
    conn.on('open', handleOpen);
    conn.on('close', handleClose);
    conn.on('error', handleError);

    // If connection is already open, update immediately
    if (conn.open) {
      handleOpen();
    }
  }, [updateStatus]);

  const handleIncomingConnection = useCallback((conn: DataConnection) => {
    console.log('Incoming connection from:', conn.peer);
    setupConnection(conn);
  }, [setupConnection]);

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<void> => {
    if (!peerRef.current || connectionsRef.current.has(targetPeerId) || targetPeerId === peerId) {
      return;
    }

    try {
      console.log('Attempting to connect to peer:', targetPeerId);
      const conn = peerRef.current.connect(targetPeerId);
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, APP_CONFIG.connectionTimeout);

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log('Successfully connected to:', targetPeerId);
          setupConnection(conn);
          resolve();
        });

        conn.on('error', (error) => {
          clearTimeout(timeout);
          console.error('Failed to connect to peer:', targetPeerId, error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to connect to peer:', targetPeerId, error);
      throw error;
    }
  }, [peerId, setupConnection]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    let sentCount = 0;
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(fullMessage);
          sentCount++;
        } catch (error) {
          console.error('Failed to send message to', conn.peer, ':', error);
        }
      }
    });

    console.log(`Message sent to ${sentCount} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);

    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  const initialize = useCallback(async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      console.log('Initializing P2P for room:', roomId);
      const newPeer = new Peer();
      
      const timeout = setTimeout(() => {
        reject(new Error('P2P initialization timeout'));
      }, APP_CONFIG.connectionTimeout);

      newPeer.on('open', (id) => {
        clearTimeout(timeout);
        console.log('P2P initialized with ID:', id);
        setPeerId(id);
        setPeer(newPeer);
        peerRef.current = newPeer;
        
        // Store peer ID in localStorage for this room
        localStorage.setItem(`peerId_${roomId}`, id);
        
        resolve(id);
      });

      newPeer.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Peer initialization error:', error);
        reject(error);
      });

      newPeer.on('connection', handleIncomingConnection);

      newPeer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        if (!newPeer.destroyed) {
          newPeer.reconnect();
        }
      });

      newPeer.on('close', () => {
        console.log('Peer connection closed');
        setPeer(null);
        setPeerId(null);
        setConnections(new Map());
        updateStatus();
      });
    });
  }, [roomId, handleIncomingConnection, updateStatus]);

  // Initialize peer when component mounts
  useEffect(() => {
    if (roomId) {
      initialize().catch((error) => {
        console.error('Failed to initialize P2P:', error);
      });
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up P2P connections');
      connectionsRef.current.forEach(conn => {
        try {
          conn.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      });
      
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.destroy();
      }
    };
  }, [roomId, initialize]);

  return {
    peerId,
    status,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
  };
}
```

### 5. Debug Panel Component (`src/components/DebugPanel.tsx`)

```typescript
import React from 'react';

interface DebugPanelProps {
  peerId: string | null;
  connectedPeers: string[];
  status: {
    isConnected: boolean;
    connectedPeers: number;
    networkReach: string;
    signalStrength: string;
  };
  roomId: string;
}

export function DebugPanel({ peerId, connectedPeers, status, roomId }: DebugPanelProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <div className="mb-2 font-bold">Debug Info</div>
      <div className="space-y-1">
        <div><strong>Room:</strong> {roomId}</div>
        <div><strong>My Peer ID:</strong> {peerId || 'Not connected'}</div>
        <div><strong>Status:</strong> {status.isConnected ? 'Connected' : 'Disconnected'}</div>
        <div><strong>Peers:</strong> {status.connectedPeers}</div>
        <div><strong>Network:</strong> {status.networkReach}</div>
        <div><strong>Signal:</strong> {status.signalStrength}</div>
        {connectedPeers.length > 0 && (
          <div>
            <strong>Connected to:</strong>
            {connectedPeers.map(id => (
              <div key={id} className="ml-2 font-mono text-xs">
                {id.substring(0, 8)}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🧪 Complete Testing Workflow

### Essential Testing Commands

```bash
# Start development server
npm run dev

# Start ngrok tunnel (separate terminal)
ngrok http 3000

# Test URLs:
# Desktop: http://localhost:3000/admin
# Mobile: https://[ngrok-url]/scan
```

### Manual P2P Connection Testing

1. **Generate QR Code (Desktop):**
   - Go to `http://localhost:3000/admin`
   - Enter display name → Generate QR → Join Chat Room

2. **Scan QR Code (Mobile):**
   - Open ngrok URL on phone
   - Scan QR code → Join same chat room

3. **Manual Peer Connection:**
   - Copy Peer ID from debug panel (bottom right)
   - Use "Connect to Peer" button to exchange IDs
   - Test messaging between devices

### Debug Information to Monitor

- **Browser Console:** P2P initialization messages
- **Debug Panel:** Peer IDs, connection status, connected peers count
- **Connection Indicator:** Green/red dot in chat header
- **Message Flow:** Messages appearing on both devices

## 🎯 Key Differences from Original Plan

### What Changed:
1. **Manual Peer Discovery:** Phase 1 uses manual peer ID exchange instead of automatic discovery
2. **Simplified Architecture:** Removed complex mesh routing for MVP
3. **Better Error Handling:** Added proper connection state management and cleanup
4. **Debug Tools:** Added comprehensive debugging panel and logging
5. **Realistic Testing:** Focus on manual testing with ngrok tunnel

### Why These Changes:
- **Automatic peer discovery requires signaling server** (Phase 2 feature)
- **Manual connection is normal for P2P apps** and works reliably
- **Simplified architecture reduces bugs** and makes testing easier
- **Debug tools essential** for understanding P2P connection state

## 🚀 Success Criteria for MVP

**Working P2P Chat Must Have:**
- [ ] QR codes generate and scan successfully
- [ ] Peer IDs appear in debug panel
- [ ] Manual peer connection works reliably
- [ ] Messages flow instantly between devices
- [ ] Connection survives network changes
- [ ] Works on both desktop and mobile browsers

**Next Steps After MVP Works:**
- Deploy custom PeerJS signaling server (Phase 2)
- Add automatic peer discovery (Phase 2)
- Implement mesh networking (Phase 2)
- Add proximity features (Phase 3)

This implementation provides a **solid foundation** that actually works and can be extended into the full festival chat system! 🎵