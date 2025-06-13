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

  // Mock analytics data for Vercel deployment
  // In a real implementation, this would query your database
  const dashboardData = {
    realTimeStats: {
      activeUsers: 0, // Would be calculated from WebSocket server
      activeRooms: 0,
      messagesPerMinute: 0,
      totalMessages: 0,
      peakConnections: 0,
      storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      userTrend: '+0%',
      roomTrend: '+0%',
      environment: process.env.NODE_ENV || 'production'
    },
    
    serverHealth: {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      cpuUsage: '5%',
      coldStarts: 0
    },
    
    networkStatus: {
      quality: 95,
      avgLatency: 25, // Vercel is typically faster
      deliveryRate: 99.8
    },
    
    messageFlow: {
      messagesPerMinute: 0,
      trend: '+0%',
      history: []
    },
    
    dbStats: {
      totalMessages: 0,
      totalRooms: 0,
      totalSessions: 0,
      recentActivity: 0,
      dbSize: 'N/A (Vercel)',
      oldestMessage: Date.now()
    },
    
    // Note about the split architecture
    note: {
      architecture: 'Hybrid Vercel + Cloud Run',
      frontend: 'Vercel (this API)',
      websocket: 'Google Cloud Run',
      limitation: 'Real-time stats require WebSocket server connection'
    },
    
    timestamp: Date.now(),
    databaseReady: false // Vercel uses in-memory storage
  };

  return NextResponse.json(dashboardData);
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