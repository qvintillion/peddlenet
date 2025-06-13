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

  // Enhanced mock activity data for Vercel deployment
  const now = Date.now();
  const mockActivities = [
    {
      id: now,
      type: 'admin-login',
      data: { 
        platform: 'vercel',
        environment: process.env.NODE_ENV || 'production',
        userAgent: 'Admin Dashboard'
      },
      timestamp: now,
      icon: '🔐'
    },
    {
      id: now - 1000,
      type: 'system-ready',
      data: { 
        component: 'Vercel API Layer',
        status: 'operational',
        endpoints: ['analytics', 'activity', 'broadcast', 'database', 'room management']
      },
      timestamp: now - 1000,
      icon: '✅'
    },
    {
      id: now - 2000,
      type: 'architecture-status',
      data: { 
        frontend: 'Vercel (operational)',
        websocket: 'Cloud Run (external)',
        database: 'In-memory (functional)'
      },
      timestamp: now - 2000,
      icon: '🏗️'
    },
    {
      id: now - 3000,
      type: 'admin-dashboard',
      data: { 
        action: 'dashboard-loaded',
        platform: 'vercel',
        features: ['analytics', 'user management', 'room management', 'broadcast']
      },
      timestamp: now - 3000,
      icon: '📊'
    },
    {
      id: now - 4000,
      type: 'server-info',
      data: { 
        platform: 'Vercel Functions',
        region: 'Auto (Edge)',
        status: 'healthy',
        uptime: `${Math.floor(process.uptime() / 60)}m`
      },
      timestamp: now - 4000,
      icon: '🖥️'
    }
  ];

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  return NextResponse.json({
    activities: mockActivities.slice(0, limit),
    total: mockActivities.length,
    platform: 'vercel',
    realTimeData: 'Live activity available via WebSocket server connection',
    timestamp: now
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