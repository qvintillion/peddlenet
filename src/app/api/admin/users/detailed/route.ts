import { NextRequest, NextResponse } from 'next/server';

// Simple authentication check
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  const validUsername = process.env.ADMIN_USERNAME || 'th3p3ddl3r';
  const validPassword = process.env.ADMIN_PASSWORD || 'letsmakeatrade';
  
  return username === validUsername && password === validPassword;
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Festival Chat Admin Dashboard"'
        }
      }
    );
  }

  // Mock detailed user data for Vercel deployment
  // In a real implementation, this would query your database and WebSocket server
  const mockDetailedUsers = {
    activeUsers: [], // No active users in Vercel (WebSocket server would have this data)
    recentSessions: [
      {
        id: 'session_1',
        room_id: 'demo-room-123',
        user_id: 'user_1',
        display_name: 'Festival Goer',
        joined_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        left_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        duration: 240000, // 4 minutes
        messages_sent: 5
      },
      {
        id: 'session_2',
        room_id: 'main-stage-456',
        user_id: 'user_2',
        display_name: 'Music Lover',
        joined_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        left_at: null, // Still active
        duration: 600000, // 10 minutes
        messages_sent: 12
      }
    ],
    summary: {
      totalActive: 0, // Vercel doesn't track active connections
      uniqueUsers: 2,
      totalRooms: 2,
      timestamp: Date.now()
    }
  };

  return NextResponse.json({
    ...mockDetailedUsers,
    platform: 'vercel',
    note: 'Vercel deployment - limited user tracking. Real-time user data requires WebSocket server integration.',
    webSocketServer: process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'Not configured'
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}