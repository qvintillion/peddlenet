import { useState } from 'react';

// Real server activity structure

// Frontend display structure


export function ActivityFeed({ activities, onClearActivity }: ActivityFeedProps) {
  // Convert server activity to display activity
  const convertServerActivity = (serverActivity: ServerActivity): Activity => {
    const data = serverActivity.data || {};
    
    // Convert server type to frontend type
    let frontendType: Activity['type'] = 'broadcast';
    let description = 'Unknown activity';
    let details = '';
    let roomCode = '';
    let username = '';

    switch (serverActivity.type) {
      case 'user-joined':
        frontendType = 'user_join';
        description = `${data.displayName || 'User'} joined room`;
        details = `Joined ${data.roomId || 'unknown room'}`;
        roomCode = data.roomId;
        username = data.displayName;
        break;
      
      case 'user-left':
        frontendType = 'user_leave';
        description = `${data.displayName || 'User'} left room`;
        details = `Left ${data.roomId || 'unknown room'} after ${Math.round((data.duration || 0) / 1000)}s`;
        roomCode = data.roomId;
        username = data.displayName;
        break;
      
      case 'message-sent':
        frontendType = 'message';
        description = `Message sent in ${data.roomId || 'room'}`;
        details = `${data.sender || 'Unknown'}: "${(data.content || '').substring(0, 50)}${data.content?.length > 50 ? '...' : ''}"`;
        roomCode = data.roomId;
        username = data.sender;
        break;
      
      case 'room-created':
        frontendType = 'room_create';
        description = `Room created`;
        details = `New room: ${data.roomId || 'Unknown'} created by ${data.creator || 'Unknown'}`;
        roomCode = data.roomId;
        username = data.creator;
        break;
      
      case 'room-deleted':
        frontendType = 'room_delete';
        description = `Room deleted`;
        details = `Room ${data.roomId || 'Unknown'} was deleted (empty)`;
        roomCode = data.roomId;
        break;
      
      case 'admin-action':
      case 'admin-broadcast':
      case 'admin-room-broadcast':
      case 'admin-room-clear':
      case 'admin-database-wipe':
        frontendType = 'broadcast';
        description = `Admin: ${serverActivity.type.replace('admin-', '').replace('-', ' ')}`;
        details = data.message || JSON.stringify(data).substring(0, 100);
        roomCode = data.roomId;
        break;
      
      case 'server-start':
        frontendType = 'broadcast';
        description = 'Server started';
        details = `Environment: ${data.environment || 'Unknown'}, Platform: ${data.platform || 'Unknown'}`;
        break;
      
      default:
        description = `${serverActivity.type.replace('-', ' ')}`;
        details = JSON.stringify(data).substring(0, 100);
        break;
    }

    return {
      id: serverActivity.id.toString(),
      type: frontendType,
      timestamp: serverActivity.timestamp,
      description,
      details,
      roomCode,
      username
    };
  };

  // Get all activities for scrollable display
  const displayActivities = activities.slice(0, 100).map(convertServerActivity);

  // Download activity log as CSV
  const downloadActivityLog = (activities: Activity[]) => {
    const csvHeaders = 'Timestamp,Type,Description,Details,Room Code,Username\n';
    
    const csvContent = activities.map(activity => {
      const timestamp = new Date(activity.timestamp).toISOString();
      const type = activity.type;
      const description = activity.description.replace(/,/g, ';'); // Replace commas to avoid CSV issues
      const details = (activity.details || '').replace(/,/g, ';').replace(/\n/g, ' ');
      const roomCode = activity.roomCode || '';
      const username = activity.username || '';
      
      return `"${timestamp}","${type}","${description}","${details}","${roomCode}","${username}"`;
    }).join('\n');
    
    const fullCsv = csvHeaders + csvContent;
    
    // Create and download the file
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `peddlenet-activity-log-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Downloaded activity log: ${filename} (${activities.length} activities)`);
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_join': return '👋';
      case 'user_leave': return '👋';
      case 'message': return '💬';
      case 'room_create': return '🏠';
      case 'room_delete': return '🗑️';
      case 'broadcast': return '📢';
      default: return '📝';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'user_join': return 'text-green-400';
      case 'user_leave': return 'text-yellow-400';
      case 'message': return 'text-blue-400';
      case 'room_create': return 'text-purple-400';
      case 'room_delete': return 'text-red-400';
      case 'broadcast': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-700/50 h-full flex flex-col">
      <div className="p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center">
            <span className="text-xl sm:text-2xl mr-2">📊</span>
            Live Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">
              {displayActivities.length} activities
            </div>
            <button
              onClick={() => downloadActivityLog(displayActivities)}
              className="text-gray-400 hover:text-green-400 transition-colors text-sm"
              title="Download activity log as CSV"
            >
              📥
            </button>
            <button
              onClick={onClearActivity}
              className="text-gray-400 hover:text-red-400 transition-colors text-sm"
              title="Clear activity feed"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* 🔧 FIXED: Fixed height scrollable container - shows ~10 activities, scrolls to 100 */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-[650px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 border border-gray-700/30 rounded-lg p-3">
          {displayActivities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">🌙</div>
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as users interact with the system</p>
            </div>
          ) : (
            <>
              {/* Scrollable list of all activities within fixed height container */}
              {displayActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg transition-colors flex-shrink-0 bg-gray-700/50 hover:bg-gray-700/70"
                >
                  <div className="text-lg flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                        {activity.description}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-gray-400 mt-1 break-words">
                        {activity.details}
                      </p>
                    )}
                    {activity.roomCode && (
                      <span className="inline-block bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded mt-1">
                        {activity.roomCode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {displayActivities.length === 100 && (
                <div className="text-center text-gray-400 py-4 border-t border-gray-600/50">
                  <p className="text-xs">Showing last 100 activities • Older activities cleared from memory</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔧 ADDED: Scroll indicator for better UX */}
      {displayActivities.length > 8 && (
        <div className="px-4 sm:px-6 pb-2 flex-shrink-0">
          <div className="text-center">
            <div className="inline-flex items-center text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
              <span className="mr-1">📜</span>
              Scroll to see all {displayActivities.length} activities
            </div>
          </div>
        </div>
      )}
    </div>
  );
}