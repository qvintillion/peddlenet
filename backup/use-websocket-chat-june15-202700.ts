'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { NetworkUtils } from '@/utils/network-utils';
import { MessagePersistence } from '@/utils/message-persistence';
import { ServerUtils } from '@/utils/server-utils';
import { unreadMessageManager } from '@/hooks/use-unread-messages';

// Enhanced connection resilience with Cloud Run optimizations
const createEnhancedConnectionResilience = () => {
  let circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
    lastSuccessTime: 0
  };
  
  let backoffState = {
    currentAttempt: 0,
    lastAttemptTime: 0
  };
  
  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 8000;
  const SUCCESS_THRESHOLD = 2;
  const MAX_BACKOFF = 12000;
  const COLD_START_BACKOFF = 2000;
  
  return {
    shouldAllowConnection(): boolean {
      const now = Date.now();
      const timeSinceLastFailure = now - circuitBreaker.lastFailureTime;
      
      if (circuitBreaker.isOpen) {
        if (timeSinceLastFailure > RECOVERY_TIMEOUT) {
          console.log('🔄 Circuit breaker attempting recovery - allowing test connection');
          return true;
        }
        console.log('🚫 Circuit breaker open - blocking connection');
        return false;
      }
      
      return true;
    },
    
    recordSuccess(): void {
      const now = Date.now();
      circuitBreaker.successCount++;
      circuitBreaker.lastSuccessTime = now;
      backoffState.currentAttempt = 0;
      
      if (circuitBreaker.isOpen && circuitBreaker.successCount >= SUCCESS_THRESHOLD) {
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
        circuitBreaker.successCount = 0;
        console.log('✅ Circuit breaker closed - connection stable');
      }
    },
    
    recordFailure(): void {
      const now = Date.now();
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = now;
      circuitBreaker.successCount = 0;
      
      if (circuitBreaker.failureCount >= FAILURE_THRESHOLD) {
        circuitBreaker.isOpen = true;
        console.log(`⚡ Circuit breaker opened after ${circuitBreaker.failureCount} failures`);
      }
    },
    
    getExponentialBackoffDelay(attempt?: number, isColdStart?: boolean): number {
      if (isColdStart) {
        const jitter = Math.random() * 500;
        const delay = COLD_START_BACKOFF + jitter;
        console.log(`❄️ Cold start backoff: ${Math.round(delay)}ms`);
        return delay;
      }
      
      const currentAttempt = attempt !== undefined ? attempt : backoffState.currentAttempt;
      const baseDelay = 1000;
      const jitter = Math.random() * 500;
      
      const delay = Math.min(baseDelay * Math.pow(1.5, currentAttempt) + jitter, MAX_BACKOFF);
      backoffState.currentAttempt = currentAttempt + 1;
      backoffState.lastAttemptTime = Date.now();
      
      console.log(`⏱️ Enhanced backoff: attempt ${currentAttempt}, delay ${Math.round(delay)}ms`);
      return delay;
    },
    
    getAdaptiveTimeout(): number {
      const recentFailures = circuitBreaker.failureCount;
      const baseTimeout = 15000; // Increased for Cloud Run cold starts
      
      if (recentFailures > 1) {
        return Math.min(baseTimeout * 1.8, 30000); // Up to 30s for cold starts
      }
      
      return baseTimeout;
    },
    
    reset(): void {
      circuitBreaker = {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        lastSuccessTime: 0
      };
      backoffState = {
        currentAttempt: 0,
        lastAttemptTime: 0
      };
      console.log('🔄 Circuit breaker reset for Cloud Run compatibility');
    },
    
    getState() {
      return {
        circuitBreaker: { ...circuitBreaker },
        backoffState: { ...backoffState }
      };
    }
  };
};

const EnhancedConnectionResilience = createEnhancedConnectionResilience();

// Mobile-aware WebSocket URL detection
const getWebSocketServerUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Check for detected IP from mobile dev script
  const detectedIP = process.env.NEXT_PUBLIC_DETECTED_IP;
  
  // Local development - handle mobile access to dev server
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If we have a detected IP and we're on localhost, use the detected IP for WebSocket
    if (detectedIP && detectedIP !== 'localhost') {
      console.log(`📱 Using detected IP for WebSocket: ${detectedIP}`);
      return `ws://${detectedIP}:3001`;
    }
    return `ws://localhost:3001`;
  }
  
  // Mobile accessing dev server via IP address (npm run dev:mobile)
  if (port === '3000' || hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./)) {
    // Use the same hostname for WebSocket (the detected IP)
    console.log(`📱 Using mobile IP for WebSocket: ${hostname}`);
    return `ws://${hostname}:3001`;
  }
  
  // Firebase hosting - use Cloud Run WebSocket server
  if (hostname.includes('firebase') || hostname.includes('web.app')) {
    return 'wss://websocket-server-956191635250.us-central1.run.app';
  }
  
  // Vercel production
  if (hostname.includes('vercel.app') || hostname === 'peddlenet.app') {
    return 'wss://websocket-server-956191635250.us-central1.run.app';
  }
  
  // Default fallback
  return 'wss://websocket-server-956191635250.us-central1.run.app';
};

// Health monitoring with Cloud Run awareness
const createHealthMonitor = () => {
  let healthState = {
    lastPing: 0,
    lastPong: 0,
    pingCount: 0,
    pongCount: 0,
    averageLatency: 0,
    connectionQuality: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown',
    coldStartDetected: false
  };
  
  return {
    recordPing(): void {
      healthState.lastPing = Date.now();
      healthState.pingCount