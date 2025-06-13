# Admin Analytics API Reference

**Version**: 3.0.0-analytics-enhanced  
**Updated**: June 13, 2025  
**Major Update**: Added detailed user/room management endpoints and fixed user counting logic

## 🚀 Quick Access

**Admin Dashboard URL**: `http://localhost:3000/admin-analytics` (dev) | `https://your-domain.com/admin-analytics` (prod)
**Dashboard Title**: **PeddleNet Analytics** (updated from "Festival Chat Analytics")

## ✅ Recent Fixes & Improvements

### Fixed User Counting Logic
- **Old Logic**: `Active Users = Total Connections - Admin Connections` ❌
- **New Logic**: `Active Users = Sum of all people actually in chat rooms` ✅
- **Result**: Admin dashboards no longer inflate user counts

### Cleaned Up Admin Interface
- **Removed**: Confusing duplicate "DEV: FORCE CLEAR" button
- **Kept**: Single red "WIPE ENTIRE DATABASE" button with proper confirmation
- **Improved**: Cleaner admin controls interface

## 📊 Analytics Endpoints

### Get Dashboard Data
```
GET /admin/analytics
```
**Returns**: Complete dashboard data including real-time stats, server health, network status, and database statistics.

**Response Structure**:
```json
{
  "realTimeStats": {
    "activeUsers": 5,
    "activeRooms": 2,
    "messagesPerMinute": 12,
    "totalMessages": 1847,
    "peakConnections": 15,
    "storageUsed": 45,
    "userTrend": "+5%",
    "roomTrend": "+2%",
    "environment": "development"
  },
  "serverHealth": {
    "status": "healthy",
    "uptime": "2h 15m 30s",
    "memoryUsed": 128,
    "memoryTotal": 512,
    "cpuUsage": "15%",
    "coldStarts": 0
  },
  "networkStatus": {
    "quality": 95,
    "avgLatency": 45,
    "deliveryRate": 99.5
  },
  "dbStats": {
    "totalMessages": 1847,
    "totalRooms": 8,
    "totalSessions": 23,
    "recentActivity": 156,
    "dbSize": "2.5MB",
    "oldestMessage": 1649773068315
  },
  "timestamp": 1649773068315,
  "databaseReady": true
}
```

### Get Activity Feed
```
GET /admin/activity?limit=20
```
**Parameters**:
- `limit` (optional): Number of activities to return (default: 20, max: 100)

**Response**:
```json
{
  "activities": [
    {
      "id": 1649773068315.123,
      "type": "user-joined",
      "data": {
        "roomId": "main-stage-chat",
        "peerId": "abc123",
        "displayName": "FestivalGoer42"
      },
      "timestamp": 1649773068315,
      "icon": "👥"
    }
  ],
  "total": 50,
  "timestamp": 1649773068315
}
```

### Get Room Analytics
```
GET /admin/room/:roomId/analytics
```
**Returns**: Detailed analytics for a specific room.

### Get Room Message History
```
GET /admin/room/:roomId/messages?limit=100
```
**Parameters**:
- `limit` (optional): Number of messages to return (default: 100)

**Returns**: Message history for the specified room (last 24 hours).

## 📊 NEW: Detailed User & Room Management

### Get Detailed Active Users
```
GET /admin/users/detailed
```
**Returns**: Comprehensive data about all active users currently in chat rooms, plus recent session history.

**Response Structure**:
```json
{
  "activeUsers": [
    {
      "socketId": "abc123",
      "peerId": "27fd9a10-ada7-49a7-9010-5b2baf22f46c",
      "displayName": "FestivalGoer42",
      "roomId": "main-stage-chat",
      "joinedAt": 1749774639833,
      "duration": 45000,
      "isActive": true
    }
  ],
  "recentSessions": [
    {
      "id": "session-123",
      "room_id": "main-stage-chat",
      "user_id": "27fd9a10-ada7-49a7-9010-5b2baf22f46c",
      "display_name": "FestivalGoer42",
      "joined_at": "2025-06-13 00:30:39",
      "left_at": "2025-06-13 00:34:05",
      "duration": 205821,
      "messages_sent": 5
    }
  ],
  "summary": {
    "totalActive": 1,
    "uniqueUsers": 1,
    "totalRooms": 1,
    "timestamp": 1749775232004
  }
}
```

