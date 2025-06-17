'use client';

import { useEffect, useRef } from 'react';

// 🔥 Performance tracking for connection optimization
export function useConnectionPerformance() {
  const startTime = useRef<number>(0);
  const metrics = useRef({
    connectionTime: 0,
    totalTime: 0,
    optimized: true
  });

  useEffect(() => {
    startTime.current = Date.now();
    console.log('⚡ PERFORMANCE: Connection attempt started at', new Date().toISOString());
    
    return () => {
      const totalTime = Date.now() - startTime.current;
      console.log(`⚡ PERFORMANCE: Total component lifecycle: ${totalTime}ms`);
    };
  }, []);

  const recordConnectionSuccess = (connectionStartTime: number) => {
    const connectionTime = Date.now() - connectionStartTime;
    const totalTime = Date.now() - startTime.current;
    
    metrics.current = {
      connectionTime,
      totalTime,
      optimized: connectionTime < 1000 // Under 1 second is optimized
    };
    
    console.log(`⚡ PERFORMANCE RESULTS:
      - Connection time: ${connectionTime}ms
      - Total time: ${totalTime}ms
      - Status: ${connectionTime < 500 ? '🚀 INSTANT' : connectionTime < 1000 ? '✅ FAST' : '⚠️ SLOW'}
      - Previous (before P2P): ~200-300ms
      - Target: <500ms
      - Current: ${connectionTime}ms`);
    
    // Log to window for easy access
    if (typeof window !== 'undefined') {
      window.connectionPerformance = {
        ...metrics.current,
        timestamp: new Date().toISOString()
      };
    }
  };

  return {
    recordConnectionSuccess,
    getMetrics: () => metrics.current
  };
}
