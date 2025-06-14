import { useState, useEffect } from 'react';

interface DetailedRoomViewProps {
  isOpen: boolean;
  onClose: () => void;
  fetchDetailedRooms: () => Promise<any>;
  deleteRoom: (roomId: string, roomCode: string) => Promise<void>;
}

interface Room {
  roomId: string;
  roomCode: string;
  activeUsers: number;
  userList: Array<{
    peerId: string;
    displayName: string;
    joinedAt: number;
  }>;
  created: number;
  lastActivity: number;
  totalMessages: number;
  uniqueUsers: number;
}

type SortField = 'roomCode' | 'activeUsers' | 'totalMessages' | 'created' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

export function DetailedRoomView({ isOpen, onClose, fetchDetailedRooms, deleteRoom }: DetailedRoomViewProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [error, setError] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const handleDeleteRoom = async (room: Room) => {
    const confirmMessage = `Are you sure you want to delete room "${room.roomCode || room.roomId.substring(0, 8)}"?\n\nThis will:\n• Remove ${room.activeUsers} active users\n• Clear ${room.totalMessages} messages\n• Delete the room permanently\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setDeletingRoomId(room.roomId);
    try {
      await deleteRoom(room.roomId, room.roomCode || room.roomId);
      
      // Remove room from local state immediately
      setRooms(prev => prev.filter(r => r.roomId !== room.roomId));
      
      // Show success message
      alert(`✅ Room "${room.roomCode || room.roomId.substring(0, 8)}" deleted successfully!`);
      
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert(`❌ Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingRoomId(null);
    }
  };

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDetailedRooms();
      setRooms(data.activeRooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Convert strings to lowercase for case-insensitive sorting
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredRooms = sortedRooms.filter(room =>
    room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-800/95 rounded-lg border border-gray-700/50 w-full max-w-7xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-3xl font-bold flex items-center">
              <span className="text-2xl sm:text-4xl mr-2 sm:mr-3">🏠</span>
              <div>
                <div>Active Rooms</div>
                <div className="text-sm sm:text-base text-gray-400">({filteredRooms.length})</div>
              </div>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl sm:text-2xl p-2"
            >
              ✕
            </button>
          </div>
          
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[50vh] sm:max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading rooms...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchRooms}
                className="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-400">No rooms found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search term</p>
              )}
            </div>
          ) : (
            <>
              {/* 📱 MOBILE: Card Layout for small screens */}
              <div className="block sm:hidden">
                {filteredRooms.map((room, index) => (
                  <div
                    key={room.roomId}
                    className={`p-4 border-b border-gray-700/30 ${
                      index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-mono text-purple-300 bg-purple-900/20 px-2 py-1 rounded text-sm font-bold mr-2">
                            {room.roomCode || 'N/A'}
                          </span>
                          <div className="flex items-center">
                            <span className="text-blue-300 font-bold text-lg mr-2">{room.activeUsers}</span>
                            <span className="text-gray-400 text-sm">👥</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Room ID: {room.roomId.substring(0, 12)}...
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        disabled={deletingRoomId === room.roomId}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 px-2 py-1 rounded text-xs transition-colors flex items-center ml-2"
                        title={`Delete room ${room.roomCode || room.roomId.substring(0, 8)}`}
                      >
                        {deletingRoomId === room.roomId ? (
                          <>
                            <div className="animate-spin rounded-full h-2 w-2 border border-white border-t-transparent mr-1"></div>
                            Del...
                          </>
                        ) : (
                          "🗑️"
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Messages</span>
                        <span className="text-green-300 font-bold">{room.totalMessages}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Created</span>
                        <span className="text-gray-300">{getTimeAgo(room.created)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Last Active</span>
                        <span className="text-gray-300">{getTimeAgo(room.lastActivity)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Users</span>
                        <div className="flex items-center">
                          {room.userList.length > 0 && (
                            <div className="flex -space-x-1">
                              {room.userList.slice(0, 2).map((user, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border border-gray-800 flex items-center justify-center text-xs font-bold"
                                  title={user.displayName}
                                >
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {room.userList.length > 2 && (
                                <div className="w-5 h-5 bg-gray-600 rounded-full border border-gray-800 flex items-center justify-center text-xs">
                                  +{room.userList.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 💻 DESKTOP: Table Layout for larger screens */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('roomCode')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Room Code {getSortIcon('roomCode')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        Room ID
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('activeUsers')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Users {getSortIcon('activeUsers')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('totalMessages')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Messages {getSortIcon('totalMessages')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('created')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Created {getSortIcon('created')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('lastActivity')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Last Active {getSortIcon('lastActivity')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room, index) => {
                      return (
                        <tr
                          key={room.roomId}
                          className={`border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors ${
                            index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'
                          }`}
                        >
                          <td className="p-4">
                            <span className="font-mono text-purple-300 bg-purple-900/20 px-2 py-1 rounded text-sm">
                              {room.roomCode || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-gray-300 text-xs">
                              {room.roomId.substring(0, 12)}...
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <span className="text-blue-300 font-bold mr-2">{room.activeUsers}</span>
                              {room.userList.length > 0 && (
                                <div className="flex -space-x-1">
                                  {room.userList.slice(0, 3).map((user, i) => (
                                    <div
                                      key={i}
                                      className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold"
                                      title={user.displayName}
                                    >
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                  {room.userList.length > 3 && (
                                    <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs">
                                      +{room.userList.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-green-300 font-bold">{room.totalMessages}</span>
                          </td>
                          <td className="p-4 text-gray-300">
                            {getTimeAgo(room.created)}
                          </td>
                          <td className="p-4 text-gray-300">
                            {getTimeAgo(room.lastActivity)}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeleteRoom(room)}
                              disabled={deletingRoomId === room.roomId}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 px-3 py-1 rounded text-sm transition-colors flex items-center"
                              title={`Delete room ${room.roomCode || room.roomId.substring(0, 8)}`}
                            >
                              {deletingRoomId === room.roomId ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  🗑️ Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-400">
            Showing {filteredRooms.length} of {rooms.length} rooms
            {searchTerm && (
              <div className="sm:inline"> (filtered by "{searchTerm}")</div>
            )}
            <div className="mt-1">
              Total: {rooms.reduce((sum, room) => sum + room.activeUsers, 0)} users, {rooms.reduce((sum, room) => sum + room.totalMessages, 0)} messages
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={fetchRooms}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
