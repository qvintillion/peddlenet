import { NextRequest, NextResponse } from 'next/server';

// Required for export builds
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return NextResponse.json({
    adminDashboard: 'Festival Chat Admin Dashboard',
    version: '1.0.0-vercel',
    authRequired: true,
    environment: process.env.NODE_ENV || 'production',
    platform: 'vercel',
    securityNote: 'Authentication required for admin access',
    endpoints: {
      analytics: '/api/admin/analytics',
      info: '/api/admin/info'
    },
    architecture: {
      frontend: 'Vercel Next.js',
      api: 'Vercel Serverless Functions',
      websocket: 'Google Cloud Run',
      note: 'Hybrid deployment for optimal performance'
    },
    timestamp: Date.now()
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}