**Use Cases**:
- Build detailed user management interfaces
- Monitor user session durations
- Identify duplicate users or inactive sessions
- Analytics on user engagement patterns

### Get Detailed Active Rooms
```
GET /admin/rooms/detailed
```
**Returns**: Comprehensive analytics for all active rooms with user lists, message counts, and activity metrics.

**Response Structure**:
```json
{
  "activeRooms": [
    {
      "roomId": "main-stage-chat",
      "roomCode": "epic-wave-96",
      "activeUsers": 3,
      "userList": [
        {
          "peerId": "abc123",
          "displayName": "User1",
          "joinedAt": 1749774639833
        }
      ],
      "created": 1749774639832,
      "lastActivity": 1749775232000,
      "totalMessages": 47,
      "uniqueUsers": 5
    }
  ],
  "summary": {
    "totalRooms": 1,
    "totalActiveUsers": 3,
    "totalMessages": 47,
    "timestamp": 1749775232004
  }
}
```

**Features**:
- **Sorted by activity**: Most recently active rooms first
- **Real-time user lists**: See who's currently in each room
- **Message analytics**: Total and recent message counts
- **Room codes**: Easy sharing codes for each room

### Remove User from Room
```
POST /admin/users/:peerId/remove
```
**Parameters**:
- `peerId` (URL): The peer ID of the user to remove

**Body**:
```json
{
  "roomId": "main-stage-chat",
  "reason": "Violation of community guidelines"
}
```

**Response**:
```json
{
  "success": true,
  "removedUser": {
    "peerId": "27fd9a10-ada7-49a7-9010-5b2baf22f46c",
    "displayName": "FestivalGoer42",
    "roomId": "main-stage-chat"
  },
  "reason": "Violation of community guidelines",
  "timestamp": 1749775232004
}
```

**What Happens**:
1. **User is disconnected** from the room immediately
2. **Other users are notified** of the removal
3. **User receives message** explaining the removal
4. **Admin action is logged** in the activity feed
5. **User must re-enter display name** to rejoin

**Error Response** (404):
```json
{
  "success": false,
  "error": "User not found in specified room"
}
```

## 🛡️ Admin Control Endpoints

### Emergency Broadcast
```
POST /admin/broadcast
```
**Body**:
```json
{
  "message": "Emergency announcement text",
  "targetRooms": "all",
  "priority": "normal"
}
```

**Response**:
```json
{
  "success": true,
  "messagesSent": 25,
  "targetRooms": "all",
  "timestamp": 1649773068315
}
```

### Clear Room Messages
```
DELETE /admin/room/:roomId/messages
```
**Response**:
```json
{
  "success": true,
  "roomId": "main-stage-chat",
  "messagesDeleted": 47,
  "timestamp": 1649773068315
}
```

### Database Wipe
```
DELETE /admin/database
```
**Body**:
```json
{
  "confirm": "WIPE_EVERYTHING"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Database completely wiped - all data cleared",
  "operations": [
    {
      "query": "DELETE FROM messages",
      "success": true,
      "rowsAffected": 1847
    }
  ],
  "verification": {
    "messagesBefore": 1847,
    "messagesAfter": 0,
    "inMemoryBefore": {
      "messageStore": 2,
      "roomActivity": 3,
      "rooms": 2,
      "totalMessages": 1847
    },
    "inMemoryAfter": {
      "messageStore": 0,
      "roomActivity": 0,
      "rooms": 0,
      "totalMessages": 0
    }
  },
  "timestamp": 1649773068315
}
```

## 🔧 Debug Endpoints (Development Only)

### Room State Debug
```
GET /debug/rooms
```
**Returns**: Current room state, connections, analytics data, and **NEW** detailed user calculation breakdown.

