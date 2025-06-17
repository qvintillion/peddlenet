/**
 * Connection resilience utilities for PeddleNet
 * Handles retry logic, connection health, and status detection
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  lastSuccessfulConnection: number;
  consecutiveFailures: number;
  infrastructureStatus: 'healthy' | 'degraded' | 'outage';
  lastErrorType: string;
}

export interface ConnectionMetrics {
  timestamp: number;
  connectionTime: number;
  success: boolean;
  errorType: string;
  attemptNumber: number;
}

/**
 * Exponential backoff retry logic
 */
export const connectionRetry = async <T>(
  connectFn: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  onAttempt: (attempt: number, error: any) => void
): Promise<{ success: boolean; result: T; metrics: ConnectionMetrics[] }> => {
  const metrics: ConnectionMetrics[] = [];
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Connection attempt ${attempt}/${config.maxAttempts}`);
      onAttempt?.(attempt);
      
      const result = await connectFn();
      const connectionTime = Date.now() - startTime;
      
      metrics.push({
        timestamp: startTime,
        connectionTime,
        success: true,
        attemptNumber: attempt
      });
      
      console.log(`✅ Connection successful on attempt ${attempt} (${connectionTime}ms)`);
      return { success: true, result, metrics };
      
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      const errorType = error instanceof Error ? error.message : 'unknown';
      
      metrics.push({
        timestamp: startTime,
        connectionTime,
        success: false,
        errorType,
        attemptNumber: attempt
      });
      
      console.log(`❌ Connection attempt ${attempt} failed:`, errorType);
      onAttempt?.(attempt, error);
      
      if (attempt < config.maxAttempts) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { success: false, metrics };
};

/**
 * Connection health monitoring
 */
export class ConnectionHealthMonitor {
  private static instance: ConnectionHealthMonitor;
  private health: ConnectionHealth;
  private recentMetrics: ConnectionMetrics[] = [];
  private listeners: Set<(health: ConnectionHealth) => void> = new Set();

  private constructor() {
    this.health = {
      isHealthy: true,
      lastSuccessfulConnection: Date.now(),
      consecutiveFailures: 0,
      infrastructureStatus: 'healthy'
    };
  }

  static getInstance(): ConnectionHealthMonitor {
    if (!ConnectionHealthMonitor.instance) {
      ConnectionHealthMonitor.instance = new ConnectionHealthMonitor();
    }
    return ConnectionHealthMonitor.instance;
  }

  addListener(listener: (health: ConnectionHealth) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  recordConnectionAttempt(metrics: ConnectionMetrics): void {
    this.recentMetrics.push(metrics);
    
    // Keep only last 50 metrics
    if (this.recentMetrics.length > 50) {
      this.recentMetrics = this.recentMetrics.slice(-50);
    }

    if (metrics.success) {
      this.health.lastSuccessfulConnection = metrics.timestamp;
      this.health.consecutiveFailures = 0;
      this.health.isHealthy = true;
    } else {
      this.health.consecutiveFailures++;
      this.health.lastErrorType = metrics.errorType;
    }

    this.updateInfrastructureStatus();
    this.notifyListeners();
  }

  private updateInfrastructureStatus(): void {
    const recentFailures = this.recentMetrics.filter(
      m => !m.success && Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const totalRecent = this.recentMetrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000
    ).length;

    if (totalRecent < 3) {
      // Not enough data
      this.health.infrastructureStatus = 'healthy';
      return;
    }

    const failureRate = recentFailures.length / totalRecent;
    
    if (failureRate > 0.8) {
      this.health.infrastructureStatus = 'outage';
      this.health.isHealthy = false;
    } else if (failureRate > 0.4 || this.health.consecutiveFailures > 3) {
      this.health.infrastructureStatus = 'degraded';
      this.health.isHealthy = false;
    } else {
      this.health.infrastructureStatus = 'healthy';
      this.health.isHealthy = this.health.consecutiveFailures < 2;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.health });
      } catch (error) {
        console.error('Error in health monitor listener:', error);
      }
    });
  }

  getHealth(): ConnectionHealth {
    return { ...this.health };
  }

  getErrorMessage(): { title: string; message: string; action: string; showDetails: boolean } {
    const { consecutiveFailures, infrastructureStatus, lastErrorType } = this.health;

    if (infrastructureStatus === 'outage') {
      return {
        title: "🔄 Service Temporarily Unavailable",
        message: "We're experiencing temporary connectivity issues. This usually resolves automatically within a few minutes.",
        action: "Try Again",
        showDetails: false
      };
    }

    if (infrastructureStatus === 'degraded') {
      return {
        title: "⚠️ Connection Issues", 
        message: "Network conditions are affecting connections. We're working to resolve this.",
        action: "Retry Connection",
        showDetails: false
      };
    }

    if (consecutiveFailures > 3) {
      return {
        title: "🌐 Network Issue",
        message: "Having trouble connecting. Please check your network connection and try again.",
        action: "Retry",
        showDetails: true
      };
    }

    return {
      title: "🔗 Connection Failed", 
      message: "Unable to establish connection. Please try again.",
      action: "Retry Connection",
      showDetails: true
    };
  }

  reset(): void {
    this.health = {
      isHealthy: true,
      lastSuccessfulConnection: Date.now(),
      consecutiveFailures: 0,
      infrastructureStatus: 'healthy'
    };
    this.notifyListeners();
  }
}

/**
 * Session persistence for reconnection after page refresh
 */
export class SessionPersistence {
  private static readonly STORAGE_KEY = 'peddlenet_session';
  
  static saveSession(roomId: string, displayName: string, peerId: string): void {
    const session = {
      roomId,
      displayName,
      peerId,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      console.log('📝 Session saved for reconnection');
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  static getSession(): { roomId: string; displayName: string; peerId: string } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      
      // Session expires after 1 hour
      if (Date.now() - session.timestamp > 60 * 60 * 1000) {
        this.clearSession();
        return null;
      }

      return {
        roomId: session.roomId,
        displayName: session.displayName,
        peerId: session.peerId
      };
    } catch (error) {
      console.warn('Failed to load session:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Session cleared');
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  static updatePeerId(peerId: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        session.peerId = peerId;
        session.timestamp = Date.now();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn('Failed to update peer ID in session:', error);
    }
  }
}
