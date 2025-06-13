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

  // Mock detailed room data for Vercel deployment
  // In a real implementation, this would query your database and WebSocket server
  const mockDetailedRooms = {
    activeRooms: [], // No active rooms tracked in Vercel (WebSocket server would have this data)
    summary: {
      totalRooms: 0, // Vercel doesn't track active rooms
      totalActiveUsers: 0,
      totalMessages: 0,
      timestamp: Date.now()
    }
  };

  return NextResponse.json({
    ...mockDetailedRooms,
    platform: 'vercel',
    note: 'Vercel deployment - limited room tracking. Real-time room data requires WebSocket server integration.',
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