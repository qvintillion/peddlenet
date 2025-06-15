// 🌐 Mesh Network Status API - Custom WebRTC Implementation
// Provides mesh networking metrics and connection status

import { NextRequest, NextResponse } from 'next/server';
import { ServerUtils } from '@/utils/server-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 [Mesh API] Fetching mesh status...');
    
    // Get the server URL for backend requests
    const serverUrl = ServerUtils.getHttpServerUrl();
    const meshStatusUrl = `${serverUrl}/admin/mesh-status`;
    
    console.log('🌐 [Mesh API] Requesting:', meshStatusUrl);
    
    // Forward the request to the WebSocket server's mesh status endpoint
    const response = await fetch(meshStatusUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('th3p3ddl3r:letsmakeatrade').toString('base64'),
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('🌐 [Mesh API] Server responded with:', response.status, response.statusText);
      
      // If the WebSocket server isn't available, return mock data for development
      const mockMeshStatus = {
        metrics: {
          totalP2PAttempts: 0,
          successfulP2PConnections: 0,
          failedP2PConnections: 0,
          activeP2PConnections: 0,
          averageConnectionTime: 0,
          meshUpgradeRate: 0,
          p2pMessageCount: 0,
          fallbackCount: 0,
          currentP2PUsers: 0,
          totalActiveUsers: 0,
          roomsWithMesh: 0
        },
        connections: [],
        topology: {},
        summary: {
          totalConnections: 0,
          p2pActiveConnections: 0,
          totalRoomsWithUsers: 0,
          roomsWithMesh: 0,
          averageLatency: 0
        },
        timestamp: Date.now(),
        phase: 'Phase 1 - Custom WebRTC Implementation',
        status: {
          p2pEnabled: true,
          signalingActive: false, // Server not available
          meshUpgradeAvailable: false
        },
        error: 'WebSocket server not available - showing mock data'
      };
      
      return NextResponse.json(mockMeshStatus);
    }
    
    const meshData = await response.json();
    console.log('🌐 [Mesh API] Successfully fetched mesh status');
    
    return NextResponse.json(meshData);
    
  } catch (error) {
    console.error('🌐 [Mesh API] Error fetching mesh status:', error);
    
    // Return mock data for development when server is not available
    const mockMeshStatus = {
      metrics: {
        totalP2PAttempts: 0,
        successfulP2PConnections: 0,
        failedP2PConnections: 0,
        activeP2PConnections: 0,
        averageConnectionTime: 0,
        meshUpgradeRate: 0,
        p2pMessageCount: 0,
        fallbackCount: 0,
        currentP2PUsers: 0,
        totalActiveUsers: 0,
        roomsWithMesh: 0
      },
      connections: [],
      topology: {},
      summary: {
        totalConnections: 0,
        p2pActiveConnections: 0,
        totalRoomsWithUsers: 0,
        roomsWithMesh: 0,
        averageLatency: 0
      },
      timestamp: Date.now(),
      phase: 'Phase 1 - Custom WebRTC Implementation',
      status: {
        p2pEnabled: true,
        signalingActive: false,
        meshUpgradeAvailable: false
      },
      error: `Development mode - WebSocket server not available: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    
    return NextResponse.json(mockMeshStatus);
  }
}
