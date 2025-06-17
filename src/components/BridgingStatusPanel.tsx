'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface BridgingStatusProps {
  hybridChat: any; // From useHybridChat hook
}

interface NetworkCondition {
  quality: 'excellent' | 'good' | 'poor' | 'critical';
  latency: number;
  packetLoss: number;
  bandwidth: number;
  stability: number;
}

interface BridgeStats {
  messagesBridged: number;
  bridgeSuccessRate: number;
  averageHops: number;
  reliableNodes: number;
  criticalMessages: number;
}

/**
 * 🌉 MESSAGE BRIDGING STATUS PANEL
 * 
 * Real-time monitoring of the message bridging system for poor network conditions.
 * Shows network quality, bridge node availability, and routing statistics.
 */
export function BridgingStatusPanel({ hybridChat }: BridgingStatusProps) {
  const [bridgeData, setBridgeData] = useState<{
    networkCondition: NetworkCondition;
    bridgeStats: BridgeStats;
    bridgeNodes: any[];
    queuedMessages: number;
    isEnabled: boolean;
  } | null>(null);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Update bridge data
  useEffect(() => {
    const updateBridgeData = () => {
      if (hybridChat?.bridging) {
        setBridgeData({
          networkCondition: hybridChat.bridging.networkCondition,
          bridgeStats: hybridChat.bridging.bridgeStats,
          bridgeNodes: hybridChat.bridging.bridgeNodes,
          queuedMessages: hybridChat.bridging.queuedMessages,
          isEnabled: hybridChat.bridging.isEnabled
        });
      }
    };
    
    // Initial update
    updateBridgeData();
    
    // Auto-refresh every 3 seconds
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(updateBridgeData, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hybridChat, autoRefresh]);
  
  if (!bridgeData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            🌉 Message Bridging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Bridging system not available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { networkCondition, bridgeStats, bridgeNodes, queuedMessages, isEnabled } = bridgeData;
  
  // Network quality colors
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'poor': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'poor': return '📴';
      case 'critical': return '🔴';
      default: return '❓';
    }
  };
  
  const getBridgeStatusIcon = () => {
    if (!isEnabled) return '⚪';
    if (queuedMessages > 0) return '🟡';
    if (bridgeNodes.length > 0) return '🟢';
    return '🔴';
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            🌉 Message Bridging
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-2 py-1 rounded ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? '🔼' : '🔽'}
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Network Condition */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Network Quality</span>
          <div className="flex items-center gap-2">
            <span className="text-sm">{getQualityIcon(networkCondition.quality)}</span>
            <span className={`text-sm font-medium ${getQualityColor(networkCondition.quality)}`}>
              {networkCondition.quality.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Bridge Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Bridging Status</span>
          <div className="flex items-center gap-2">
            <span className="text-sm">{getBridgeStatusIcon()}</span>
            <span className={`text-sm font-medium ${
              isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isEnabled ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {bridgeNodes.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bridge Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {queuedMessages}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Queued</div>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Network Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Network Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Latency:</span>
                  <span className="font-medium">{networkCondition.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stability:</span>
                  <span className="font-medium">{networkCondition.stability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Packet Loss:</span>
                  <span className="font-medium">{networkCondition.packetLoss}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bandwidth:</span>
                  <span className="font-medium">{Math.round(networkCondition.bandwidth)}kbps</span>
                </div>
              </div>
            </div>
            
            {/* Bridge Statistics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Bridge Performance</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Messages Bridged:</span>
                  <span className="font-medium">{bridgeStats.messagesBridged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Success Rate:</span>
                  <span className="font-medium">{Math.round(bridgeStats.bridgeSuccessRate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average Hops:</span>
                  <span className="font-medium">{bridgeStats.averageHops.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reliable Nodes:</span>
                  <span className="font-medium">{bridgeStats.reliableNodes}</span>
                </div>
              </div>
            </div>
            
            {/* Test Controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Controls</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => hybridChat?.bridging?.simulatePoorNetwork?.()}
                  className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  📶 Poor Network
                </button>
                <button
                  onClick={() => hybridChat?.bridging?.simulateGoodNetwork?.()}
                  className="flex-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                >
                  📶 Good Network
                </button>
              </div>
              <button
                onClick={() => {
                  const testMessage = `Test bridge message ${Date.now()}`;
                  hybridChat?.bridging?.bridgeMessage?.({ 
                    content: testMessage, 
                    type: 'chat',
                    senderId: 'test-user'
                  }, 'test-peer', 'normal');
                }}
                className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                🧪 Test Bridge Message
              </button>
            </div>
            
            {/* Bridge Nodes */}
            {bridgeNodes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Bridges</h4>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {bridgeNodes.slice(0, 3).map((node, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {node.displayName || `Bridge-${node.peerId?.slice(0, 6)}`}
                      </span>
                      <span className={`font-medium ${
                        node.connectionQuality === 'excellent' ? 'text-green-600' :
                        node.connectionQuality === 'good' ? 'text-blue-600' :
                        node.connectionQuality === 'poor' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {node.connectionQuality}
                      </span>
                    </div>
                  ))}
                  {bridgeNodes.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{bridgeNodes.length - 3} more bridges...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export for easy integration into admin dashboard
export default BridgingStatusPanel;
