    const cleanupInterval = setInterval(() => {
      cleanOldPresenceData();
    }, 30000);
    
    // BALANCED: Less frequent presence broadcasting (every 30 seconds)
    const presenceInterval = setInterval(() => {
      broadcastPresence(peerId);
    }, 30000);
    
    // BALANCED: Only discover when we have zero connections (every 45 seconds)
    const discoveryInterval = setInterval(() => {
      if (connectionsRef.current.size === 0 && pendingConnections.current.size === 0) {
        console.log('🔍 Auto-discovery triggered - no active connections');
        autoConnectToRoomPeers();
      }
    }, 45000);
    
    // BALANCED: Less frequent status updates (every 30 seconds)
    const statusInterval = setInterval(() => {
      updateStatus();
    }, 30000);
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(presenceInterval);
      clearInterval(discoveryInterval);
      clearInterval(statusInterval);
    };
  }, [peerId, broadcastPresence, autoConnectToRoomPeers, updateStatus, cleanOldPresenceData]);

  // Expose debug utilities
  useEffect(() => {
    if (typeof window !== 'undefined' && peerId) {
      window.debugP2P = () => {
        const activeConns = Array.from(connectionsRef.current.entries())
          .map(([peerId, conn]) => ({
            peerId: peerId.substring(0, 8) + '...',
            open: conn.open,
            isSettingUp: conn._isSettingUp,
            quality: Math.round(conn._connectionQuality || 0)
          }));
        
        const pendingConns = Array.from(pendingConnections.current)
          .map(peerId => peerId.substring(0, 8) + '...');
        
        console.log('🔍 Active connections:', activeConns);
        console.log('🔍 Pending connections:', pendingConns);
        console.log('🔍 Status:', status);
        
        return { 
          active: activeConns, 
          pending: pendingConns, 
          count: connectionsRef.current.size,
          status 
        };
      };
    }
  }, [peerId, status]);

  return {
    peerId,
    status,
    roomPeers: discoverPeers().map(p => p.peerId),
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()).filter(peerId => {
      const conn = connectionsRef.current.get(peerId);
      return conn && conn.open && !conn._isSettingUp;
    }),
    forceReconnect: () => {
      cleanOldPresenceData();
      autoConnectToRoomPeers();
    },
    
    // Enhanced debugging methods
    getQueuedMessages: () => messageQueueRef.current.length,
    clearMessageQueue: () => { messageQueueRef.current = []; },
    getConnectionQuality: calculateAverageConnectionQuality,
    getConnectionAttempts: () => Object.fromEntries(connectionAttempts.current),
    getReconnectAttempts: () => Object.fromEntries(reconnectAttempts.current),
    getPendingConnections: () => Array.from(pendingConnections.current),
    
    // Utility methods for stability
    clearRoomPeers: () => {
      if (typeof window !== 'undefined') {
        const presencePrefix = `presence_v2_${roomId}`;
        let clearCount = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(presencePrefix)) {
            localStorage.removeItem(key);
            clearCount++;
          }
        }
        connectionAttempts.current.clear();
        reconnectAttempts.current.clear();
        pendingConnections.current.clear();
        console.log(`🧹 Cleared ${clearCount} room peer entries`);
      }
    },
    
    // BALANCED cleanup - removes old data but preserves recent entries
    forceCleanup: () => {
      cleanOldPresenceData();
      updateStatus();
    },
    
    // IMPROVED emergency cleanup - more conservative
    emergencyCleanup: () => {
      if (typeof window !== 'undefined') {
        const roomPrefix = `presence_v2_${roomId}_`;
        const oneMinuteAgo = Date.now() - 60 * 1000;
        let cleared = 0;
        
        // Only remove entries older than 1 minute, except our own current entry
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(roomPrefix)) {
            if (key !== `${roomPrefix}${peerId}`) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.timestamp < oneMinuteAgo) {
                  localStorage.removeItem(key);
                  cleared++;
                }
              } catch (e) {
                localStorage.removeItem(key);
                cleared++;
              }
            }
          }
        }
        
        // Reset connection tracking
        connectionAttempts.current.clear();
        pendingConnections.current.clear();
        
        console.log(`🚨 Emergency cleanup: removed ${cleared} stale entries`);
        updateStatus();
      }
    },
    
    // Debug connection info
    debugConnections: () => {
      const activeConns = Array.from(connectionsRef.current.entries())
        .map(([peerId, conn]) => ({
          peerId: peerId.substring(0, 8) + '...',
          open: conn.open,
          isSettingUp: conn._isSettingUp,
          quality: conn._connectionQuality || 0
        }));
      
      const pendingConns = Array.from(pendingConnections.current)
        .map(peerId => peerId.substring(0, 8) + '...');
      
      console.log('🔍 Debug - Active connections:', activeConns);
      console.log('🔍 Debug - Pending connections:', pendingConns);
      console.log('🔍 Debug - Connection count:', connectionsRef.current.size);
      
      return { active: activeConns, pending: pendingConns, count: connectionsRef.current.size };
    }
  };
}
