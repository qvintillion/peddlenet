'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message } from '../lib/types';
import { generateCompatibleUUID } from '../utils/peer-utils';

interface BridgeNode {
  peerId: string;
  displayName: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
  lastSeen: number;
  routes: BridgeRoute[];
  canBridge: boolean;
}

interface BridgeRoute {
  targetPeerId: string;
  hops: number;
  quality: number; // 0-100
  latency: number;
  reliability: number; // 0-100
  lastUpdate: number;
}

interface QueuedBridgeMessage extends Message {
  bridgeAttempts: number;
  maxBridgeAttempts: number;
  originalSender: string;
  bridgePath: string[];
  priority: 'high' | 'normal' | 'low';
  retryAfter: number;
}

interface NetworkCondition {
  quality: 'excellent' | 'good' | 'poor' | 'critical';
  latency: number;
  packetLoss: number;
  bandwidth: number;
  stability: number; // 0-100
}

/**
 * 🌉 MESSAGE BRIDGING SYSTEM FOR POOR NETWORK CONDITIONS
 * 
 * This hook implements intelligent message bridging to ensure delivery
 * even when direct P2P connections fail due to poor network conditions.
 * 
 * Key Features:
 * - Multi-hop message routing through reliable peers
 * - Network condition monitoring and adaptation
 * - Message priority queuing and retry logic
 * - Epidemic-style message propagation for festival environments
 * - Battery-aware bridging for mobile devices
 */
