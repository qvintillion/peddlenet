import { useState } from 'react';

// Real server activity structure
interface ServerActivity {
  id: number;
  type: string; // 'user-joined', 'user-left', 'message-sent', 'room-created', 'room-deleted', 'admin-action'
  data: any;
  timestamp: number;
  icon: string;
}

// Frontend display structure
interface Activity {
  id: string;
  type: 'user_join' | 'user_leave' | 'message' | 'room_create' | 'room_delete' | 'broadcast';
  timestamp: number;
  description: string;
  details?: string;
  roomCode?: string;
  username?: string;
}

interface ActivityFeedProps {
  activities: ServerActivity[]; // Accept real server activities
  onClearActivity: () => void;
}

export function ActivityFeed({ activities, onClearActivity }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        frontendType = 'broadcast';
        description = `Admin action: ${data.action || 'Unknown'}`;
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

  // Convert all server activities to display activities
  const displayActivities = activities.map(convertServerActivity);

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
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="text-2xl mr-2">📊</span>
            Live Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">
              {displayActivities.length} activities
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '📋' : '📊'}
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

      {isExpanded ? (
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-3 pr-2">
            {displayActivities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🌙</div>
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as users interact with the system</p>
              </div>
            ) : (
              displayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors flex-shrink-0"
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
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4 flex-shrink-0">
          <p className="text-sm">Activity feed collapsed - {displayActivities.length} activities hidden</p>
        </div>
      )}
    </div>
  );
}