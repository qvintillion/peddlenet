'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useP2POptimized } from '@/hooks/use-p2p-optimized';
import type { Message } from '@/lib/types';
import { DebugPanel } from '@/components/DebugPanel';
import { QRModal } from '@/components/QRModal';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function OptimizedChatRoom({ params }: ChatRoomPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  
  const [displayName, setDisplayName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [manualPeerId, setManualPeerId] = useState('');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // USING OPTIMIZED VERSION HERE!
  const { 
    peerId, 
    status, 
    roomPeers, 
    connectToPeer, 
    sendMessage, 
    onMessage, 
    getConnectedPeers,
    forceReconnect,
    clearRoomPeers
  } = useP2POptimized(roomId);

  // Get/set display name
  useEffect(() => {
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
    const cleanup = onMessage((message) => {
      console.log('Adding message to UI:', message);
      setMessages(prev => {
        // Avoid duplicate messages
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return cleanup;
  }, [onMessage]);

  // Auto-scroll to bottom when new messages arrive
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

    // Add to local messages immediately
    const localMessage: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      if (prev.some(m => m.id === localMessage.id)) {
        return prev;
      }
      return [...prev, localMessage].sort((a, b) => a.timestamp - b.timestamp);
    });

    setInputMessage('');
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPeerId.trim() || manualPeerId === peerId) return;

    try {
      console.log('Manually connecting to peer:', manualPeerId);
      const success = await connectToPeer(manualPeerId.trim());
      
      if (success) {
        setManualPeerId('');
        setShowManualConnect(false);
        alert('Connected successfully!');
      } else {
        alert('Failed to connect. Make sure the Peer ID is correct and the peer is online.');
      }
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      alert('Failed to connect to peer. Make sure the Peer ID is correct.');
    }
  };

  const copyPeerId = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      alert('Peer ID copied to clipboard!');
    }
  };

  const handleClearRoom = () => {
    if (confirm('Clear all stored peers for this room? This will reset connections.')) {
      clearRoomPeers();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Optimized Version Banner */}
      <div className="bg-green-600 text-white p-2 text-center text-sm font-bold">
        🚀 Using OPTIMIZED P2P Implementation - Faster Connections!
      </div>
      
      {/* HTTPS Warning */}
      {typeof window !== 'undefined' && window.location.protocol === 'http:' && (
        <div className="bg-red-600 text-white p-3 text-center text-sm">
          ⚠️ <strong>HTTPS Required:</strong> P2P connections need HTTPS. 
          <a href="https://github.com/yourrepo#https-setup" className="underline ml-2">Setup Guide</a>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">Room: {roomId.slice(0, 8)}...</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              📱 QR Code
            </button>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-purple-600 hover:text-purple-700"
            >
              ← Home
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">
              {status.isConnected ? `Connected (${status.connectedPeers} peers)` : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={forceReconnect}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              Retry Auto-Connect
            </button>
            <button
              onClick={() => setShowManualConnect(!showManualConnect)}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              Manual Connect
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="text-xs text-gray-500 mb-2">
          Room Peers: {roomPeers.length} | Connected: {getConnectedPeers().length}
          {peerId && (
            <span className="ml-2">| Your ID: {peerId.slice(0, 8)}...</span>
          )}
        </div>

        {/* Peer ID Display */}
        {peerId && showDebug && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Your Full Peer ID:</span>
              <div className="flex space-x-1">
                <button
                  onClick={copyPeerId}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
                <button
                  onClick={handleClearRoom}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear Room
                </button>
              </div>
            </div>
            <div className="font-mono text-gray-800 break-all">{peerId}</div>
          </div>
        )}

        {/* Manual Connect Form */}
        {showManualConnect && (
          <form onSubmit={handleManualConnect} className="mt-2 flex space-x-2">
            <input
              type="text"
              value={manualPeerId}
              onChange={(e) => setManualPeerId(e.target.value)}
              placeholder="Enter Peer ID to connect"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
            {!status.isConnected && (
              <div className="text-sm mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="font-semibold mb-2">Connection Help:</p>
                <ol className="text-left list-decimal list-inside space-y-1">
                  <li>Make sure both devices scanned the same QR code</li>
                  <li>Wait 10-15 seconds for auto-connection</li>
                  <li>Try "Retry Auto-Connect" button above</li>
                  <li>As backup, use "Manual Connect" with the other device's Peer ID</li>
                </ol>
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
                  ? 'bg-blue-500 text-white'
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

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-md">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        
        {status.connectedPeers > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Connected to {status.connectedPeers} peer{status.connectedPeers !== 1 ? 's' : ''}
          </div>
        )}
      </form>

      {/* Debug Panel */}
      {showDebug && (
        <DebugPanel
          peerId={peerId}
          connectedPeers={getConnectedPeers()}
          status={status}
          roomId={roomId}
        />
      )}

      {/* QR Modal */}
      <QRModal
        roomId={roomId}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
