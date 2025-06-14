import { NextRequest, NextResponse } from 'next/server';

// Simple authentication check for admin routes
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Check credentials (allow environment override)
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

  // Get the WebSocket server URL from environment
  const wsServerUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER?.replace('wss://', 'https://').replace('ws://', 'http://') || 'http://localhost:8080';
  
  try {
    // Fetch real activity data from your WebSocket server
    const response = await fetch(`${wsServerUrl}/admin/activity`, {
      headers: {
        'Authorization': request.headers.get('authorization') || ''
      }
    });

    if (response.ok) {
      const realData = await response.json();
      return NextResponse.json(realData);
    } else {
      console.log('WebSocket server activity endpoint not available');
    }
  } catch (error) {
    console.error('Failed to fetch activity from WebSocket server:', error);
  }

  // Fallback: return demo activity when WebSocket server is unavailable
  const demoActivities = [
    {
      id: '1',
      type: 'user_join',
      timestamp: Date.now() - 30000, // 30 seconds ago
      description: 'User joined room',
      details: 'FestivalGoer1 joined main-stage',
      roomCode: 'main-stage',
      username: 'FestivalGoer1'
    },
    {
      id: '2',
      type: 'message',
      timestamp: Date.now() - 90000, // 1.5 minutes ago
      description: 'Message sent',
      details: 'New message in side-stage: "Great music tonight!"',
      roomCode: 'side-stage',
      username: 'MusicLover22'
    },
    {
      id: '3',
      type: 'user_leave',
      timestamp: Date.now() - 600000, // 10 minutes ago
      description: 'User left room',
      details: 'DanceFloor99 left dj-booth',
      roomCode: 'dj-booth',
      username: 'DanceFloor99'
    },
    {
      id: '4',
      type: 'room_create',
      timestamp: Date.now() - 1200000, // 20 minutes ago
      description: 'Room created',
      details: 'New room: Side Stage Chill',
      roomCode: 'side-stage'
    }
  ];

  return NextResponse.json({
    activities: demoActivities,
    totalActivities: demoActivities.length,
    timestamp: Date.now(),
    note: 'WebSocket server offline - showing demo activity for testing'
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