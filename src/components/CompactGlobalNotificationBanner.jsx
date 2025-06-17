'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/use-push-notifications';


export function CompactGlobalNotificationBanner({ className = '' }: CompactGlobalNotificationBannerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const {
    permission,
    isSupported,
    isSubscribed,
    settings,
    requestPermission,
    subscribeToNotifications,
    updateSettings,
    sendTestNotification
  } = usePushNotifications();

  // Fix hydration mismatch by only rendering notification-specific content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className={`p-3 rounded-lg border bg-gray-900/20 border-gray-500/30 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔔</span>
          <span className="text-sm font-medium text-gray-400">
            Loading notification settings...
          </span>
        </div>
      </div>
    );
  }

  // MOBILE FIX: Show helpful message even for limited support
  if (!isSupported) {
    // Check if we have basic Notification API at least
    const hasBasicNotifications = typeof window !== 'undefined' && 'Notification' in window;
    
    if (hasBasicNotifications) {
      // Show limited support banner
      return (
        <div className={`p-3 rounded-lg border bg-orange-900/20 border-orange-500/30 ${className}`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium text-orange-400">
              Limited notification support detected
            </span>
          </div>
          <p className="text-xs text-orange-300 mt-1">
            Basic notifications may work, but full features unavailable in this browser.
          </p>
        </div>
      );
    }
    
    // No notification support at all
    return null;
  }

  const handleGlobalPermissionRequest = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      await subscribeToNotifications();
    }
  };

  const getStatusDisplay = () => {
    switch (permission) {
      case 'granted':
        return { 
          text: 'Notifications enabled', 
          icon: '✅',
          color: 'text-green-400',
          bgColor: 'bg-green-900/20 border-green-500/30'
        };
      case 'denied':
        return { 
          text: 'Notifications blocked', 
          icon: '❌',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20 border-red-500/30'
        };
      default:
        return { 
          text: 'Enable notifications for cross-room alerts', 
          icon: '🔔',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20 border-yellow-500/30'
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`relative ${className}`}>
      <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all ${status.bgColor} hover:opacity-80`}
      onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{status.icon}</span>
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {permission === 'granted' && (
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                Global
              </span>
            )}
            <svg 
              className={`w-4 h-4 ${status.color} transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 p-4"
          onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing when clicking inside
        >
          {permission === 'default' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Get notified for messages in any room when you're away browsing other pages.
              </p>
              <button
                onClick={handleGlobalPermissionRequest}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🔔 Enable Global Notifications
              </button>
            </div>
          )}

          {permission === 'denied' && (
            <div className="space-y-3">
              <p className="text-sm text-red-200">
                Notifications are blocked. To enable:
              </p>
              <ul className="text-xs text-red-300 space-y-1">
                <li>• Click the lock/info icon in your address bar</li>
                <li>• Change notifications to "Allow"</li>
                <li>• Refresh this page</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                🔄 Refresh Page
              </button>
            </div>
          )}

          {permission === 'granted' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">Global Settings:</h4>
                
                {/* Toggle for enabled */}
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-gray-600">
                  <div>
                    <span className="text-sm text-gray-200">Master notifications</span>
                    <p className="text-xs text-gray-400">Turn all notifications on/off</p>
                  </div>
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔔 Master notifications toggle clicked, current:', settings.enabled);
                        updateSettings({ enabled: !settings.enabled });
                      }}
                      className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${
                        settings.enabled ? 'bg-purple-600' : 'bg-gray-400'
                      }`}
                    >
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          settings.enabled ? 'transform translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Toggle for new messages */}
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-gray-600">
                  <div>
                    <span className="text-sm text-gray-200">Message alerts</span>
                    <p className="text-xs text-gray-400">Notify for new chat messages</p>
                  </div>
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!settings.enabled) return;
                        console.log('🔔 Message alerts toggle clicked, current:', settings.newMessages);
                        updateSettings({ newMessages: !settings.newMessages });
                      }}
                      className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${
                        settings.newMessages && settings.enabled ? 'bg-purple-600' : 'bg-gray-400'
                      } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          settings.newMessages && settings.enabled ? 'transform translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Notification */}
              <button
                onClick={sendTestNotification}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                🧪 Send Test Notification
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              💡 You'll automatically get notified for messages when away from chat rooms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
