    clearRoomPeers: () => {
      if (typeof window !== 'undefined') {
        // Clear individual presence keys
        const presencePrefix = `presence_v2_${roomId}_`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(presencePrefix)) {
            localStorage.removeItem(key);
          }
        }
        
        // Clear shared room key
        const sharedKey = `room_${roomId}_peers`;
        localStorage.removeItem(sharedKey);
        
        connectionAttempts.current.clear();
        reconnectAttempts.current.clear();
      }
    }
  };
}