// Tab Visibility Override - Disable for Cross-Room Notifications
// This disables tab visibility tracking to enable background notifications

let originalVisibilityState: string | undefined;
let originalHidden: boolean | undefined;
let isBackgroundConnectionEnabled = true;

export function disableTabVisibilityTracking() {
  if (typeof document === 'undefined') return;
  
  console.log('🚫 Disabling tab visibility tracking for cross-room notifications');
  
  // Override document.visibilityState to always return 'visible'
  originalVisibilityState = document.visibilityState;
  Object.defineProperty(document, 'visibilityState', {
    get: () => isBackgroundConnectionEnabled ? 'visible' : originalVisibilityState,
    configurable: true
  });
  
  // Override document.hidden to always return false
  originalHidden = document.hidden;
  Object.defineProperty(document, 'hidden', {
    get: () => isBackgroundConnectionEnabled ? false : originalHidden,
    configurable: true
  });
  
  // Remove any existing visibilitychange event listeners
  const events = ['visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange', 'msvisibilitychange'];
  events.forEach(event => {
    document.removeEventListener(event, handleVisibilityChange, true);
    document.removeEventListener(event, handleVisibilityChange, false);
  });
  
  // Override addEventListener to prevent visibility tracking
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type: string, listener: any, options?: any) {
    if (events.includes(type) && isBackgroundConnectionEnabled) {
      console.log('🚫 Blocked tab visibility event listener:', type);
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Prevent page unload events that might disconnect sockets
  const preventUnload = (e: Event) => {
    if (isBackgroundConnectionEnabled) {
      console.log('🚫 Preventing page unload for background connection');
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  };
  
  // Override beforeunload and unload events
  window.addEventListener('beforeunload', preventUnload, true);
  window.addEventListener('unload', preventUnload, true);
  window.addEventListener('pagehide', preventUnload, true);
  
  // Prevent mobile app suspension
  if ('wakeLock' in navigator) {
    // Request wake lock to keep connection alive
    (navigator as any).wakeLock.request('screen').then(() => {
      console.log('🔒 Wake lock acquired for background connection');
    }).catch((err: any) => {
      console.log('⚠️ Wake lock failed (expected on some devices):', err);
    });
  }
  
  console.log('✅ Tab visibility tracking disabled - app will stay connected in background');
}

// Enhanced mobile background connection handling
export function enableBackgroundConnections() {
  if (typeof window === 'undefined') return;
  
  console.log('📱 Enabling background connections for cross-room notifications');
  
  // Override Page Visibility API
  disableTabVisibilityTracking();
  
  // Prevent connection drops on mobile network changes
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    connection.addEventListener('change', () => {
      console.log('📶 Network change detected - maintaining connection');
      // Don't disconnect on network changes
    });
  }
  
  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    if (typeof window !== 'undefined' && (window as any).socket) {
      const socket = (window as any).socket;
      if (socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
        console.log('💓 Background heartbeat sent');
      }
    }
  }, 30000); // Every 30 seconds
  
  // Store interval for cleanup
  (window as any).backgroundHeartbeat = heartbeatInterval;
  
  console.log('✅ Background connections enabled - will receive notifications when backgrounded');
}

export function disableBackgroundConnections() {
  isBackgroundConnectionEnabled = false;
  
  if (typeof window !== 'undefined' && (window as any).backgroundHeartbeat) {
    clearInterval((window as any).backgroundHeartbeat);
    delete (window as any).backgroundHeartbeat;
  }
  
  enableTabVisibilityTracking();
  console.log('🚫 Background connections disabled');
}

// Dummy handler to catch and ignore visibility changes
function handleVisibilityChange() {
  // Do nothing - we want to stay "visible"
}

export function enableTabVisibilityTracking() {
  if (typeof document === 'undefined') return;
  
  console.log('✅ Re-enabling tab visibility tracking');
  
  // Restore original properties if they were overridden
  if (originalVisibilityState !== undefined) {
    Object.defineProperty(document, 'visibilityState', {
      get: () => originalVisibilityState,
      configurable: true
    });
  }
  
  if (originalHidden !== undefined) {
    Object.defineProperty(document, 'hidden', {
      get: () => originalHidden,
      configurable: true
    });
  }
}

// Auto-initialize for cross-room notifications
if (typeof window !== 'undefined') {
  // Wait for app to load
  setTimeout(() => {
    enableBackgroundConnections();
  }, 1000);
  
  // Make available globally for debugging
  (window as any).TabVisibilityOverride = {
    enableBackgroundConnections,
    disableBackgroundConnections,
    disableTabVisibilityTracking,
    enableTabVisibilityTracking
  };
}
