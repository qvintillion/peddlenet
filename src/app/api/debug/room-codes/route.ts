import { NextRequest, NextResponse } from 'next/server';
import { RoomCodeStorage } from '@/lib/room-code-storage';

// Required for static export builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    const stats = RoomCodeStorage.getStats();
    const allMappings = RoomCodeStorage.getAll();
    
    return NextResponse.json({
      success: true,
      debug: 'Room code storage contents',
      ...stats,
      allMappings,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting room code debug info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
