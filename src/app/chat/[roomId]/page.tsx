'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstantChat } from '../../../hooks/use-instant-chat';
import { useConnectionPerformance } from '../../../hooks/use-connection-performance';
import { useMessageNotifications } from '../../../hooks/use-push-notifications';
import { useRoomBackgroundNotifications } from '../../../hooks/use-background-notifications';
import { useBackgroundNotifications } from '../../../hooks/use-background-notifications';
import { QRModal } from '../../../components/QRModal';
import { NetworkStatus } from '../../../components/NetworkStatus';
import { RoomCodeDisplay } from '../../../components/RoomCode';
import { ChatRoomSettings } from '../../../components/ChatRoomSettings';
import { FavoriteButton } from '../../../components/FavoriteButton';
import { ChatRoomSwitcher } from '../../../components/ChatRoomSwitcher';
import { useRoomUnreadTracker } from '../../../hooks/use-unread-messages';

// HYBRID EMERGENCY: Restore features while keeping simplified WebSocket core
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function HybridEmergencyChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  
  const roomId = React.useMemo(() => {
    const id = params.roomId;
    if (typeof id === 'string') return id;
    if (Array.isArray(id) && id.length > 0) return id[0];
    return '';
  }, [params.roomId]);
  
  const [displayName, setDisplayName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ⚡ INSTANT CONNECTION: Use optimized chat hook for sub-500ms connections
  const {
    status,
    messages,
    sendMessage,
    onMessage,
    isRetrying,
    retryCount,
    getConnectionDiagnostics,
    forceReconnect
  } = useInstantChat(roomId, displayName);

  // 🔥 PERFORMANCE TRACKING
  const { getMetrics } = useConnectionPerformance();

  // Restore notification functionality
  const { triggerNotification } = useMessageNotifications(roomId, displayName);
  useRoomBackgroundNotifications(roomId, displayName);
  const { setCurrentRoom } = useBackgroundNotifications();
  useRoomUnreadTracker(roomId, !!displayName);

  // Set current room for background notifications
  useEffect(() => {
    if (roomId && displayName) {
      console.log('📍 Setting current room for background notifications:', roomId);
      setCurrentRoom(roomId);
    }
    
    return () => {
      console.log('📍 Clearing current room for background notifications');
      setCurrentRoom(null);
    };
  }, [roomId, displayName, setCurrentRoom]);

  // Detect client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Early return for invalid room
  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Invalid Room</h2>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Get display name with session restoration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to restore session first
      import('../../../utils/connection-resilience').then(({ SessionPersistence }) => {
        const session = SessionPersistence.getSession();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const sessionIsRecent = session && session.timestamp && session.timestamp > fiveMinutesAgo;
        
        if (session && session.roomId === roomId && session.displayName && sessionIsRecent) {
          console.log('📝 Restoring recent session for:', session.displayName);
          setDisplayName(session.displayName);
          return;
        } else if (session && !sessionIsRecent) {
          console.log('🕰️ Session is stale, clearing it');
          SessionPersistence.clearSession();
        }
        
        // Normal display name setup
        const storedName = localStorage.getItem('displayName');
        if (storedName) {
          setDisplayName(storedName);
        } else {
          const name = prompt('Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
          setDisplayName(name);
          localStorage.setItem('displayName', name);
        }
      }).catch(error => {
        console.warn('Failed to load SessionPersistence:', error);
        // Fallback
        const storedName = localStorage.getItem('displayName');
        if (storedName) {
          setDisplayName(storedName);
        } else {
          const name = prompt('Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
          setDisplayName(name);
          localStorage.setItem('displayName', name);
        }
      });
    }
  }, [roomId]);

  // Set up push notifications for messages
  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      console.log('📨 Received real-time message:', message);
      triggerNotification(message);
    });
    return cleanup;
  }, [onMessage, triggerNotification]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !displayName) return;

    console.log('📤 Sending message:', inputMessage, 'from:', displayName);

    const messageData: Omit<Message, 'id' | 'timestamp'> = {
      type: 'chat',
      content: inputMessage.trim(),
      sender: displayName,
      roomId: roomId,
      synced: false,
    };

    sendMessage(messageData);
    setInputMessage('');
  };

  // Determine if we should show debug (only in development or staging)
  const shouldShowDebug = isClient && (
    process.env.NODE_ENV === 'development' || 
    process.env.BUILD_TARGET === 'staging' || 
    window.location.hostname.includes('firebase') || 
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('localhost')
  );

  return (
    <div 
      className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white fixed inset-0 overflow-hidden supports-[height:100svh]:h-[100svh]"
      data-chat-active={roomId && displayName ? "true" : "false"}
    >
      {/* Ensure proper mobile viewport */}
      <style jsx global>{`
        html, body {
          height: 100%;
          overflow: hidden;
        }
        @supports (height: 100svh) {
          html, body {
            height: 100svh;
          }
        }
      `}</style>

      {/* RESTORED: Enhanced Header */}
      <div className="bg-gray-900/80 backdrop-blur border-b border-gray-700 p-3 sm:p-4 shrink-0">
        {/* Show debug toggle only in development/staging */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-gray-800/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go to homepage"
          >
            <img 
              src="/peddlenet-logo.svg" 
              alt="PeddleNet - Go Home" 
              className="w-[42px] h-[32px]"
            />
          </button>
          {shouldShowDebug && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs sm:text-sm text-gray-400 hover:text-white"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>
          )}
        </div>

        {/* RESTORED: Room Title Row with Actions */}
        <div className="flex items-center justify-between mb-2">
          <ChatRoomSwitcher 
            currentRoomId={roomId}
            className="flex-1 mr-3"
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              title="Invite Others"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <rect x="0" y="0" width="2" height="2"/>
                <rect x="3" y="0" width="2" height="2"/>
                <rect x="6" y="0" width="2" height="2"/>
                <rect x="11" y="0" width="2" height="2"/>
                <rect x="14" y="0" width="2" height="2"/>
                <rect x="0" y="3" width="2" height="2"/>
                <rect x="6" y="3" width="2" height="2"/>
                <rect x="11" y="3" width="2" height="2"/>
                <rect x="0" y="6" width="2" height="2"/>
                <rect x="3" y="6" width="2" height="2"/>
                <rect x="6" y="6" width="2" height="2"/>
                <rect x="9" y="6" width="2" height="2"/>
                <rect x="14" y="6" width="2" height="2"/>
                <rect x="3" y="9" width="2" height="2"/>
                <rect x="6" y="9" width="2" height="2"/>
                <rect x="11" y="9" width="2" height="2"/>
                <rect x="14" y="9" width="2" height="2"/>
                <rect x="0" y="11" width="2" height="2"/>
                <rect x="6" y="11" width="2" height="2"/>
                <rect x="9" y="11" width="2" height="2"/>
                <rect x="0" y="14" width="2" height="2"/>
                <rect x="3" y="14" width="2" height="2"/>
                <rect x="6" y="14" width="2" height="2"/>
                <rect x="9" y="14" width="2" height="2"/>
                <rect x="11" y="14" width="2" height="2"/>
                <rect x="14" y="14" width="2" height="2"/>
              </svg>
            </button>
            <FavoriteButton 
              roomId={roomId} 
              displayName={displayName}
            />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              title="Room Settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* RESTORED: Connection Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : (isRetrying ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')}`} />
            {status.connectedPeers > 0 ? (
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {status.connectedPeers} online
              </span>
            ) : isRetrying ? (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
                Reconnecting...
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                0 online
              </span>
            )}
            {isRetrying && (
              <span className="text-xs text-blue-400">
                (Attempt {retryCount})
              </span>
            )}
            
            {/* Network Info */}
            <div className="text-sm font-bold text-gray-400">
              ℹ️
            </div>
            <NetworkStatus />
          </div>
        </div>

        {/* RESTORED: Room Settings Panel */}
        {showSettings && (
          <div className="mb-3 max-h-[50vh] overflow-y-auto">
            <ChatRoomSettings 
              roomId={roomId} 
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </div>

      {/* RESTORED: Room Code Card */}
      <div className="px-3 sm:px-4 pt-2 pb-3">
        <RoomCodeDisplay roomId={roomId} className="" />
      </div>

      {/* RESTORED: Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 mt-8">
            {status.connectedPeers === 0 ? (
              <div className="space-y-4">
                <div className="text-6xl mb-4">🎪</div>
                <h3 className="text-xl font-semibold text-white">Welcome to {roomId}!</h3>
                <p className="text-gray-400">You're the first person here.</p>
                <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-purple-200 font-medium mb-2 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <rect x="0" y="0" width="2" height="2"/>
                      <rect x="3" y="0" width="2" height="2"/>
                      <rect x="6" y="0" width="2" height="2"/>
                      <rect x="11" y="0" width="2" height="2"/>
                      <rect x="14" y="0" width="2" height="2"/>
                      <rect x="0" y="3" width="2" height="2"/>
                      <rect x="6" y="3" width="2" height="2"/>
                      <rect x="11" y="3" width="2" height="2"/>
                      <rect x="0" y="6" width="2" height="2"/>
                      <rect x="3" y="6" width="2" height="2"/>
                      <rect x="6" y="6" width="2" height="2"/>
                      <rect x="9" y="6" width="2" height="2"/>
                      <rect x="14" y="6" width="2" height="2"/>
                      <rect x="3" y="9" width="2" height="2"/>
                      <rect x="6" y="9" width="2" height="2"/>
                      <rect x="11" y="9" width="2" height="2"/>
                      <rect x="14" y="9" width="2" height="2"/>
                      <rect x="0" y="11" width="2" height="2"/>
                      <rect x="6" y="11" width="2" height="2"/>
                      <rect x="9" y="11" width="2" height="2"/>
                      <rect x="0" y="14" width="2" height="2"/>
                      <rect x="3" y="14" width="2" height="2"/>
                      <rect x="6" y="14" width="2" height="2"/>
                      <rect x="9" y="14" width="2" height="2"/>
                      <rect x="11" y="14" width="2" height="2"/>
                      <rect x="14" y="14" width="2" height="2"/>
                    </svg>
                    Get started:
                  </p>
                  <ol className="text-xs text-purple-300 text-left space-y-1">
                    <li>1. Tap the QR code icon next to the room name</li>
                    <li>2. Share the QR code with friends</li>
                    <li>3. They'll connect instantly!</li>
                    <li>4. Start chatting</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-white">Ready to chat!</h3>
                <p className="text-gray-400">Connected to {status.connectedPeers} {status.connectedPeers === 1 ? 'person' : 'people'}. Start the conversation!</p>
              </div>
            )}
          </div>
        )}
        
        {messages.map((message) => {
          const isMyMessage = message.sender === displayName;
          
          return (
            <div
              key={message.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                  isMyMessage
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-600'
                }`}
              >
                {!isMyMessage && (
                  <div className="font-semibold text-xs sm:text-sm mb-1">{message.sender}</div>
                )}
                <div className="text-sm sm:text-base break-words">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* RESTORED: Enhanced Message Input */}
      <form onSubmit={handleSendMessage} className="bg-gray-900/95 backdrop-blur p-3 sm:p-4 border-t border-gray-700 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex space-x-2 items-end">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={status.isConnected ? "Type a message..." : "Connecting to server..."}
            className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 min-h-[44px] text-base"
            disabled={!status.isConnected || !displayName}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !status.isConnected || !displayName}
            className="px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition min-h-[44px] text-sm sm:text-base"
          >
            {status.isConnected ? 'Send' : '⏳'}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          <span className="truncate">
            {status.isConnected 
              ? (status.connectedPeers > 0 
                ? `Connected to ${status.connectedPeers} other ${status.connectedPeers === 1 ? 'person' : 'people'}` 
                : 'Connected to server - ready to chat')
              : 'Connecting to server...' 
            }
          </span>
        </div>
      </form>

      {/* Debug Panel - Only in Development/Staging */}
      {showDebug && shouldShowDebug && (
        <div className="border-t border-gray-700 bg-gray-900/80 max-h-[50vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sm mb-2 text-white">⚡ Instant Connection Debug</h4>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-300">
                {JSON.stringify(getConnectionDiagnostics(), null, 2)}
              </pre>
            </div>
            
            {/* 🔥 PERFORMANCE METRICS */}
            <div className="p-3 bg-green-800/20 rounded-lg border border-green-600">
              <h4 className="font-semibold text-sm mb-2 text-green-200">🔥 Connection Performance</h4>
              <div className="text-xs space-y-1 text-green-100">
                {(() => {
                  const metrics = getMetrics();
                  return (
                    <>
                      <div>Connection Time: <span className="font-bold">{metrics.connectionTime}ms</span></div>
                      <div>Total Time: <span className="font-bold">{metrics.totalTime}ms</span></div>
                      <div>Status: <span className={`font-bold ${
                        metrics.connectionTime < 500 ? 'text-green-300' :
                        metrics.connectionTime < 1000 ? 'text-yellow-300' : 'text-red-300'
                      }`}>
                        {metrics.connectionTime < 500 ? '🚀 INSTANT' :
                         metrics.connectionTime < 1000 ? '✅ FAST' : '⚠️ SLOW'}
                      </span></div>
                      <div className="text-gray-400 mt-2 text-xs">Target: &lt;500ms | Before P2P: ~200-300ms</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTORED: QR Modal */}
      <QRModal
        roomId={roomId}
        peerId={status.connectedPeers.toString()} // Use peer count as fallback
        displayName={displayName}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
