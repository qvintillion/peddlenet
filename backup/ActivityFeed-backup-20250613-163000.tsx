import { useState } from 'react';

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
  activities: Activity[];
  onClearActivity: () => void;
}

export function ActivityFeed({ activities, onClearActivity }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
    <div className="bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-700/50 h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="text-2xl mr-2">📊</span>
            Live Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
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

        {isExpanded ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🌙</div>
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as users interact with the system</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                >
                  <div className="text-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                        {activity.description}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
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
        ) : (
          <div className="text-center text-gray-400 py-4">
            <p className="text-sm">Activity feed collapsed</p>
          </div>
        )}
      </div>
    </div>
  );
}