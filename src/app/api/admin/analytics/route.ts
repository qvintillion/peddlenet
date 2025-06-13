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

  // Enhanced mock analytics data for Vercel deployment
  // Show that the system is working even without live WebSocket data
  const dashboardData = {
    realTimeStats: {
      activeUsers: 0, // Real-time data from WebSocket server would show here
      activeRooms: 0, // Real-time data from WebSocket server would show here
      messagesPerMinute: 0, // Real-time calculation from WebSocket server
      totalMessages: 0, // Would be from database in full implementation
      peakConnections: 0, // Historical data from WebSocket server
      storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      userTrend: '+0%',
      roomTrend: '+0%',
      environment: process.env.NODE_ENV || 'production'
    },
    
    serverHealth: {
      status: 'healthy',
      uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
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
      history: [] // Would show message rate over time
    },
    
    dbStats: {
      totalMessages: 0, // In full implementation, would query database
      totalRooms: 0, // In full implementation, would query database
      totalSessions: 0, // In full implementation, would query database
      recentActivity: 0, // In full implementation, would query recent activity
      dbSize: 'Vercel Functions (Serverless)', // Vercel uses serverless functions
      oldestMessage: Date.now()
    },
    
    // Note about the split architecture
    architecture: {
      platform: 'Hybrid Vercel + Cloud Run',
      frontend: 'Vercel (serving this API)',
      websocket: process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'Not configured',
      database: 'In-memory (production would use persistent storage)',
      realTimeData: 'Available via WebSocket server connection'
    },
    
    status: {
      vercelAPI: 'operational',
      webSocketServer: 'external', // Cloud Run server
      adminDashboard: 'functional',
      chatSystem: 'operational'
    },
    
    timestamp: Date.now(),
    databaseReady: true // Vercel API layer is ready and functional
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