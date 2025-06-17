export interface QRData {
  roomId: string;
  displayName: string;
  timestamp: number;
  version: string;
  coordinates: {
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
  
  // NEW: Optional room discovery status
  roomDiscovery: {
    isConnected: boolean;
    discoveredPeers: number;
    connectedPeers: number;
  };
}
