'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { useWebSocketChat } from './use-websocket-chat';
import { useCustomWebRTC } from './use-custom-webrtc';
import { io } from 'socket.io-client';
import { ServerUtils } from '@/utils/server-utils';

// Circuit breaker for intelligent routing
const createCircuitBreaker = () => {
  let state = {
    webSocketFailures: 0,
    p2pFailures: 0,
    lastWebSocketFailure: 0,
    lastP2PFailure: 0,
    isWebSocketOpen: false,
    isP2POpen: false,
  };
  
  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 30000; // 30 seconds
  
  return {
    recordWebSocketFailure() {
      state.webSocketFailures++;
      state.lastWebSocketFailure = Date.now();
      
      if (state.webSocketFailures >= FAILURE_THRESHOLD) {
        state.isWebSocketOpen = true;
        console.log('🚫 WebSocket circuit breaker opened');
      }
    },
    
    recordP2PFailure() {
      state.p2pFailures++;
      state.lastP2PFailure = Date.now();
      
      if (state.p2pFailures >= FAILURE_THRESHOLD) {
        state.isP2POpen = true;
        console.log('🚫 P2P circuit breaker opened');
      }
    },
    
    recordWebSocketSuccess