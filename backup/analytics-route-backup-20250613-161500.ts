import { NextRequest, NextResponse } from 'next/server';

// Simple authentication check for admin routes
function isAuthenticated(request: NextRequest): boolean {
  // In production, you'd want proper authentication
  // For now, we'll use a simple approach
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
  
  console.log('🔍 Admin Analytics: Attempting to fetch from WebSocket server:', wsServerUrl);
  
  try {
    // Fetch real data from your WebSocket server's admin endpoint
    console.log('📡 Making request to:', `${wsServerUrl}/admin/dashboard`);
    const response = await fetch(`${wsServerUrl}/admin/dashboard`, {
      headers: {
        'Authorization': request.headers.get('authorization') || ''
      },
      timeout: 5000
    });

    console.log('📊 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      // Return the real data from your WebSocket server
      const realData = await response.json();
      console.log('✅ Successfully fetched real data from WebSocket server:', realData);
      return NextResponse.json(realData);
    } else {
      // If WebSocket server is not available, fall back to basic data
      console.log('❌ WebSocket server responded with error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
    }
  } catch (error) {
    console.error('❌ Failed to fetch from WebSocket server:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }

  console.log('🚨 NO REAL DATA AVAILABLE - WebSocket server connection failed');
  console.log('🚨 Server URL attempted:', wsServerUrl);
  console.log('🚨 This means your WebSocket server is likely offline or the endpoint does not exist');

  // Return error state instead of fallback data
  return NextResponse.json({
    error: 'WebSocket server connection failed',
    serverUrl: wsServerUrl,
    message: 'Your WebSocket server is offline or the admin endpoint does not exist',
    timestamp: Date.now(),
    realTimeStats: {
      activeUsers: 0,
      activeRooms: 0,
      messagesPerMinute: 0,
      totalMessages: 0,
      peakConnections: 0,
      storageUsed: 0,
      userTrend: 'ERROR: WebSocket server offline',
      roomTrend: 'ERROR: WebSocket server offline',
      environment: 'ERROR'
    },
    serverHealth: {
      status: 'ERROR: WebSocket server offline',
      uptime: '0m 0s',
      memoryUsed: 0,
      memoryTotal: 0,
      cpuUsage: '0%',
      coldStarts: 0
    },
    networkStatus: {
      quality: 0,
      avgLatency: 0,
      deliveryRate: 0
    },
    dbStats: {
      totalMessages: 0,
      totalRooms: 0,
      totalSessions: 0,
      recentActivity: 'ERROR: WebSocket server offline',
      dbSize: 'ERROR',
      oldestMessage: Date.now()
    }
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