**Enhanced Response**:
```json
{
  "rooms": [...],
  "roomCodes": [...],
  "analytics": {...},
  "stats": {...},
  "adminConnections": {
    "count": 2,
    "socketIds": ["abc123", "def456"]
  },
  "userCalculation": {
    "totalConnections": 4,
    "adminConnections": 2,
    "roomParticipants": 1,
    "calculatedActiveUsers": 1,
    "oldCalculation": 2
  }
}
```

**New Features**:
- **Admin connection tracking**: See exactly which connections are admin dashboards
- **User calculation breakdown**: Debug the fixed user counting logic
- **Room participant counting**: Verify actual chat participants

## 🔌 WebSocket Events

### Admin Dashboard Events
Subscribe to real-time updates by joining the admin channel:
```javascript
socket.emit('join-admin');
```

**Events Received**:
- `dashboard-data` - Updated dashboard data every 5 seconds
- `live-activity` - Real-time activity as it happens
- `room-cleared` - Notification when room messages are cleared

### Database Wipe Events
```javascript
socket.on('database-wiped', (data) => {
  // Handle database wipe notification
  // Clear local state, reload if needed
});

socket.on('force-refresh', (data) => {
  // Handle force refresh notification
  // Clear all local data
});
```

## 🔒 Security & Authentication

### Current Security Model
- **Development**: Open access for debugging
- **Production**: Should implement proper authentication

### Recommended Security Enhancements
1. **JWT Authentication**: Require admin tokens
2. **Role-Based Access**: Different permission levels
3. **Rate Limiting**: Prevent abuse of admin endpoints
4. **IP Whitelisting**: Restrict admin access to specific IPs
5. **Audit Logging**: Track all admin actions

## 📱 Mobile API Considerations

### Responsive Data Format
All endpoints return mobile-friendly data with:
- **Simplified objects** for easy parsing
- **Consistent timestamps** in milliseconds
- **Error objects** with clear messages
- **Pagination support** for large datasets

### Network Resilience
- **Timeout handling**: All requests timeout after 30 seconds
- **Retry logic**: Exponential backoff for failed requests
- **Offline support**: Local caching where appropriate

## 🚨 Error Handling

### Standard Error Response
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": 1649773068315,
  "details": {
    "additional": "context"
  }
}
```

### Common Error Codes
- `DATABASE_NOT_READY` - Database connection not established
- `INVALID_ROOM_ID` - Room ID not found or invalid
- `CONFIRMATION_REQUIRED` - Dangerous operation needs confirmation
- `RATE_LIMITED` - Too many requests, slow down
- `UNAUTHORIZED` - Admin access required

## 🔧 Integration Examples

### React Component Integration
```javascript
import { useState, useEffect } from 'react';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/admin/analytics');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  if (!dashboardData) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Active Users: {dashboardData.realTimeStats.activeUsers}</h1>
      <h2>Active Rooms: {dashboardData.realTimeStats.activeRooms}</h2>
    </div>
  );
}
```

### 🆕 NEW: Detailed User Management Integration
```javascript
import { useState, useEffect } from 'react';

