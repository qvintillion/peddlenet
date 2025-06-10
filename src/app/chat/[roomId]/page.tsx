'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { useMessageNotifications } from '@/hooks/use-push-notifications';
import { MobileConnectionError, MobileSignalingStatus, MobileNetworkInfo } from '@/components/MobileConnectionError';
import MobileDiagnostics from '@/components/MobileDiagnostics';
import { MobileConnectionDebug } from '@/components/MobileConnectionDebug';
import type { Message } from '@/lib/types';
import { QRModal } from '@/components/QRModal';
import { NetworkStatus, ConnectionError } from '@/components/NetworkStatus';
import { RoomCodeDisplay } from '@/components/RoomCode';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ConnectionTest } from '@/components/ConnectionTest';
import { QRPeerUtils } from '@/utils/qr-peer-utils';
import { RoomCodeDiagnosticPanel } from '@/components/RoomCodeDiagnostics';

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [displayName, setDisplayName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [connectionError, setConnectionError] = useState<{type: string, message: string} | null>(null);

  // Use WebSocket chat instead of P2P (more reliable for multi-user)
  const {
    peerId,
    status,
    isRetrying,
    retryCount,
    messages: serverMessages,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers,
    forceReconnect,
    isSignalingConnected
  } = useWebSocketChat(roomId, displayName);

  // Set up message notifications
  const { triggerNotification } = useMessageNotifications(roomId, displayName);



  // Server-based room discovery (no signaling needed for WebSocket chat)
  // isSignalingConnected is already available from the WebSocket hook
  const refreshRoomPeers = () => forceReconnect();

  // Detect if we're on mobile for UI purposes
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  // Track if we've ever been connected to avoid showing errors on initial load
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  
  // Track connection state changes
  useEffect(() => {
    if (isSignalingConnected && !hasBeenConnected) {
      setHasBeenConnected(true);
    }
  }, [isSignalingConnected, hasBeenConnected]);

  // Enhanced connection error detection with better logic
  useEffect(() => {
    // Only show server disconnected if:
    // 1. We have a valid display name (meaning we should be connected)
    // 2. We have been connected before (not initial load)
    // 3. We're currently not connected
    // 4. We have a peer ID (meaning initialization is complete)
    if (displayName && displayName.trim() && hasBeenConnected && !isSignalingConnected && peerId) {
      // Add a delay to avoid showing errors during normal reconnection process
      const timer = setTimeout(() => {
        // Double-check the connection state after delay
        if (!isSignalingConnected && displayName && displayName.trim() && hasBeenConnected) {
          setConnectionError({
            type: 'server-disconnected',
            message: 'Server offline - messages will sync when reconnected'
          });
        }
      }, 8000); // Wait 8 seconds before showing error (longer for mobile networks)
      
      return () => clearTimeout(timer);
    } else if (isSignalingConnected && connectionError?.type === 'server-disconnected') {
      setConnectionError(null);
    }
  }, [isSignalingConnected, peerId, displayName, hasBeenConnected]); // Add hasBeenConnected to deps

  // Clear errors when successfully connected
  useEffect(() => {
    if (status.connectedPeers > 0) {
      setConnectionError(null);
    }
  }, [status.connectedPeers]); // Remove connectionError from deps to prevent infinite loop

  // Check if this is a session restoration
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const { SessionPersistence } = require('@/utils/connection-resilience');
    const session = SessionPersistence.getSession();
    
    if (session && session.roomId === roomId && session.displayName && !displayName) {
      setIsSessionRestored(true);
      // Hide the notification after 5 seconds
      setTimeout(() => setIsSessionRestored(false), 5000);
    }
  }, [roomId, displayName]);

  // Get/set display name and restore session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Clean up stale peer data first
    console.log('🧠 Cleaning up stale peer data for room:', roomId);
    QRPeerUtils.cleanupOldHostData(roomId);
    
    // Try to restore session first
    const { SessionPersistence } = require('@/utils/connection-resilience');
    const session = SessionPersistence.getSession();
    
    // Only restore session if it's recent (less than 5 minutes old)
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
    
    // Set display name normally if no valid session
    const storedName = localStorage.getItem('displayName');
    if (storedName) {
      setDisplayName(storedName);
    } else {
      const name = prompt('Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
      setDisplayName(name);
      localStorage.setItem('displayName', name);
    }
  }, [roomId]);

  // Handle incoming messages from the hook - simplified to avoid infinite loops
  useEffect(() => {
    // Simply use the messages from the WebSocket hook directly
    setMessages(serverMessages);
  }, [serverMessages]);

  // Set up push notifications for real-time messages
  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      console.log('📨 Received real-time message:', message);
      
      // Trigger push notification if appropriate
      triggerNotification(message);
    });
    return cleanup;
  }, [onMessage, triggerNotification]);

  // Check for host peer info from QR code
  useEffect(() => {
    if (typeof window === 'undefined' || !peerId) return;
    
    // Check URL params for host peer info
    const urlParams = new URLSearchParams(window.location.search);
    const hostPeerId = urlParams.get('host');
    const hostName = urlParams.get('name');
    const timestamp = urlParams.get('t');
    
    if (hostPeerId && hostName) {
      console.log('📱 Found host peer info in URL:', hostPeerId);
      console.log('📱 My current peer ID:', peerId);
      console.log('📱 Host peer timestamp:', timestamp);
      
      // Don't try to connect to ourselves
      if (hostPeerId === peerId) {
        console.log('🙅 Skipping self-connection');
        return;
      }
      
      // Check if QR code is fresh (not older than 10 minutes)
      const qrTimestamp = parseInt(timestamp || '0');
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      
      if (qrTimestamp < tenMinutesAgo) {
        console.log('🕰️ QR code is stale, not attempting connection');
        return;
      }
      
      QRPeerUtils.storeHostPeerInfo({
        roomId,
        hostPeerId,
        hostName
      }, roomId);
      
      // Try to connect to host peer after a delay
      console.log('📱 Will attempt connection to host peer in 3 seconds...');
      setTimeout(() => {
        // Double-check that we're not trying to connect to ourselves
        const currentPeerId = window.globalPeer?.id;
        if (hostPeerId === currentPeerId) {
          console.log('🙅 Aborting connection - would be self-connection');
          return;
        }
        
        QRPeerUtils.connectToHostPeer(roomId, {
          peerId,
          status,
          isRetrying,
          retryCount,
          isSignalingConnected,
          connectToPeer,
          sendMessage,
          onMessage,
          getConnectedPeers,
          forceReconnect,
        });
      }, 3000);
    }
  }, [peerId, roomId, connectToPeer, getConnectedPeers, sendMessage, onMessage, forceReconnect]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close network info dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNetworkInfo && !(event.target as Element).closest('.network-info-dropdown')) {
        setShowNetworkInfo(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNetworkInfo]);

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

    // Send to server (server will broadcast back to all clients)
    const messageId = sendMessage(messageData);
    console.log('📤 Message sent with ID:', messageId);
    setInputMessage('');
  };



  const copyPeerId = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      alert('Peer ID copied!');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white fixed inset-0 overflow-hidden supports-[height:100svh]:h-[100svh]">
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
      {/* Enhanced Header */}
      <div className="bg-gray-900/80 backdrop-blur border-b border-gray-700 p-3 sm:p-4 shrink-0">
        {/* Session Restoration Notification */}
        {isSessionRestored && (
          <div className="mb-3 p-3 bg-blue-900/50 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">📝</span>
              <div className="text-sm">
                <span className="font-medium text-blue-200">Session Restored!</span>
                <p className="text-blue-300 text-xs mt-1">
                  Welcome back! Generate a new QR code below to reconnect with others.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Connection Error */}
        {connectionError && (
          <div className="mb-3 p-3 bg-red-900/50 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <div className="text-sm">
                  <span className="font-medium text-red-200">{connectionError.type}</span>
                  <p className="text-red-300 text-xs mt-1">{connectionError.message}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConnectionError(null);
                  // First, try to reconnect P2P
                  forceReconnect();
                  // Then, refresh server connection
                  setTimeout(() => {
                    refreshRoomPeers();
                  }, 2000);
                }}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm flex items-center"
          >
            ← Home
          </button>
          <p className="text-sm text-purple-300">PeddleNet Room</p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs sm:text-sm text-gray-400 hover:text-white"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>
          )}
        </div>

        {/* Room Title Row with Actions */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700/50">
          <h1 className="text-xl sm:text-2xl font-bold text-white">🎪 {roomId}</h1>
          <div className="flex gap-2">
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
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              title="Notification Settings"
            >
              🔔
            </button>
          </div>
        </div>

        {/* Simplified Connection Status */}
        <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            {/* Main Status - Clean tag style */}
            <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : (isRetrying ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')}`} />
            {status.connectedPeers > 0 ? (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {status.connectedPeers} online
            </span>
            ) : isRetrying ? (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Reconnecting...
            </span>
            ) : (
              <span className="text-sm font-medium text-gray-200">
              Waiting for connections...
            </span>
            )}
            {isRetrying && (
                <span className="text-xs text-blue-400">
                (Attempt {retryCount})
              </span>
            )}
          </div>
            
            {/* Network Info Dropdown */}
            <div className="relative network-info-dropdown">
              <button
                onClick={() => setShowNetworkInfo(!showNetworkInfo)}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
              >
                ℹ️
              </button>
              {showNetworkInfo && (
                <div className="absolute right-0 top-8 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3 z-10">
                  <div className="text-xs space-y-2 text-white">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isSignalingConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span>Server: {isSignalingConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="text-gray-400">
                      Mode: WebSocket Server (Persistent Rooms)
                    </div>
                    <NetworkStatus />
                    <MobileNetworkInfo />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Room Code Display */}
          <RoomCodeDisplay roomId={roomId} className="mb-2" />
        </div>

        {/* Notification Settings Panel */}
        {showNotifications && (
          <div className="mb-3">
            <NotificationSettings roomId={roomId} />
          </div>
        )}


      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 mt-8">
            {status.connectedPeers === 0 ? (
              <div className="space-y-4">
                <div className="text-6xl mb-4">🎪</div>
                <h3 className="text-xl font-semibold text-white">Welcome to {roomId}!</h3>
                <p className="text-gray-400">You're the first person here.</p>
                <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-purple-200 font-medium mb-2">🚀 Get started:</p>
                  <ol className="text-xs text-purple-300 text-left space-y-1">
                    <li>1. Tap the "📱 Invite" button above</li>
                    <li>2. Share the QR code with friends</li>
                    <li>3. They'll connect in 5-10 seconds!</li>
                    <li>4. Start chatting instantly</li>
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

      {/* Enhanced Message Input */}
      <form onSubmit={handleSendMessage} className="bg-gray-900/95 backdrop-blur p-3 sm:p-4 border-t border-gray-700 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex space-x-2 items-end">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isSignalingConnected ? "Type a message..." : "Connecting to server..."}
            className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 min-h-[44px] text-base"
            disabled={!isSignalingConnected || !displayName}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isSignalingConnected || !displayName}
            className="px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition min-h-[44px] text-sm sm:text-base"
          >
            {isSignalingConnected ? 'Send' : '⏳'}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
        <span className="truncate">
        {isSignalingConnected 
        ? (status.connectedPeers > 0 
        ? `Connected to ${status.connectedPeers} other ${status.connectedPeers === 1 ? 'person' : 'people'}` 
        : 'Connected to server - ready to chat')
        : 'Connecting to server...' 
        }
        </span>
        </div>
      </form>

      {/* Debug Panel - Development & Mobile Diagnostics */}
      {showDebug && (
        <div className="border-t border-gray-700 bg-gray-900/80 max-h-[50vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Connection Test Component */}
            <ConnectionTest className="" />
            
            {/* Room Code Diagnostics */}
            <RoomCodeDiagnosticPanel p2pHook={{
              peerId,
              status,
              isRetrying,
              retryCount,
              isSignalingConnected,
              connectToPeer,
              sendMessage,
              onMessage,
              getConnectedPeers,
              forceReconnect,
            }} />
            
            <MobileDiagnostics
              peerId={peerId}
              roomId={roomId}
              isSignalingConnected={isSignalingConnected}
              connectedPeers={status.connectedPeers}
            />
            
            {/* Mobile Network Debug */}
            <MobileConnectionDebug 
              serverUrl={`http://localhost:3001`} // Will be auto-detected
              className=""
            />
            
            {/* Enhanced Debug Information */}
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sm mb-2 text-white">🔍 Connection Status</h4>
              <div className="text-xs space-y-1 text-gray-300">
                <div>Environment: {(() => {
                  const isDev = process.env.NODE_ENV === 'development' || 
                               (typeof window !== 'undefined' && (
                                 window.location.hostname === 'localhost' ||
                                 window.location.hostname === '127.0.0.1' ||
                                 window.location.port === '3000'
                               ));
                  return isDev ? 'development' : 'production';
                })()} {typeof window !== 'undefined' && window.location.port === '3000' ? '(localhost:3000)' : ''}</div>
                <div>Server Connected: {isSignalingConnected ? 'Yes' : 'No'}</div>
                <div>Message Count: {messages.length}</div>
                <div>Online Users: {status.connectedPeers}</div>
                <div>Connection Mode: WebSocket Server</div>
                <div>Room Persistence: ✅ Yes (survives refreshes)</div>
                <div>Peer ID: {peerId ? `${peerId.substring(0, 12)}...` : 'None'}</div>
                <div>Room ID: {roomId}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <QRModal
        roomId={roomId}
        peerId={peerId} // Use actual peer ID for connections
        displayName={displayName}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
