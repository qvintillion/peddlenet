/**
 * Debug component to verify message persistence is working
 * Add this temporarily to your chat page for testing
 */

'use client';

import { useState, useEffect } from 'react';
import { MessagePersistence } from '@/utils/message-persistence';

interface MessagePersistenceDebugProps {
  roomId: string;
  currentMessageCount: number;
  className?: string;
}

export function MessagePersistenceDebug({ 
  roomId, 
  currentMessageCount,
  className = '' 
}: MessagePersistenceDebugProps) {
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const storageStats = MessagePersistence.getStorageStats();
      const roomMessages = MessagePersistence.getRoomMessages(roomId);
      
      setStats({
        ...storageStats,
        currentRoomMessages: roomMessages.length,
        currentRoomId: roomId,
        lastMessage: roomMessages[roomMessages.length - 1]?.content?.substring(0, 30) + '...' || 'None',
        memoryMessages: currentMessageCount
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [roomId, currentMessageCount]);

  const clearStorage = () => {
    MessagePersistence.clearAllMessages();
    setStats(prev => ({ ...prev, totalRooms: 0, totalMessages: 0 }));
  };

  const clearCurrentRoom = () => {
    MessagePersistence.clearRoomMessages(roomId);
    setStats(prev => ({ ...prev, currentRoomMessages: 0 }));
  };

  if (!stats) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">💾</span>
          <span className="text-sm font-medium text-blue-900">Message Persistence</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {stats.currentRoomMessages} stored
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded">
              <div className="font-medium text-gray-900">Current Room</div>
              <div className="text-gray-600">Stored: {stats.currentRoomMessages}</div>
              <div className="text-gray-600">Memory: {stats.memoryMessages}</div>
              <div className="text-gray-600">Room: {stats.currentRoomId}</div>
            </div>
            
            <div className="bg-white p-2 rounded">
              <div className="font-medium text-gray-900">Storage Stats</div>
              <div className="text-gray-600">Total Rooms: {stats.totalRooms}</div>
              <div className="text-gray-600">Total Messages: {stats.totalMessages}</div>
              <div className="text-gray-600">Size: {Math.round(stats.storageSize / 1024)}KB</div>
            </div>
          </div>

          <div className="bg-white p-2 rounded">
            <div className="font-medium text-gray-900 mb-1">Last Message</div>
            <div className="text-gray-600 text-xs italic">
              {stats.lastMessage}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={clearCurrentRoom}
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
            >
              Clear Room
            </button>
            <button
              onClick={clearStorage}
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
            >
              Clear All
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            >
              Test Refresh
            </button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>Test Instructions:</strong><br/>
            1. Send a few messages<br/>
            2. Click "Test Refresh" - messages should persist<br/>
            3. Check Storage > Local Storage in DevTools<br/>
            4. Look for "peddlenet_messages" key
          </div>
        </div>
      )}
    </div>
  );
}
