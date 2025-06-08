'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { MobileConnectionError, MobileSignalingStatus, MobileNetworkInfo } from '@/components/MobileConnectionError';
import MobileDiagnostics from '@/components/MobileDiagnostics';
import { MobileConnectionDebug } from '@/components/MobileConnectionDebug';
import type { Message } from '@/lib/types';
import { DebugPanel } from '@/components/DebugPanel';
import { QRModal } from '@/components/QRModal';
import { NetworkStatus, ConnectionError } from '@/components/NetworkStatus';
import { RoomCodeDisplay } from '@/components/RoomCode';
import { P2PDebugUtils } from '@/utils/p2p-debug';
import { QRPeerUtils } from '@/utils/qr-peer-utils';

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

  // Enhanced connection error detection
  useEffect(() => {
    if (!isSignalingConnected && peerId) {
      setConnectionError({
        type: 'server-disconnected',
        message: 'Server offline - messages will sync when reconnected'
      });
    } else if (isSignalingConnected && connectionError?.type === 'server-disconnected') {
      setConnectionError(null);
    }
  }, [isSignalingConnected, peerId, connectionError]);

  // Clear errors when successfully connected
  useEffect(() => {
    if (status.connectedPeers > 0 && connectionError) {
      setConnectionError(null);
    }
  }, [status.connectedPeers, connectionError]);

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

  // Handle incoming messages (server provides message history)
  useEffect(() => {
    console.log('📨 Server messages updated:', serverMessages.length, serverMessages);
    console.log('👤 Current display name:', displayName);
    
    // Always update messages, even if empty (for cleanup)
    setMessages(serverMessages);
    
    // Debug message senders
    if (serverMessages.length > 0) {
      console.log('📋 Message senders breakdown:');
      const senderCounts = serverMessages.reduce((acc, msg) => {
        acc[msg.sender] = (acc[msg.sender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(senderCounts);
      
      console.log('👤 My messages:', serverMessages.filter(m => m.sender === displayName).length);
      console.log('👥 Other messages:', serverMessages.filter(m => m.sender !== displayName).length);
    }
  }, [serverMessages, displayName]);

  // Also set up the onMessage handler for real-time updates
  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      console.log('📨 Received real-time message:', message);
      // The WebSocket hook should already handle adding to serverMessages
      // But let's also update local messages just in case
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.id === message.id);
        if (isDuplicate) {
          console.log('⚠️ Duplicate message detected:', message.id);
          return prev;
        }
        console.log('✅ Adding new message to UI:', message);
        return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
      });
    });
    return cleanup;
  }, [onMessage]);

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
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-md p-4">
        {/* Session Restoration Notification */}
        {isSessionRestored && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📝</span>
              <div className="text-sm">
                <span className="font-medium text-blue-900">Session Restored!</span>
                <p className="text-blue-700 text-xs mt-1">
                  Welcome back! Generate a new QR code below to reconnect with others.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Connection Error */}
        {connectionError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <div className="text-sm">
                  <span className="font-medium text-red-900">{connectionError.type}</span>
                  <p className="text-red-700 text-xs mt-1">{connectionError.message}</p>
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
        
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl font-bold">🎪 {roomId}</h1>
            <p className="text-xs text-gray-600">PeddleNet Room</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
            >
              📱 Invite
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showDebug ? 'Hide' : 'Show'} Debug
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="text-purple-600 hover:text-purple-700"
            >
              ← Home
            </button>
          </div>
        </div>

        {/* Simplified Connection Status */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            {/* Main Status - Clean tag style */}
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {status.connectedPeers > 0 ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {status.connectedPeers} online
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  Waiting for connections...
                </span>
              )}
              {isRetrying && (
                <span className="text-xs text-blue-600">
                  (Attempt {retryCount})
                </span>
              )}
            </div>
            
            {/* Network Info Dropdown */}
            <div className="relative network-info-dropdown">
              <button
                onClick={() => setShowNetworkInfo(!showNetworkInfo)}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
              >
                ℹ️
              </button>
              {showNetworkInfo && (
                <div className="absolute right-0 top-8 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                  <div className="text-xs space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isSignalingConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span>Server: {isSignalingConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="text-gray-500">
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
          
          {status.connectedPeers === 0 && (
            <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
              💡 <strong>Tip:</strong> Share the QR code below to invite others for instant connections!
            </div>
          )}
        </div>


      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            {status.connectedPeers === 0 ? (
              <div className="space-y-4">
                <div className="text-6xl mb-4">🎪</div>
                <h3 className="text-xl font-semibold text-gray-700">Welcome to {roomId}!</h3>
                <p className="text-gray-600">You're the first person here.</p>
                <div className="bg-purple-50 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-purple-800 font-medium mb-2">🚀 Get started:</p>
                  <ol className="text-xs text-purple-700 text-left space-y-1">
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
                <h3 className="text-lg font-semibold text-gray-700">Ready to chat!</h3>
                <p className="text-gray-600">Connected to {status.connectedPeers} {status.connectedPeers === 1 ? 'person' : 'people'}. Start the conversation!</p>
              </div>
            )}
          </div>
        )}
        
        {messages.map((message) => {
          const isMyMessage = message.sender === displayName;
          console.log('💬 Rendering message:', {
            id: message.id,
            sender: message.sender,
            content: message.content,
            isMyMessage,
            currentDisplayName: displayName
          });
          
          return (
            <div
              key={message.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isMyMessage
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                {!isMyMessage && (
                  <div className="font-semibold text-sm mb-1">{message.sender}</div>
                )}
                <div>{message.content}</div>
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
      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-md border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isSignalingConnected ? "Type a message..." : "Connecting to server..."}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            disabled={!isSignalingConnected || !displayName}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isSignalingConnected || !displayName}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {isSignalingConnected ? 'Send' : '⏳'}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {isSignalingConnected 
              ? (status.connectedPeers > 0 
                  ? `Connected to ${status.connectedPeers} other ${status.connectedPeers === 1 ? 'person' : 'people'}` 
                  : 'Connected to server - ready to chat')
              : 'Connecting to server...'
            }
          </span>
          {status.connectedPeers === 0 && isSignalingConnected && (
            <button
              onClick={() => setShowQRModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              📱 Invite Friends
            </button>
          )}
        </div>
      </form>

      {/* Debug Panel - Development & Mobile Diagnostics */}
      {showDebug && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            <MobileDiagnostics
              peerId={peerId}
              roomId={roomId}
              isSignalingConnected={isSignalingConnected}
              connectedPeers={status.connectedPeers}
            />
            
            {/* Mobile Network Debug */}
            <MobileConnectionDebug 
              serverUrl={`http://localhost:3001`} // Will be auto-detected
              className="mt-4"
            />
            
            {/* Enhanced Debug Information */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">🔍 Server Chat Debug</h4>
              <div className="text-xs space-y-1">
                <div>Server Connected: {isSignalingConnected ? 'Yes' : 'No'}</div>
                <div>Message Count: {messages.length}</div>
                <div>Online Users: {status.connectedPeers}</div>
                <div>Connection Mode: WebSocket Server</div>
                <div>Room Persistence: ✅ Yes (survives refreshes)</div>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4">
                <DebugPanel
                  peerId={peerId}
                  connectedPeers={getConnectedPeers()}
                  status={status}
                  roomId={roomId}
                  p2pHook={{
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
                  }}
                />
              </div>
            )}
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
