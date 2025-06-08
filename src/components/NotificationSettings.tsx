'use client';

import React from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface NotificationSettingsProps {
  roomId?: string;
  className?: string;
}

export function NotificationSettings({ roomId, className = '' }: NotificationSettingsProps) {
  const {
    permission,
    isSupported,
    isSubscribed,
    settings,
    requestPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    updateSettings,
    sendTestNotification
  } = usePushNotifications(roomId);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <span>🔔</span>
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs">Not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePermissionRequest = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      await subscribeToNotifications();
    }
  };

  const handleSubscriptionToggle = async () => {
    if (isSubscribed) {
      await unsubscribeFromNotifications();
    } else {
      if (permission === 'granted') {
        await subscribeToNotifications();
      } else {
        await handlePermissionRequest();
      }
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Allowed', color: 'text-green-700', bg: 'bg-green-50' };
      case 'denied':
        return { text: 'Blocked', color: 'text-red-700', bg: 'bg-red-50' };
      default:
        return { text: 'Not set', color: 'text-yellow-700', bg: 'bg-yellow-50' };
    }
  };

  const statusInfo = getPermissionStatus();

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Permission & Subscription Status */}
        {permission === 'default' && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              📱 Get notified of new messages when the app is in the background
            </p>
            <button
              onClick={handlePermissionRequest}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800 mb-2">
              ❌ Notifications are blocked. To enable:
            </p>
            <ul className="text-xs text-red-700 space-y-1 mb-3">
              <li>• Click the lock icon in your address bar</li>
              <li>• Allow notifications for this site</li>
              <li>• Refresh the page</li>
            </ul>
          </div>
        )}

        {permission === 'granted' && (
          <>
            {/* Subscription Toggle */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div>
                <p className="font-medium text-sm text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-600">
                  Receive notifications when app is backgrounded
                </p>
              </div>
              <button
                onClick={handleSubscriptionToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSubscribed ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Settings */}
            {isSubscribed && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-900">Notify me when:</h4>
                
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-gray-700">Someone sends a message</span>
                    <input
                      type="checkbox"
                      checked={settings.newMessages}
                      onChange={(e) => updateSettings({ newMessages: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-gray-700">Someone joins the room</span>
                    <input
                      type="checkbox"
                      checked={settings.userJoined}
                      onChange={(e) => updateSettings({ userJoined: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-gray-700">Someone leaves the room</span>
                    <input
                      type="checkbox"
                      checked={settings.userLeft}
                      onChange={(e) => updateSettings({ userLeft: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>

                {/* Test Notification */}
                <button
                  onClick={sendTestNotification}
                  className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                >
                  🧪 Send Test Notification
                </button>
              </div>
            )}
          </>
        )}

        {/* Festival Tips */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium mb-1">🎪 Festival Tips:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Notifications work even when your phone is locked</li>
            <li>• Tap notification to jump back to the conversation</li>
            <li>• Only get notified when app is in background</li>
            <li>• Saves battery by not notifying when you're actively chatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
