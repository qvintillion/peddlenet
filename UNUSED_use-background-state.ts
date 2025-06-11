import { useState, useEffect, useCallback } from 'react';

// Background state management for mobile notifications and connection handling

export interface BackgroundState {
  isBackgrounded: boolean;
  wasRecentlyBackgrounded: boolean;
  backgroundTimestamp: number | null;
}

// Global background state that persists across hook instances
let globalBackgroundState: BackgroundState = {
  isBackgrounded: false,
  wasRecentlyBackgrounded: false,
  backgroundTimestamp: null
};

let backgroundStateListeners: Set<(state: BackgroundState) => void> = new Set();

// Initialize from localStorage on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app_backgrounded_at');
  if (stored) {
    const timestamp = parseInt(stored);
    const isRecent = (Date.now() - timestamp) < 60000; // 1 minute
    globalBackgroundState = {
      isBackgrounded: false, // We're obviously not backgrounded if we're loading
      wasRecentlyBackgrounded: isRecent,
      backgroundTimestamp: isRecent ? timestamp : null
    };
  }
}

function notifyListeners() {
  backgroundStateListeners.forEach(listener => {
    try {
      listener(globalBackgroundState);
    } catch (error) {
      console.error('Background state listener error:', error);
    }
  });
}

function updateBackgroundState(newState: Partial<BackgroundState>) {
  globalBackgroundState = { ...globalBackgroundState, ...newState };
  notifyListeners();
}

// Set up global event listeners (only once)
if (typeof window !== 'undefined') {
  let listenersSetup = false;
  
  const setupGlobalListeners = () => {
    if (listenersSetup) return;
    listenersSetup = true;
    
    const handleVisibilityChange = () => {
      const isHidden = document.hidden || document.visibilityState === 'hidden';
      
      if (isHidden) {
        // App is being backgrounded
        const timestamp = Date.now();
        localStorage.setItem('app_backgrounded_at', timestamp.toString());
        console.log('📱 App backgrounded at:', new Date().toLocaleTimeString());
        
        updateBackgroundState({
          isBackgrounded: true,
          wasRecentlyBackgrounded: true,
          backgroundTimestamp: timestamp
        });
      } else {
        // App is being foregrounded
        setTimeout(() => {
          localStorage.removeItem('app_backgrounded_at');
          console.log('📱 App foregrounded, cleared background state');
          
          updateBackgroundState({
            isBackgrounded: false,
            wasRecentlyBackgrounded: false,
            backgroundTimestamp: null
          });
        }, 2000); // 2 second delay to handle quick focus changes
      }
    };
    
    const handlePageHide = () => {
      // Page is being hidden (home button, app switch, etc.)
      const timestamp = Date.now();
      localStorage.setItem('app_backgrounded_at', timestamp.toString());
      console.log('📱 Page hidden (home button?) at:', new Date().toLocaleTimeString());
      
      updateBackgroundState({
        isBackgrounded: true,
        wasRecentlyBackgrounded: true,
        backgroundTimestamp: timestamp
      });
    };
    
    const handlePageShow = () => {
      // Page is being shown again
      console.log('📱 Page shown - user returned to app');
      
      setTimeout(() => {
        localStorage.removeItem('app_backgrounded_at');
        console.log('📱 Page shown, cleared background state');
        
        updateBackgroundState({
          isBackgrounded: false,
          wasRecentlyBackgrounded: false,
          backgroundTimestamp: null
        });
      }, 2000);
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    
    console.log('📱 Global background state listeners set up');
  };
  
  // Set up immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalListeners);
  } else {
    setupGlobalListeners();
  }
}

export function useBackgroundState() {
  const [backgroundState, setBackgroundState] = useState<BackgroundState>(globalBackgroundState);
  
  useEffect(() => {
    const listener = (state: BackgroundState) => {
      setBackgroundState(state);
    };
    
    backgroundStateListeners.add(listener);
    
    return () => {
      backgroundStateListeners.delete(listener);
    };
  }, []);
  
  return backgroundState;
}

export function getBackgroundState(): BackgroundState {
  return globalBackgroundState;
}
