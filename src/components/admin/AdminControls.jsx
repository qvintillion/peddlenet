import { useState } from 'react';


export function AdminControls({ 
  onBroadcast, 
  onRoomBroadcast, 
  onClearRoom, 
  onWipeDatabase, 
  adminLevel 
}: AdminControlsProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [roomCodeToClear, setRoomCodeToClear] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // 🔧 NEW: Room-specific broadcast state
  const [roomBroadcastMessage, setRoomBroadcastMessage] = useState('');
  const [roomCodesToTarget, setRoomCodesToTarget] = useState('');
  const [broadcastMode, setBroadcastMode] = useState<'all' | 'specific'>('all');

  // 🔧 FIXED: Separate password states to prevent syncing
  const [clearRoomPassword, setClearRoomPassword] = useState('');
  const [wipeDbPassword, setWipeDbPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState<'clear' | 'wipe' | null>(null);

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

  // 🔧 NEW: Room-specific broadcast handler
  const handleRoomBroadcast = async () => {
    if (!roomBroadcastMessage.trim() || !roomCodesToTarget.trim() || !onRoomBroadcast) return;
    
    // Parse room codes (comma-separated)
    const roomCodes = roomCodesToTarget
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);
    
    if (roomCodes.length === 0) {
      alert('Please enter at least one room code');
      return;
    }
    
    setIsLoading('room-broadcast');
    try {
      await onRoomBroadcast(roomBroadcastMessage, roomCodes);
      setRoomBroadcastMessage('');
      setRoomCodesToTarget('');
    } catch (error) {
      console.error('Room broadcast failed:', error);
      alert('Failed to send room broadcast. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleClearRoom = async () => {
    if (!roomCodeToClear.trim()) return;
    
    // 🔧 FIXED: Check password requirement
    if (clearRoomPassword !== 'letsmakeatrade') {
      alert('❌ Incorrect password for clearing room messages');
      return;
    }
    
    setIsLoading('clear-room');
    try {
      await onClearRoom(roomCodeToClear);
      setRoomCodeToClear('');
      setClearRoomPassword('');
      setShowPasswordInput(null);
    } catch (error) {
      console.error('Clear room failed:', error);
      alert('Failed to clear room. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleWipeDatabase = async () => {
    // 🔧 FIXED: Check password requirement
    if (wipeDbPassword !== 'letsmakeatrade') {
      alert('❌ Incorrect password for database wipe');
      return;
    }

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
      setWipeDbPassword('');
      setShowPasswordInput(null);
    } catch (error) {
      console.error('Database wipe failed:', error);
      alert('Failed to wipe database. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  // 🔧 SIMPLIFIED: Only two quick action templates
  const quickActions = [
    {
      label: '🎠 Welcome',
      message: '🎠 Welcome to the festival! Chat away and have fun!'
    },
    {
      label: '🚨 Maintenance',
      message: '🚨 System maintenance in 5 minutes. Please save your conversations.'
    }
  ];

  return (
    <div className="bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-700/50 h-full">
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center">
          <span className="text-xl sm:text-2xl mr-2">🎛️</span>
          Admin Controls
          <div className="ml-auto px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-200 border border-blue-500/50">
            👤 Admin
          </div>
        </h3>

        <div className="space-y-4 sm:space-y-6">
          {/* 🔧 ENHANCED: Broadcasting with room toggle exactly like create/join room toggle */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold mb-3 flex items-center text-blue-300 text-sm sm:text-base">
              <span className="mr-2">📢</span>
              Broadcast Message
            </h4>
            
            {/* 🔧 ROOM TOGGLE: Exact style match to create/join room toggle */}
            {onRoomBroadcast && (
              <div className="mb-4">
                <div className="flex items-center justify-center">
                  <div className="bg-gray-800/50 p-1 rounded-xl border border-gray-600/50">
                    <div className="flex">
                      <button
                        onClick={() => setBroadcastMode('all')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          broadcastMode === 'all'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        📢 All Rooms
                      </button>
                      <button
                        onClick={() => setBroadcastMode('specific')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          broadcastMode === 'specific'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        🎯 Specify Room
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {broadcastMode === 'all' ? (
              // All Rooms Broadcast
              <>
                {/* Quick Action Buttons - Mobile Responsive */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Quick templates:</p>
                  <div className="flex gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => setBroadcastMessage(action.message)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 px-2 sm:px-3 py-2 rounded-lg text-xs transition-colors flex-1"
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
                  placeholder="Message to all active rooms..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none text-sm"
                  rows={3}
                />
                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastMessage.trim() || isLoading === 'broadcast'}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                >
                  {isLoading === 'broadcast' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Broadcasting...
                    </>
                  ) : (
                    '📢 Send to All'
                  )}
                </button>
              </>
            ) : (
              // Room-Specific Broadcast
              <>
                <input
                  type="text"
                  value={roomCodesToTarget}
                  onChange={(e) => setRoomCodesToTarget(e.target.value)}
                  placeholder="room1, room2, room3..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-3 text-sm"
                />
                
                <textarea
                  value={roomBroadcastMessage}
                  onChange={(e) => setRoomBroadcastMessage(e.target.value)}
                  placeholder="Message to specific rooms..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none text-sm"
                  rows={3}
                />
                <button
                  onClick={handleRoomBroadcast}
                  disabled={!roomBroadcastMessage.trim() || !roomCodesToTarget.trim() || isLoading === 'room-broadcast'}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                >
                  {isLoading === 'room-broadcast' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    '🎯 Send to Rooms'
                  )}
                </button>
              </>
            )}
          </div>

          {/* Room Management - Enhanced with password requirement */}
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold mb-3 flex items-center text-yellow-300 text-sm sm:text-base">
              <span className="mr-2">🏠</span>
              Clear Room Messages
            </h4>
            
            <input
              type="text"
              value={roomCodeToClear}
              onChange={(e) => setRoomCodeToClear(e.target.value)}
              placeholder="Room code to clear..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-3 text-sm"
            />
            
            {/* Password input for admin */}
            {(showPasswordInput === 'clear' || roomCodeToClear.trim()) && (
              <input
                type="password"
                value={clearRoomPassword}
                onChange={(e) => setClearRoomPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-3 text-sm"
              />
            )}
            
            <button
              onClick={handleClearRoom}
              disabled={!roomCodeToClear.trim() || !clearRoomPassword.trim() || isLoading === 'clear-room'}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
            >
              {isLoading === 'clear-room' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Clearing...
                </>
              ) : (
                '🗑️ Clear Messages'
              )}
            </button>
          </div>

          {/* Database Management - Enhanced with password requirement */}
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold mb-3 flex items-center text-red-300 text-sm sm:text-base">
              <span className="mr-2">⚠️</span>
              Database Wipe
            </h4>
            
            <p className="text-xs text-gray-400 mb-3">
              ⚠️ Permanently deletes ALL data
            </p>
            
            {/* Password input for admin */}
            <input
              type="password"
              value={wipeDbPassword}
              onChange={(e) => setWipeDbPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-3 text-sm"
            />
            
            <button
              onClick={handleWipeDatabase}
              disabled={!wipeDbPassword.trim() || isLoading === 'wipe-db'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
            >
              {isLoading === 'wipe-db' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Wiping...
                </>
              ) : (
                '💥 Wipe Database'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}