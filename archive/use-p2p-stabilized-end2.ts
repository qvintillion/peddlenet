.current),
    getPendingConnections: () => Array.from(pendingConnections.current),
    
    // Stability utilities
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
    
    forceCleanup: () => {
      cleanOldPresenceData();
      updateStatus();
    },
    
    emergencyCleanup: () => {
      if (typeof window !== 'undefined') {
        const roomPrefix = `presence_v2_${roomId}_`;
        const oneMinuteAgo = Date.now() - 60 * 1000;
        let cleared = 0;
        
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
        
        connectionAttempts.current.clear();
        pendingConnections.current.clear();
        
        console.log(`🚨 Emergency cleanup: removed ${cleared} stale entries`);
        updateStatus();
      }
    },
    
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
