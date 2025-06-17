// Mobile Connection Debug Utility - Festival Chat
// Available as window.MobileConnectionDebug

class MobileConnectionDebug {
  constructor() {
    this.isActive = false;
    this.connectionLog = [];
    this.maxLogEntries = 50;
    this.startTime = Date.now();
  }

  // Start detailed connection monitoring
  start() {
    if (this.isActive) {
      console.log('📱 Mobile connection debug already active');
      return;
    }

    this.isActive = true;
    this.connectionLog = [];
    console.log('📱 Mobile Connection Debug STARTED - Monitoring connections...');
    
    // Monitor circuit breaker state
    this.circuitBreakerMonitor = setInterval(() => {
      if (typeof window !== 'undefined' && window.ConnectionResilience) {
        const state = window.ConnectionResilience.getState();
        if (state.isOpen || state.failureCount > 0) {
          this.log('🔴 Circuit Breaker', {
            isOpen: state.isOpen,
            failures: state.failureCount,
            successes: state.successCount,
            lastFailure: state.lastFailureTime ? new Date(state.lastFailureTime).toLocaleTimeString() : 'never'
          });
        }
      }
    }, 5000);

    // Monitor server utils if available
    this.serverUtilsMonitor = setInterval(() => {
      if (typeof window !== 'undefined' && window.ServerUtils) {
        const env = window.ServerUtils.getEnvironmentInfo();
        this.log('🌐 Environment', {
          mode: env.environment,
          wsUrl: env.webSocketUrl,
          httpUrl: env.httpUrl,
          protocol: env.protocol
        });
      }
    }, 10000);

    // Test connection every 30 seconds
    this.connectionTest = setInterval(() => {
      this.testConnection();
    }, 30000);

    console.log('📱 Debug monitors started - Use window.MobileConnectionDebug.stop() to end');
  }

  // Stop monitoring
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    clearInterval(this.circuitBreakerMonitor);
    clearInterval(this.serverUtilsMonitor);
    clearInterval(this.connectionTest);
    
    console.log('📱 Mobile Connection Debug STOPPED');
    this.showSummary();
  }

  // Log connection events
  log(type, data) {
    const entry = {
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      data,
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };

    this.connectionLog.push(entry);
    
    // Keep log size manageable
    if (this.connectionLog.length > this.maxLogEntries) {
      this.connectionLog.shift();
    }

    console.log(`📱 ${type}:`, data);
  }

  // Test current connection
  async testConnection() {
    if (typeof window === 'undefined') return;

    try {
      // Test server health if ServerUtils available
      if (window.ServerUtils) {
        const healthTest = await window.ServerUtils.testHttpHealth();
        this.log('🏥 Health Check', {
          success: healthTest.success,
          error: healthTest.error,
          latency: 'measured'
        });
      }

      // Test basic connectivity
      const start = Date.now();
      const response = await fetch(window.location.origin, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const latency = Date.now() - start;
      
      this.log('🌍 Frontend Test', {
        status: response.status,
        latency: `${latency}ms`,
        ok: response.ok
      });

    } catch (error) {
      this.log('❌ Connection Test Failed', {
        error: error.message,
        type: error.name
      });
    }
  }

  // Get current connection state
  getConnectionState() {
    const state = {
      timestamp: Date.now(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      logEntries: this.connectionLog.length,
      isActive: this.isActive
    };

    if (typeof window !== 'undefined') {
      // Circuit breaker state
      if (window.ConnectionResilience) {
        state.circuitBreaker = window.ConnectionResilience.getState();
      }

      // Server utils state
      if (window.ServerUtils) {
        state.environment = window.ServerUtils.getEnvironmentInfo();
      }

      // Network state
      if (navigator.onLine !== undefined) {
        state.networkOnline = navigator.onLine;
      }

      if (navigator.connection) {
        state.connectionType = navigator.connection.effectiveType;
        state.downlink = navigator.connection.downlink;
      }
    }

    return state;
  }

  // Show detailed log
  showLog(filter = null) {
    const filteredLog = filter ? 
      this.connectionLog.filter(entry => entry.type.toLowerCase().includes(filter.toLowerCase())) :
      this.connectionLog;

    console.log(`📱 Connection Log (${filteredLog.length} entries):`);
    console.table(filteredLog.map(entry => ({
      Time: entry.time,
      Type: entry.type,
      Uptime: `${entry.uptime}s`,
      Data: JSON.stringify(entry.data)
    })));
  }

  // Show summary
  showSummary() {
    const summary = {
      totalEntries: this.connectionLog.length,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      types: {}
    };

    // Count entry types
    this.connectionLog.forEach(entry => {
      summary.types[entry.type] = (summary.types[entry.type] || 0) + 1;
    });

    console.log('📱 Connection Debug Summary:', summary);
    return summary;
  }

  // Reset circuit breaker (emergency)
  resetCircuitBreaker() {
    if (typeof window !== 'undefined' && window.ConnectionResilience) {
      window.ConnectionResilience.reset();
      this.log('🔄 Circuit Breaker Reset', { manual: true });
      console.log('🔄 Circuit breaker manually reset');
    } else {
      console.log('❌ ConnectionResilience not available');
    }
  }

  // Force connection test
  async forceTest() {
    console.log('📱 Running forced connection test...');
    await this.testConnection();
    console.log('📱 Forced test complete - check log above');
  }

  // Get help
  help() {
    console.log(`
📱 Mobile Connection Debug Commands:

window.MobileConnectionDebug.start()              - Start monitoring
window.MobileConnectionDebug.stop()               - Stop monitoring
window.MobileConnectionDebug.getConnectionState() - Current state
window.MobileConnectionDebug.showLog()            - Show full log
window.MobileConnectionDebug.showLog('error')     - Show filtered log
window.MobileConnectionDebug.showSummary()        - Show summary stats
window.MobileConnectionDebug.resetCircuitBreaker() - Emergency reset
window.MobileConnectionDebug.forceTest()          - Test now
window.MobileConnectionDebug.help()               - This help

Also available:
window.ConnectionResilience.getState()            - Circuit breaker state
window.ServerUtils.getEnvironmentInfo()           - Server environment
    `);
  }
}

// Make globally available - use setTimeout to avoid initialization issues
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).MobileConnectionDebug = new MobileConnectionDebug();
      console.log('📱 Mobile Connection Debug available as window.MobileConnectionDebug');
      console.log('📱 Type window.MobileConnectionDebug.help() for commands');
    } catch (error) {
      console.warn('MobileConnectionDebug initialization failed:', error);
    }
  }, 0);
}

export default MobileConnectionDebug;