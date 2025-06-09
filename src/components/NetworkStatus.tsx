'use client';

import { useState, useEffect } from 'react';
import { ConnectionHealthMonitor, type ConnectionHealth } from '@/utils/connection-resilience';

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function NetworkStatus({ className = '', showDetails = false }: NetworkStatusProps) {
  const [health, setHealth] = useState<ConnectionHealth>(() => 
    ConnectionHealthMonitor.getInstance().getHealth()
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const monitor = ConnectionHealthMonitor.getInstance();
    const unsubscribe = monitor.addListener(setHealth);
    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    switch (health.infrastructureStatus) {
      case 'healthy': return health.isHealthy ? 'bg-green-500' : 'bg-yellow-500';
      case 'degraded': return 'bg-yellow-500';
      case 'outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (health.infrastructureStatus === 'outage') {
      return 'Service Unavailable';
    }
    if (health.infrastructureStatus === 'degraded') {
      return 'Connection Issues';
    }
    if (!health.isHealthy) {
      return 'Connection Problems';
    }
    return 'Connected';
  };

  const getStatusIcon = () => {
    switch (health.infrastructureStatus) {
      case 'healthy': return health.isHealthy ? '🟢' : '🟡';
      case 'degraded': return '⚠️';
      case 'outage': return '🔴';
      default: return '⚪';
    }
  };

  if (health.isHealthy && health.infrastructureStatus === 'healthy') {
    // Only show when there are issues
    return null;
  }

  return (
    <div className={`${className}`}>
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm text-gray-300">
          {getStatusText()}
        </span>
        {showDetails && (
          <span className="text-xs text-gray-500">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {isExpanded && showDetails && (
        <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs text-gray-300 border border-gray-600">
          <div className="space-y-1">
            <div>Status: {health.infrastructureStatus}</div>
            <div>Consecutive failures: {health.consecutiveFailures}</div>
            <div>
              Last success: {' '}
              {new Date(health.lastSuccessfulConnection).toLocaleTimeString()}
            </div>
            {health.lastErrorType && (
              <div>Last error: {health.lastErrorType}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ConnectionErrorProps {
  onRetry: () => void;
  isRetrying: boolean;
  className?: string;
}

export function ConnectionError({ onRetry, isRetrying, className = '' }: ConnectionErrorProps) {
  const [health] = useState<ConnectionHealth>(() => 
    ConnectionHealthMonitor.getInstance().getHealth()
  );

  const errorInfo = ConnectionHealthMonitor.getInstance().getErrorMessage();

  return (
    <div className={`p-4 bg-red-900/30 border border-red-500/30 rounded-lg ${className}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">❌</span>
        <div className="flex-1">
          <h3 className="font-medium text-red-200 mb-1">
            {errorInfo.title}
          </h3>
          <p className="text-sm text-red-300 mb-3">
            {errorInfo.message}
          </p>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              {isRetrying ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Retrying...
                </>
              ) : (
                errorInfo.action
              )}
            </button>
            
            {errorInfo.showDetails && (
              <NetworkStatus showDetails className="ml-auto" />
            )}
          </div>

          {health.infrastructureStatus === 'outage' && (
            <div className="mt-3 p-2 bg-blue-900/30 rounded text-xs text-blue-200 border border-blue-500/30">
              💡 <strong>Tip:</strong> This appears to be a temporary service issue. 
              These typically resolve automatically within 5-10 minutes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
