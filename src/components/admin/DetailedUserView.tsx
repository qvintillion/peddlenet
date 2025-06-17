import { useState, useEffect } from 'react';



type SortField = 'displayName' | 'roomId' | 'joinedAt' | 'duration';
type SortDirection = 'asc' | 'desc';

export function DetailedUserView({ isOpen, onClose, fetchDetailedUsers, removeUser }: DetailedUserViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('joinedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDetailedUsers();
      setUsers(data.activeUsers || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleRemoveUser = async (peerId: string, roomId: string) => {
    if (!confirm('Remove this user from the room?')) return;

    try {
      const result = await removeUser(peerId, roomId, 'Removed by admin via dashboard');
      if (result.success) {
        setUsers(users.filter(user => user.peerId !== peerId));
        alert(`✅ User "${result.removedUser?.displayName || peerId}" removed successfully!`);
      } else {
        alert(`Failed to remove user: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      
      // Enhanced error handling with helpful messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Room not found')) {
        alert('❌ Cannot remove user: The room no longer exists.\n\nThis usually happens when:\n• The room was already deleted\n• All users left and the room was cleaned up\n• The server was restarted\n\nPlease refresh the dashboard to see current data.');
      } else if (errorMessage.includes('User not found')) {
        alert('❌ Cannot remove user: The user is no longer in this room.\n\nThe user may have already disconnected.\n\nPlease refresh the dashboard to see current data.');
      } else {
        alert(`❌ Failed to remove user: ${errorMessage}\n\nPlease check the server logs and try refreshing the dashboard.`);
      }
      
      // Refresh the user list to show current state
      await fetchUsers();
    }
  };

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

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Convert strings to lowercase for case-insensitive sorting
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

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
              <span className="text-2xl sm:text-4xl mr-2 sm:mr-3">👥</span>
              <div>
                <div>Users</div>
                <div className="text-sm sm:text-base text-gray-400">({filteredUsers.length})</div>
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
              placeholder="Search users or rooms..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[50vh] sm:max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-gray-400">No users found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search term</p>
              )}
            </div>
          ) : (
            <>
              {/* 📱 MOBILE: Card Layout for small screens */}
              <div className="block sm:hidden">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.peerId}
                    className={`p-4 border-b border-gray-700/30 ${
                      index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          user.isActive ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-lg">{user.displayName}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {user.isActive ? 'Active' : 'Inactive'} • {getTimeAgo(user.joinedAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.peerId, user.roomId)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 ml-2"
                        title="Remove user from room"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Room:</span>
                        <span className="font-mono text-purple-300 bg-purple-900/20 px-2 py-1 rounded text-xs">
                          {user.roomId.length > 20 ? user.roomId.substring(0, 20) + '...' : user.roomId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-blue-300 font-bold">{formatDuration(user.duration)}</span>
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
                          onClick={() => handleSort('displayName')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Display Name {getSortIcon('displayName')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('roomId')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Room ID {getSortIcon('roomId')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('duration')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Duration {getSortIcon('duration')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">
                        <button
                          onClick={() => handleSort('joinedAt')}
                          className="flex items-center hover:text-white transition-colors"
                        >
                          Joined {getSortIcon('joinedAt')}
                        </button>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-300">Status</th>
                      <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.peerId}
                        className={`border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              user.isActive ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                            <span className="font-medium text-white">{user.displayName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-purple-300 bg-purple-900/20 px-2 py-1 rounded text-sm">
                            {user.roomId}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-blue-300 font-bold">{formatDuration(user.duration)}</span>
                        </td>
                        <td className="p-4 text-gray-300">
                          {getTimeAgo(user.joinedAt)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleRemoveUser(user.peerId, user.roomId)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Remove user from room"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
            {searchTerm && (
              <div className="sm:inline"> (filtered by "{searchTerm}")</div>
            )}
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={fetchUsers}
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