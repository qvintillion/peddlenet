'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useP2PPersistent } from '@/hooks/use-p2p-persistent';
import type { Message } from '@/lib/types';
import { DebugPanel } from '@/components/DebugPanel';
import { QRModal } from '@/components/QRModal';
import { P2PDebugUtils } from '@/utils/p2p-debug';
import { MobileConnectionDebug } from '@/utils/mobile-debug';
import { QRPeerUtils } from '@/utils/qr-peer-utils';

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [displayName, setDisplayName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [manualPeerId, setManualPeerId] = useState('');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const p2pHook = useP2PPersistent(roomId, displayName);
  const {
    peerId,
    status,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers,
  } = p2pHook;

  // Get/set display name
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set display name
    const storedName = localStorage.getItem('displayName');
    if (storedName) {
      setDisplayName(storedName);
    } else {
      const name = prompt('Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
      setDisplayName(name);
      localStorage.setItem('displayName', name);
    }
  }, []);

  // Handle incoming messages
  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      console.log('Received message:', message);
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.id === message.id);
        if (isDuplicate) return prev;
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
    
    if (hostPeerId && hostName) {
      console.log('📱 Found host peer info in URL:', hostPeerId);
      console.log('📱 My current peer ID:', peerId);
      
      // Don't try to connect to ourselves
      if (hostPeerId === peerId) {
        console.log('🙅 Skipping self-connection');
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
        QRPeerUtils.connectToHostPeer(roomId, p2pHook);
      }, 3000);
    }
  }, [peerId, roomId, p2pHook]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageData: Omit<Message, 'id' | 'timestamp'> = {
      type: 'chat',
      content: inputMessage.trim(),
      sender: displayName,
      roomId: roomId,
      synced: false,
    };

    // Send to peers
    const messageId = sendMessage(messageData);

    // Add to local messages
    const localMessage: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const isDuplicate = prev.some(m => m.id === localMessage.id);
      if (isDuplicate) return prev;
      return [...prev, localMessage].sort((a, b) => a.timestamp - b.timestamp);
    });

    setInputMessage('');
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPeerId.trim() || manualPeerId === peerId) return;

    try {
      const success = await connectToPeer(manualPeerId.trim());
      if (success) {
        setManualPeerId('');
        setShowManualConnect(false);
        alert('Connected successfully!');
      } else {
        alert('Failed to connect. Check the Peer ID and try again.');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Connection failed.');
    }
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

        {/* Enhanced Connection Status */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-900">
                {status.isConnected ? `Connected to ${status.connectedPeers} ${status.connectedPeers === 1 ? 'person' : 'people'}` : 'Waiting for connections...'}
              </span>
            </div>
            
            {!status.isConnected && (
              <button
                onClick={() => console.log('🔄 Retry not available in persistent mode')}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🔄 Retry
              </button>
            )}
          </div>
          
          {status.connectedPeers === 0 && (
            <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
              💡 <strong>Tip:</strong> Share the QR code above to invite others for instant connections!
            </div>
          )}
          
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setShowManualConnect(!showManualConnect)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Manual Connect
            </button>
            <button
              onClick={() => console.log('🧹 Clean stale not needed in persistent mode')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              🧹 Clean Stale
            </button>
          </div>
        </div>

        {/* Manual Connect Form */}
        {showManualConnect && (
          <form onSubmit={handleManualConnect} className="mt-2 flex space-x-2">
            <input
              type="text"
              value={manualPeerId}
              onChange={(e) => setManualPeerId(e.target.value)}
              placeholder="Enter Peer ID"
              className="flex-1 p-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Connect
            </button>
          </form>
        )}
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
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === displayName ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === displayName
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              {message.sender !== displayName && (
                <div className="font-semibold text-sm mb-1">{message.sender}</div>
              )}
              <div>{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-md border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={status.connectedPeers > 0 ? "Type a message..." : "Waiting for connections to send messages..."}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            disabled={status.connectedPeers === 0}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || status.connectedPeers === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {status.connectedPeers > 0 ? 'Send' : '⏳'}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {status.connectedPeers > 0 
              ? `Connected to ${status.connectedPeers} ${status.connectedPeers === 1 ? 'person' : 'people'}` 
              : 'No connections - invite others to start chatting'
            }
          </span>
          {status.connectedPeers === 0 && (
            <button
              onClick={() => setShowQRModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              📱 Invite Friends
            </button>
          )}
        </div>
      </form>

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && showDebug && (
        <DebugPanel
          peerId={peerId}
          connectedPeers={getConnectedPeers()}
          status={status}
          roomId={roomId}
          p2pHook={p2pHook}
        />
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
