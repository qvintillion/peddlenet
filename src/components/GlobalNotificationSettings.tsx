'use client';

import React from 'react';
import { usePushNotifications } from '../hooks/use-push-notifications';


export function GlobalNotificationSettings({ className = '' }: GlobalNotificationSettingsProps) {
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

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-800/50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-400">
          <span>🔔</span>
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs">Not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  const handleGlobalPermissionRequest = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      await subscribeToNotifications();
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { 
          text: '✅ Enabled', 
          color: 'text-green-400', 
          bg: 'bg-green-900/20 border-green-500/30' 
        };
      case 'denied':
        return { 
          text: '❌ Blocked', 
          color: 'text-red-400', 
          bg: 'bg-red-900/20 border-red-500/30' 
        };
      default:
        return { 
          text: '⏳ Not Set', 
          color: 'text-yellow-400', 
          bg: 'bg-yellow-900/20 border-yellow-500/30' 
        };
    }
  };

  const statusInfo = getPermissionStatus();

  return (
    <div className={`p-4 bg-gray-800/50 rounded-lg ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-white">Notifications</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Permission Request */}
        {permission === 'default' && (
          <div className="space-y-3">
            <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-200 mb-3">
                📱 <strong>Enable notifications</strong> to get alerted when you receive messages while away from chat rooms.
              </p>
              <button
                onClick={handleGlobalPermissionRequest}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🔔 Enable Notifications
              </button>
            </div>
            
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-200 font-medium mb-2">💡 How it works:</p>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Grant permission once here on the homepage</li>
                <li>• Join chat rooms and auto-subscribe to notifications</li>
                <li>• Get notified when you're away and someone messages</li>
                <li>• Tap notifications to jump back to the conversation</li>
              </ul>
            </div>
          </div>
        )}

        {/* Permission Denied */}
        {permission === 'denied' && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-200 mb-3">
              ❌ Notifications are blocked. To enable:
            </p>
            <ul className="text-xs text-red-300 space-y-1 mb-3">
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

        {/* Permission Granted */}
        {permission === 'granted' && (
          <div className="space-y-3">
            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-200">✅ Notifications Enabled</span>
                <span className="text-xs text-green-300">Ready to go!</span>
              </div>
              <p className="text-xs text-green-300">
                You'll automatically get notified for new messages when you're away from chat rooms.
              </p>
            </div>

            {/* Global Settings */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-white">Global Settings:</h4>
              
              <label className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600">
                <div>
                  <span className="text-sm text-gray-200">Enable notifications</span>
                  <p className="text-xs text-gray-400">Master switch for all notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => updateSettings({ enabled: e.target.checked })}
                  className="rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600">
                <div>
                  <span className="text-sm text-gray-200">New messages</span>
                  <p className="text-xs text-gray-400">Get notified for new chat messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.newMessages}
                  onChange={(e) => updateSettings({ newMessages: e.target.checked })}
                  className="rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  disabled={!settings.enabled}
                />
              </label>
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

        {/* Info Panel */}
        <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
          <p className="text-xs text-gray-300 font-medium mb-2">🎪 Festival Chat Notifications:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Works even when your phone is locked</li>
            <li>• Only notifies when you're away from the chat</li>
            <li>• Tap notification to jump back to conversation</li>
            <li>• Each room can have custom notification settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
