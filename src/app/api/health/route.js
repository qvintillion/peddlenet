import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const detectEnvironment = () => {
    const host = request.headers.get('host') || '';
    const forwardedHost = request.headers.get('x-forwarded-host') || '';
    const url = request.url || '';
    
    if (
      host.includes('firebase') ||
      host.includes('web.app') ||
      url.includes('preview') ||
      host.includes('staging') ||
      host.includes('preview')
    ) {
      return 'staging';
    }
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'development';
    }
    
    return 'production';
  };
  
  const currentEnvironment = detectEnvironment();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: currentEnvironment,
    platform: 'vercel',
    version: '1.0.0'
  });
}
