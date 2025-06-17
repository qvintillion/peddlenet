'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID, generateShortId } from '@/utils/peer-utils';

declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any;

interface PeerConfig {
  host?: string;
  port?: number;
  path?: string;
  key?: string;
  secure?: boolean;
  config?: RTCConfiguration;
}

interface QueuedMessage extends Message {
  retryCount?: number;
  queuedAt: number;
}

export function useP2POptimized(roomId: string, displayName?: string) {
  const [peer, setPeer] = useState<any | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const effectiveDisplayName = displayName || 
    (typeof window !== 'undefined' ? localStorage.getItem('displayName') || 'Anonymous' : 'Anonymous');
  
  // Refs for stable references
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const peerRef = useRef<any | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const connection