'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications, useMessageNotifications } from '@/hooks/use-push-notifications';

interface NotificationTestProps {
  roomId: string;
  displayName: string;
  className?: string;
}

export function NotificationTest({ roomId, displayName, className = '' }: NotificationTestProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [testMessage, setTestMessage] = useState('Test notification from another user!');
  const [visibilityState, setVisibilityState] = useState<string>('unknown');
  const [documentHidden, setDocumentHidden] = useState<boolean>(false);
  const [hasFocus, setHasFocus] = useState<boolean>(true);

  const { permission, isSupported, isSubscribed, sendTestNotification } = usePushNotifications(roomId);
  const { triggerNotification, shouldNotify } = useMessageNotifications(roomId, displayName);

  // Track visibility state changes
  useEffect(() => {
    const updateVisibility = () => {
      setVisibilityState(document.visibilityState);
      setDocumentHidden(document.hidden);
      setHasFocus(document.hasFocus());
    };

    // Initial check
    updateVisibility();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('focus', updateVisibility);
    window.addEventListener('blur', updateVisibility);

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('focus', updateVisibility);
      window.removeEventListener('blur', updateVisibility);
    };
  }, []);

  const handleTestNotification = () => {
    // Create a fake message from another user
    const fakeMessage = {
      id: `test-${Date.now()}`,
      type: 'chat',
      content: testMessage,
      sender: 'TestUser_' + Math.floor(Math.random() * 100),
      roomId: roomId,
      timestamp: Date.now(),
      synced: true
    };

    console.log('🧪 Testing notification with fake message:', fakeMessage);
    console.log('🧪 Current visibility state:', { visibilityState, documentHidden, hasFocus });
    
    // Test shouldNotify first
    const should = shouldNotify(fakeMessage);
    console.log('🧪 shouldNotify returned:', should);
    
    // Try to trigger notification
    triggerNotification(fakeMessage);
  };

  const handleDirectServiceWorkerTest = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('🧪 Testing direct service worker notification');
        
        return registration.showNotification('Direct Test Notification', {
          body: 'This is a direct service worker test',
          icon: '/favicon.ico',
          tag: 'direct-test',
          requireInteraction: true,
          data: {
            url: `/chat/${roomId}`,
            roomId: roomId,
            test: true
          }
        });
      }).then(() => {
        console.log('✅ Direct service worker notification sent');
      }).catch(error => {
        console.error('❌ Direct service worker notification failed:', error);
      });
    }
  };

  const handleBasicNotificationTest = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('🧪 Testing basic Notification API');
      
      try {
        const notification = new Notification('Basic Notification Test', {
          body: 'This is a basic notification API test',
          icon: '/favicon.ico',
          tag: 'basic-test'
        });
        
        notification.onclick = () => {
          console.log('🧪 Basic notification clicked');
          notification.close();
        };
        
        console.log('✅ Basic notification created');
      } catch (error) {
        console.error('❌ Basic notification failed:', error);
      }
    } else {
      console.warn('⚠️ Basic notification not available or permission not granted');
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg ${className}`}>
        <h3 className="font-semibold text-red-800">🧪 Notification Test</h3>
        <p className="text-red-600 text-sm">Notifications not supported in this browser</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-800 rounded-lg border border-gray-600 ${className}`}>
      <h3 className="font-semibold text-white mb-3">🧪 Notification Test Center</h3>
      
      {/* Status Display */}
      <div className="mb-4 p-3 bg-gray-700 rounded text-sm space-y-1">
        <div className="text-gray-300">
          <strong>Permission:</strong> <span className={permission === 'granted' ? 'text-green-400' : 'text-red-400'}>{permission}</span>
        </div>
        <div className="text-gray-300">
          <strong>Subscribed:</strong> <span className={isSubscribed ? 'text-green-400' : 'text-red-400'}>{isSubscribed ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-gray-300">
          <strong>Visibility State:</strong> <span className={visibilityState === 'visible' ? 'text-green-400' : 'text-yellow-400'}>{visibilityState}</span>
        </div>
        <div className="text-gray-300">
          <strong>Document Hidden:</strong> <span className={documentHidden ? 'text-yellow-400' : 'text-green-400'}>{documentHidden ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-gray-300">
          <strong>Has Focus:</strong> <span className={hasFocus ? 'text-green-400' : 'text-yellow-400'}>{hasFocus ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Test Message Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Test Message:</label>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          placeholder="Enter test message content..."
        />
      </div>

      {/* Test Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleTestNotification}
          disabled={permission !== 'granted' || !isSubscribed}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🧪 Test Smart Notification (simulates message from another user)
        </button>
        
        <button
          onClick={handleDirectServiceWorkerTest}
          disabled={permission !== 'granted'}
          className="w-full py-2 px-4 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔧 Test Direct Service Worker
        </button>
        
        <button
          onClick={handleBasicNotificationTest}
          disabled={permission !== 'granted'}
          className="w-full py-2 px-4 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📱 Test Basic Notification API
        </button>
        
        <button
          onClick={sendTestNotification}
          disabled={permission !== 'granted' || !isSubscribed}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔔 Test Original Hook Method
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded">
        <p className="text-yellow-200 text-xs font-medium mb-1">📱 Mobile Testing Steps:</p>
        <ol className="text-yellow-300 text-xs space-y-1">
          <li>1. Enable notifications above</li>
          <li>2. Press home button (don't close app)</li>
          <li>3. Come back and press test buttons</li>
          <li>4. Check if notifications appear when app is backgrounded</li>
          <li>5. Check console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}
