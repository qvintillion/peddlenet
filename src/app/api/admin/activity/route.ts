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

  // Mock activity data for Vercel deployment
  // In a real implementation, this would come from your database or cache
  const mockActivities = [
    {
      id: Date.now(),
      type: 'server-start',
      data: { environment: 'vercel', platform: 'vercel' },
      timestamp: Date.now(),
      icon: '🚀'
    },
    {
      id: Date.now() - 1000,
      type: 'admin-action', 
      data: { action: 'dashboard-accessed', platform: 'vercel' },
      timestamp: Date.now() - 1000,
      icon: '🛡️'
    }
  ];

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  return NextResponse.json({
    activities: mockActivities.slice(0, limit),
    total: mockActivities.length,
    timestamp: Date.now(),
    note: 'Vercel deployment - limited activity tracking'
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