function DetailedUserView() {
  const [userDetails, setUserDetails] = useState(null);
  const [sortBy, setSortBy] = useState('joinedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch('/admin/users/detailed');
        const data = await response.json();
        setUserDetails(data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };
    
    fetchUserDetails();
    const interval = setInterval(fetchUserDetails, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const handleRemoveUser = async (peerId, roomId, reason) => {
    try {
      const response = await fetch(`/admin/users/${peerId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, reason })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('User removed:', result.removedUser);
        // Refresh user list
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };
  
  const sortedUsers = userDetails?.activeUsers.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  }) || [];
  
  return (
    <div>
      <h2>Active Users ({userDetails?.summary.totalActive})</h2>
      
      {/* Sort Controls */}
      <div>
        <button onClick={() => setSortBy('joinedAt')}>Sort by Join Time</button>
        <button onClick={() => setSortBy('duration')}>Sort by Duration</button>
        <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>  
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      
      {/* User List */}
      <table>
        <thead>
          <tr>
            <th>Display Name</th>
            <th>Room</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map(user => (
            <tr key={user.peerId}>
              <td>{user.displayName}</td>
              <td>{user.roomId}</td>
              <td>{Math.floor(user.duration / 1000)}s</td>
              <td>
                <button 
                  onClick={() => handleRemoveUser(user.peerId, user.roomId, 'Admin removal')}
                  className="remove-btn"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 🆕 NEW: Detailed Room Management Integration
```javascript
function DetailedRoomView() {
  const [roomDetails, setRoomDetails] = useState(null);
  
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await fetch('/admin/rooms/detailed');
        const data = await response.json();
        setRoomDetails(data);
      } catch (error) {
        console.error('Failed to fetch room details:', error);
      }
    };
    
    fetchRoomDetails();
    const interval = setInterval(fetchRoomDetails, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return minutes < 1 ? 'Just now' : `${minutes}m ago`;
  };
  
  return (
    <div>
      <h2>Active Rooms ({roomDetails?.summary.totalRooms})</h2>
      
      {roomDetails?.activeRooms.map(room => (
        <div key={room.roomId} className="room-card">
          <h3>{room.roomId}</h3>
          <div className="room-stats">
            <span>Code: {room.roomCode}</span>
            <span>Users: {room.activeUsers}</span>
            <span>Messages: {room.totalMessages}</span>
            <span>Last Active: {getTimeSince(room.lastActivity)}</span>
          </div>
          
          <div className="user-list">
            <h4>Current Users:</h4>
            {room.userList.map(user => (
              <div key={user.peerId} className="user-item">
                {user.displayName} ({getTimeSince(user.joinedAt)})
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Emergency Broadcast Example
```javascript
async function sendEmergencyBroadcast(message) {
  try {
    const response = await fetch('/admin/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        targetRooms: 'all',
        priority: 'high'
      })
    });
    
    const result = await response.json();
    console.log(`Broadcast sent to ${result.messagesSent} users`);
  } catch (error) {
    console.error('Broadcast failed:', error);
  }
}
```

## 🎯 Performance Recommendations

### For High-Traffic Scenarios
1. **Cache dashboard data** on client-side for 5-10 seconds
2. **Implement pagination** for activity feed with large datasets
3. **Use WebSocket events** instead of polling for real-time updates
4. **Optimize database queries** with proper indexing
5. **Consider Redis caching** for frequently accessed analytics

### Mobile Performance
1. **Reduce data payload** on mobile connections
2. **Implement offline caching** for critical dashboard data
3. **Use progressive loading** for large datasets
4. **Optimize for slow networks** with request timeouts

---

## 🚧 Remaining Frontend Implementation

### 🔴 PENDING: Clickable MetricCards
**Status**: Backend ready, frontend needed

**Required Work**:
1. **Make Active Users card clickable** → Opens DetailedUserView modal
2. **Make Active Rooms card clickable** → Opens DetailedRoomView modal
3. **Implement sorting functionality** (by join time, duration, activity)
4. **Add user removal UI** with confirmation dialogs
5. **Real-time updates** in detail modals

**Example Implementation**:
```javascript
// In MetricCard component
function MetricCard({ title, value, onClick, ...props }) {
  return (
    <div 
      className={`metric-card ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      {/* existing card content */}
    </div>
  );
}

// In main dashboard
<MetricCard
  title="Active Users"
  value={dashboardData.realTimeStats.activeUsers}
  onClick={() => setShowUserDetails(true)}
  icon="👥"
  color="green"
/>
```

### 🟡 PLANNED: Advanced Features
1. **Duplicate user detection** and cleanup
2. **Bulk user management** (select multiple users)
3. **Room analytics graphs** (message activity over time)
4. **Export user/room data** to CSV
5. **Real-time notifications** for admin actions

---

**Next Steps**: 
1. ✅ **Backend complete** - All endpoints working
2. 🚧 **Frontend implementation** - Build clickable cards and modals
3. 🔒 **Authentication** - Add proper admin security
4. 📊 **Enhanced analytics** - More granular insights
5. 🎪 **Festival optimization** - Scale for high-traffic events