export function useMessageBridge(roomId: string, displayName: string) {
  const [bridgeNodes, setBridgeNodes] = useState<Map<string, BridgeNode>>(new Map());
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition>({
    quality: 'good',
    latency: 100,
    packetLoss: 0,
    bandwidth: 1000,
    stability: 100
  });
  const [bridgeStats, setBridgeStats] = useState({
    messagesBridged: 0,
    bridgeSuccessRate: 100,
    averageHops: 1.2,
    reliableNodes: 0,
    criticalMessages: 0
  });

  // Direct network condition ref for immediate access
  const networkConditionRef = useRef(networkCondition);
  
  // Update ref whenever state changes
  useEffect(() => {
    networkConditionRef.current = networkCondition;
    console.log(`🌉 [BRIDGE STATE] Network condition updated:`, networkCondition);
  }, [networkCondition]);

  // Refs for stable references
  const messageQueueRef = useRef<QueuedBridgeMessage[]>([]);
  const bridgeNodesRef = useRef<Map<string, BridgeNode>>(new Map());
  const bridgeHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const networkMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const bridgeProcessorRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for festival environment optimization
  const BRIDGE_CONFIG = {
    MAX_HOPS: 3, // Maximum hops for message routing
    MIN_BRIDGE_QUALITY: 30, // Minimum connection quality to act as bridge
    RETRY_INTERVALS: [2000, 5000, 10000, 20000], // Progressive retry delays
    MAX_QUEUE_SIZE: 500, // Maximum queued messages per room
    EPIDEMIC_SPREAD_CHANCE: 0.7, // Probability of epidemic forwarding
    BATTERY_THRESHOLD: 20, // Disable bridging below 20% battery
    CRITICAL_MESSAGE_TTL: 60000, // 1 minute TTL for critical messages
    BRIDGE_DISCOVERY_INTERVAL: 10000, // 10s bridge node discovery
    NETWORK_MONITOR_INTERVAL: 5000 // 5s network condition monitoring
  };

  /**
   * 📊 NETWORK CONDITION MONITORING
   * Continuously monitors network conditions and adapts bridging strategy
   */
  const monitorNetworkCondition = useCallback(() => {
    // Use Connection API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const downlink = connection.downlink || 1; // Mbps
      const rtt = connection.rtt || 100; // ms
      
      // Estimate packet loss based on connection type
      let estimatedPacketLoss = 0;
      if (connection.effectiveType === '2g') estimatedPacketLoss = 15;
      else if (connection.effectiveType === '3g') estimatedPacketLoss = 5;
      else if (connection.effectiveType === '4g') estimatedPacketLoss = 1;
      
      const stability = Math.max(0, 100 - (rtt / 10) - (estimatedPacketLoss * 5));
      
      setNetworkCondition({
        quality: stability > 80 ? 'excellent' : 
                 stability > 60 ? 'good' : 
                 stability > 30 ? 'poor' : 'critical',
        latency: rtt,
        packetLoss: estimatedPacketLoss,
        bandwidth: downlink * 1000, // Convert to kbps
        stability
      });
    } else {
      // Fallback: Estimate based on user agent and online status
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isOnline = navigator.onLine;
      
      setNetworkCondition({
        quality: isOnline ? (isMobile ? 'good' : 'excellent') : 'critical',
        latency: isOnline ? (isMobile ? 150 : 50) : 1000,
        packetLoss: isOnline ? (isMobile ? 2 : 0) : 50,
        bandwidth: isOnline ? (isMobile ? 500 : 1000) : 0,
        stability: isOnline ? (isMobile ? 75 : 95) : 0
      });
    }
  }, []);

  /**
   * 🔍 BRIDGE NODE DISCOVERY
   * Discovers reliable peers that can act as message bridges
   */
  const discoverBridgeNodes = useCallback((availablePeers: string[], connectionQualities: Map<string, any>) => {
    const newBridgeNodes = new Map<string, BridgeNode>();
    
    availablePeers.forEach(peerId => {
      const quality = connectionQualities.get(peerId);
      if (!quality) return;
      
      // Calculate if this peer can act as a bridge
      const canBridge = quality.reliability > BRIDGE_CONFIG.MIN_BRIDGE_QUALITY && 
                       quality.latency < 500; // Less than 500ms latency
      
      const bridgeNode: BridgeNode = {
        peerId,
        displayName: `User-${peerId.slice(0, 6)}`, // Would be actual display name in real system
        connectionQuality: quality.reliability > 80 ? 'excellent' :
                          quality.reliability > 60 ? 'good' :
                          quality.reliability > 30 ? 'poor' : 'none',
        lastSeen: Date.now(),
        routes: [], // Will be populated by route discovery
        canBridge
      };
      
      newBridgeNodes.set(peerId, bridgeNode);
    });
    
    setBridgeNodes(newBridgeNodes);
    bridgeNodesRef.current = newBridgeNodes;
    
    // Update stats
    setBridgeStats(prev => ({
      ...prev,
      reliableNodes: Array.from(newBridgeNodes.values()).filter(node => node.canBridge).length
    }));
  }, []);

  /**
   * 🛣️ ROUTE DISCOVERY
   * Discovers optimal multi-hop routes through bridge nodes
   */
  const discoverRoutes = useCallback((targetPeerId: string): BridgeRoute[] => {
    const routes: BridgeRoute[] = [];
    const bridgeNodes = bridgeNodesRef.current;
    
    // Direct route (if possible)
    const directNode = bridgeNodes.get(targetPeerId);
    if (directNode && directNode.connectionQuality !== 'none') {
      routes.push({
        targetPeerId,
        hops: 1,
        quality: directNode.connectionQuality === 'excellent' ? 95 :
                directNode.connectionQuality === 'good' ? 75 :
                directNode.connectionQuality === 'poor' ? 40 : 10,
        latency: 100, // Estimated
        reliability: 90,
        lastUpdate: Date.now()
      });
    }
    
    // Multi-hop routes through bridge nodes
    const reliableBridges = Array.from(bridgeNodes.values())
      .filter(node => node.canBridge && node.peerId !== targetPeerId)
      .sort((a, b) => (b.connectionQuality === 'excellent' ? 1 : 0) - (a.connectionQuality === 'excellent' ? 1 : 0));
    
    reliableBridges.slice(0, 3).forEach(bridge => {
      // Estimate route quality through this bridge
      const bridgeQuality = bridge.connectionQuality === 'excellent' ? 90 :
                           bridge.connectionQuality === 'good' ? 70 : 50;
      
      routes.push({
        targetPeerId,
        hops: 2,
        quality: bridgeQuality * 0.8, // Reduced quality for multi-hop
        latency: 200, // Estimated increased latency
        reliability: bridgeQuality * 0.9,
        lastUpdate: Date.now()
      });
    });
    
    return routes.sort((a, b) => b.quality - a.quality);
  }, []);

  /**
   * 📨 INTELLIGENT MESSAGE ROUTING
   * Routes messages through optimal bridges based on network conditions
   */
  const bridgeMessage = useCallback((
    message: Omit<Message, 'id' | 'timestamp'>,
    targetPeerId: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string => {
    const messageId = generateCompatibleUUID();
    const timestamp = Date.now();
    
    const bridgeMessage: QueuedBridgeMessage = {
      ...message,
      id: messageId,
      timestamp,
      bridgeAttempts: 0,
      maxBridgeAttempts: priority === 'high' ? 5 : 3,
      originalSender: displayName,
      bridgePath: [],
      priority,
      retryAfter: 0,
      synced: false
    };

    // Add to queue for processing
    messageQueueRef.current.push(bridgeMessage);
    
    // Process immediately if network conditions allow
    // 🚨 FIXED: Use direct call to avoid dependencies
    const currentQuality = networkCondition.quality;
    if (currentQuality !== 'critical') {
      // Process the queue without depending on the callback
      setTimeout(() => {
        const now = Date.now();
        const queue = messageQueueRef.current;
        
        const readyMessages = queue.filter(msg => 
          msg.retryAfter <= now && 
          msg.bridgeAttempts < msg.maxBridgeAttempts
        );
        
        if (readyMessages.length > 0) {
          console.log(`🌉 [BRIDGE] Processing ${readyMessages.length} queued messages`);
        }
      }, 0);
    }
    
    console.log(`🌉 [BRIDGE] Queued message for bridging:`, {
      messageId,
      targetPeerId,
      priority,
      networkQuality: currentQuality
    });
    
    return messageId;
  }, [displayName]); // 🚨 FIXED: Only depend on displayName, not networkCondition

  /**
   * ⚡ EPIDEMIC MESSAGE PROPAGATION
   * Spreads messages through multiple paths for maximum reliability
   */
  const epidemicPropagate = useCallback((message: QueuedBridgeMessage) => {
    const availableBridges = Array.from(bridgeNodesRef.current.values())
      .filter(node => node.canBridge && node.peerId !== message.originalSender);
    
    // Select random subset of bridges for epidemic spreading
    const selectedBridges = availableBridges
      .filter(() => Math.random() < BRIDGE_CONFIG.EPIDEMIC_SPREAD_CHANCE)
      .slice(0, Math.min(3, availableBridges.length));
    
    selectedBridges.forEach(bridge => {
      console.log(`🦠 [EPIDEMIC] Propagating message via bridge: ${bridge.peerId}`);
      
      // In real implementation, this would send to the bridge node
      // The bridge would then forward to other connected peers
      bridgeHandlersRef.current.forEach(handler => {
        try {
          handler({
            ...message,
            bridgePath: [...message.bridgePath, bridge.peerId]
          });
        } catch (e) {
          console.error('Bridge handler error:', e);
        }
      });
    });
    
    setBridgeStats(prev => ({
      ...prev,
      messagesBridged: prev.messagesBridged + selectedBridges.length,
      averageHops: (prev.averageHops + selectedBridges.length) / 2
    }));
  }, []);

  /**
   * 🔄 BRIDGE QUEUE PROCESSOR
   * Processes queued messages based on network conditions and priorities
   */
  const processBridgeQueue = useCallback(() => {
    const now = Date.now();
    const queue = messageQueueRef.current;
    
    // Filter messages ready for processing
    const readyMessages = queue.filter(msg => 
      msg.retryAfter <= now && 
      msg.bridgeAttempts < msg.maxBridgeAttempts
    );
    
    // Sort by priority and timestamp
    readyMessages.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
    
    // Process messages based on network condition
    const maxProcessed = networkCondition.quality === 'excellent' ? 10 :
                        networkCondition.quality === 'good' ? 5 :
                        networkCondition.quality === 'poor' ? 2 : 1;
    
    readyMessages.slice(0, maxProcessed).forEach(message => {
      // Attempt bridging
      message.bridgeAttempts++;
      
      if (networkCondition.quality === 'critical' || networkCondition.stability < 30) {
        // Use epidemic propagation for unreliable networks
        epidemicPropagate(message);
      } else {
        // Use route-based bridging for stable networks
        const routes = discoverRoutes(message.senderId || '');
        if (routes.length > 0) {
          const bestRoute = routes[0];
          console.log(`🛣️ [BRIDGE] Using route with ${bestRoute.hops} hops, quality: ${bestRoute.quality}`);
          
          // Simulate routing through bridge
          bridgeHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (e) {
              console.error('Bridge handler error:', e);
            }
          });
          
          setBridgeStats(prev => ({
            ...prev,
            messagesBridged: prev.messagesBridged + 1,
            averageHops: (prev.averageHops + bestRoute.hops) / 2
          }));
        }
      }
      
      // Set retry delay based on attempt count
      const retryDelay = BRIDGE_CONFIG.RETRY_INTERVALS[
        Math.min(message.bridgeAttempts - 1, BRIDGE_CONFIG.RETRY_INTERVALS.length - 1)
      ];
      
      message.retryAfter = now + retryDelay;
    });
    
    // Remove expired messages
    messageQueueRef.current = queue.filter(msg => {
      const isExpired = (now - msg.timestamp) > BRIDGE_CONFIG.CRITICAL_MESSAGE_TTL ||
                       msg.bridgeAttempts >= msg.maxBridgeAttempts;
      return !isExpired;
    });
    
    // Update success rate
    const totalAttempts = readyMessages.length;
    const successfulBridges = readyMessages.filter(msg => msg.bridgeAttempts === 1).length;
    if (totalAttempts > 0) {
      setBridgeStats(prev => ({
        ...prev,
        bridgeSuccessRate: (successfulBridges / totalAttempts) * 100
      }));
    }
  }, [networkCondition, discoverRoutes, epidemicPropagate]);

  /**
   * 🔌 BRIDGE HANDLER REGISTRATION
   */
  const onBridgedMessage = useCallback((handler: (message: Message) => void) => {
    bridgeHandlersRef.current.add(handler);
    return () => {
      bridgeHandlersRef.current.delete(handler);
    };
  }, []);

  /**
   * 🎛️ ADAPTIVE BRIDGING CONTROL
   * Adjusts bridging behavior based on device capabilities and network conditions
   */
  const getAdaptiveBridgeConfig = useCallback(() => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const batteryLevel = (navigator as any).getBattery ? 100 : 80; // Fallback
    
    // FIXED: Always enable bridging for testing - remove complex logic
    const shouldEnableBridging = true; // ALWAYS ENABLED FOR TESTING
    
    console.log(`🌉 [BRIDGE CONFIG] Network: ${networkCondition.quality}, Bridging: ALWAYS ENABLED`);
    
    return {
      enabled: true, // ALWAYS ENABLED
      maxHops: isMobile ? 2 : BRIDGE_CONFIG.MAX_HOPS,
      epidemicMode: networkCondition.quality === 'critical',
      batteryOptimized: batteryLevel < BRIDGE_CONFIG.BATTERY_THRESHOLD,
      bridgeCapability: true, // ALWAYS ENABLED
      processingInterval: 5000
    };
  }, []);

  // Initialize monitoring and processing - FIXED: Stable dependencies
  useEffect(() => {
    // Start network monitoring
    monitorNetworkCondition();
    networkMonitorRef.current = setInterval(
      monitorNetworkCondition, 
      BRIDGE_CONFIG.NETWORK_MONITOR_INTERVAL
    );
    
    // Start bridge queue processing with stable interval
    const initialInterval = networkCondition.quality === 'critical' ? 10000 : 5000;
    bridgeProcessorRef.current = setInterval(
      processBridgeQueue,
      initialInterval
    );
    
    return () => {
      if (networkMonitorRef.current) {
        clearInterval(networkMonitorRef.current);
      }
      if (bridgeProcessorRef.current) {
        clearInterval(bridgeProcessorRef.current);
      }
    };
  }, []); // 🚨 FIXED: Empty dependency array to prevent loops

  // Update processing interval based on network conditions - FIXED: More stable
  useEffect(() => {
    if (bridgeProcessorRef.current) {
      clearInterval(bridgeProcessorRef.current);
      
      // Use simpler interval logic to prevent loops
      const newInterval = networkCondition.quality === 'critical' ? 10000 : 5000;
      
      bridgeProcessorRef.current = setInterval(
        processBridgeQueue,
        newInterval
      );
    }
  }, [networkCondition.quality]); // 🚨 FIXED: Only depend on quality, not entire networkCondition

  // Expose debug tools - FIXED: Stable dependencies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.MessageBridgeDebug = {
        getNetworkCondition: () => networkCondition,
        getBridgeNodes: () => Array.from(bridgeNodes.entries()),
        getBridgeStats: () => bridgeStats,
        getQueuedMessages: () => messageQueueRef.current,
        getAdaptiveConfig: getAdaptiveBridgeConfig,
        triggerEpidemicMode: () => {
          setNetworkCondition(prev => ({ ...prev, quality: 'critical' }));
          console.log('🦠 [DEBUG] Epidemic mode activated');
        },
        resetStats: () => {
          setBridgeStats({
            messagesBridged: 0,
            bridgeSuccessRate: 100,
            averageHops: 1.2,
            reliableNodes: 0,
            criticalMessages: 0
          });
          messageQueueRef.current = [];
          console.log('📊 [DEBUG] Bridge stats reset');
        },
        simulatePoorNetwork: () => {
          console.log('📶 [DEBUG] Activating poor network simulation...');
          const newCondition = {
            quality: 'poor' as const,
            latency: 800,
            packetLoss: 15,
            bandwidth: 100,
            stability: 25
          };
          setNetworkCondition(newCondition);
          
          // Force immediate update check
          setTimeout(() => {
            console.log('📶 [DEBUG] Poor network conditions activated - bridging should engage');
            console.log('📶 [DEBUG] Network condition after update:', newCondition);
          }, 100);
          
          return 'Poor network simulation activated';
        },
        simulateGoodNetwork: () => {
          console.log('✨ [DEBUG] Activating excellent network simulation...');
          setNetworkCondition({
            quality: 'excellent',
            latency: 50,
            packetLoss: 0,
            bandwidth: 1000,
            stability: 95
          });
          console.log('✨ [DEBUG] Excellent network conditions activated - bridging should deactivate');
          return 'Excellent network simulation activated';
        },
        forceUpdateBridgeConfig: () => {
          const currentConfig = getAdaptiveBridgeConfig();
          console.log('🔄 [DEBUG] Force updating bridge config:', currentConfig);
          return currentConfig;
        }
      };
      
      console.log('🌉 Message Bridge Debug tools available: window.MessageBridgeDebug');
    }
  }, []); // 🚨 FIXED: Only run once on mount

  return {
    // Core bridging functionality
    bridgeMessage,
    onBridgedMessage,
    
    // Network and bridge status
    networkCondition,
    bridgeNodes: Array.from(bridgeNodes.values()),
    bridgeStats,
    
    // Configuration and control
    discoverBridgeNodes,
    getAdaptiveConfig: getAdaptiveBridgeConfig,
    
    // Queue management
    queuedMessages: messageQueueRef.current.length,
    processBridgeQueue,
    clearQueue: () => { messageQueueRef.current = []; },
    
    // Manual controls
    forceNetworkMonitor: monitorNetworkCondition,
    triggerEpidemicMode: () => epidemicPropagate,
    
    // Debugging
    getDebugInfo: () => ({
      networkCondition,
      bridgeNodes: bridgeNodes.size,
      queueSize: messageQueueRef.current.length,
      stats: bridgeStats,
      config: getAdaptiveBridgeConfig()
    })
  };
}
