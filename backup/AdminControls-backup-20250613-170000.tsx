import { useState } from 'react';

interface AdminControlsProps {
  onBroadcast: (message: string) => Promise<void>;
  onClearRoom: (roomCode: string) => Promise<void>;
  onWipeDatabase: () => Promise<void>;
}

export function AdminControls({ onBroadcast, onClearRoom, onWipeDatabase }: AdminControlsProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [roomCodeToClear, setRoomCodeToClear] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    setIsLoading('broadcast');
    try {
      await onBroadcast(broadcastMessage);
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast failed:', error);
      alert('Failed to send broadcast. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleClearRoom = async () => {
    if (!roomCodeToClear.trim()) return;
    
    setIsLoading('clear-room');
    try {
      await onClearRoom(roomCodeToClear);
      setRoomCodeToClear('');
    } catch (error) {
      console.error('Clear room failed:', error);
      alert('Failed to clear room. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleWipeDatabase = async () => {
    const confirmed = confirm(
      `⚠️ WIPE ENTIRE DATABASE\n\n` +
      `This will permanently delete ALL data:\n` +
      `• All messages from all rooms\n` +
      `• All user sessions\n` +
      `• All analytics data\n` +
      `• All system events\n\n` +
      `This action cannot be undone!\n\n` +
      `Are you absolutely sure you want to continue?`
    );
    
    if (!confirmed) return;
    
    setIsLoading('wipe-db');
    try {
      await onWipeDatabase();
    } catch (error) {
      console.error('Database wipe failed:', error);
      alert('Failed to wipe database. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  // Quick action templates
  const quickActions = [
    {
      label: '🎪 Welcome',
      message: '🎪 Welcome to the festival! Chat away and have fun!'
    },
    {
      label: '🚨 Maintenance',
      message: '🚨 System maintenance in 5 minutes. Please save your conversations.'
    },
    {
      label: '🎵 New Act',
      message: '🎵 New act starting now on the main stage! Check it out!'
    },
    {
      label: '🍕 Food Court',
      message: '🍕 Food court is now open! Grab some delicious festival food.'
    }
  ];

  return (
    <div className="bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-700/50 h-full">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <span className="text-2xl mr-2">🎛️</span>
          Admin Controls
        </h3>

        <div className="space-y-6">
          {/* Broadcast Message */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center text-blue-300">
              <span className="mr-2">📢</span>
              Broadcast Message
            </h4>
            
            {/* Quick Action Buttons */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Quick templates:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setBroadcastMessage(action.message)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 px-2 py-1 rounded text-xs transition-colors text-left"
                    title={action.message}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter message to broadcast to all users..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none"
              rows={3}
            />
            <button
              onClick={handleBroadcast}
              disabled={!broadcastMessage.trim() || isLoading === 'broadcast'}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isLoading === 'broadcast' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Broadcasting...
                </>
              ) : (
                'Send Broadcast'
              )}
            </button>
          </div>

          {/* Room Management */}
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center text-yellow-300">
              <span className="mr-2">🏠</span>
              Room Management
            </h4>
            <input
              type="text"
              value={roomCodeToClear}
              onChange={(e) => setRoomCodeToClear(e.target.value)}
              placeholder="Room code to clear..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-3"
            />
            <button
              onClick={handleClearRoom}
              disabled={!roomCodeToClear.trim() || isLoading === 'clear-room'}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isLoading === 'clear-room' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Clearing...
                </>
              ) : (
                'Clear Room Messages'
              )}
            </button>
          </div>

          {/* Database Management */}
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center text-red-300">
              <span className="mr-2">⚠️</span>
              Database Management
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              ⚠️ Danger Zone: This will permanently delete all data including messages, users, and analytics
            </p>
            <button
              onClick={handleWipeDatabase}
              disabled={isLoading === 'wipe-db'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isLoading === 'wipe-db' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Wiping...
                </>
              ) : (
                'Wipe Entire Database'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}