'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useP2PPersistent } from '@/hooks/use-p2p-persistent';
import type { Message } from '@/lib/types';
import { QRModal } from '@/components/QRModal';

export default function ChatRoomTestPage() {
  const router = useRouter();
  const roomId = 'test-room'; // Fixed room ID for testing

  const [displayName, setDisplayName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [manualPeerId, setManualPeerId] = useState('');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    peerId,
    status,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers,
  } = useP2PPersistent(roomId, displayName);

  // Get display name
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
      console.log('📨 Received message:', message);
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
    
    const urlParams = new URLSearchParams(window.location.search);
    const hostPeerId = urlParams.get('host');
    const hostName = urlParams.get('name');
    
    if (hostPeerId && hostName && hostPeerId !== peerId) {
      console.log('📱 Found host peer info in URL:', hostPeerId);
      console.log('📱 My peer ID:', peerId);
      
      // Try to connect after a delay
      setTimeout(async () => {
        console.log('📱 Attempting to connect to host...');
        const success = await connectToPeer(hostPeerId);
        if (success) {
          console.log('✅ Connected to host via QR!');
        } else {
          console.log('❌ Failed to connect to host');
        }
      }, 2000);
    }
  }, [peerId, connectToPeer]);

  // Auto-scroll messages
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

    console.log('🔗 Manual connect to:', manualPeerId);
    const success = await connectToPeer(manualPeerId.trim());
    
    if (success) {
      setManualPeerId('');
      setShowManualConnect(false);
      alert('Connected successfully! 🎉');
    } else {
      alert('Connection failed. Check the peer ID and try again. 😞');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 border-b-4 border-purple-500">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl font-bold">🧪 {roomId} (Test Mode)</h1>
            <p className="text-xs text-gray-600">Simplified P2P Connection</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
            >
              📱 QR Code
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="text-purple-600 hover:text-purple-700"
            >
              ← Home
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {peerId ? `Peer ID: ${peerId.substring(0, 8)}...` : 'Initializing...'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {status.connectedPeers} connected
            </span>
          </div>
          
          {getConnectedPeers().length > 0 && (
            <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
              ✅ Connected to: {getConnectedPeers().map(id => id.substring(0, 8)).join(', ')}
            </div>
          )}
          
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setShowManualConnect(!showManualConnect)}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Manual Connect
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(peerId || '')}
              className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Copy My ID
            </button>
          </div>
        </div>

        {/* Manual Connect Form */}
        {showManualConnect && (
          <form onSubmit={handleManualConnect} className="mt-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualPeerId}
                onChange={(e) => setManualPeerId(e.target.value)}
                placeholder="Enter peer ID (e.g., a1b2c3d4-...)"
                className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Connect
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold text-gray-700">Test Room: {roomId}</h3>
            <p className="text-gray-600 mb-4">
              {status.connectedPeers === 0 
                ? "Share QR code or use manual connect to test P2P"
                : `Connected to ${status.connectedPeers} peer(s) - ready to chat!`
              }
            </p>
            
            {peerId && (
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800 font-medium mb-2">🔧 Testing Instructions:</p>
                <ol className="text-xs text-blue-700 text-left space-y-1">
                  <li>1. Share QR code with another device</li>
                  <li>2. Or use "Manual Connect" with peer ID</li>
                  <li>3. Watch console logs for connection details</li>
                  <li>4. Test messaging between devices</li>
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

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-md border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={status.connectedPeers > 0 ? "Type a message..." : "Connect to someone to start chatting..."}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={status.connectedPeers === 0}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || status.connectedPeers === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {status.connectedPeers > 0 
            ? `Ready to chat with ${status.connectedPeers} peer(s)` 
            : 'No connections - share QR code or use manual connect'
          }
        </div>
      </form>

      {/* QR Modal */}
      <QRModal
        roomId={roomId}
        peerId={peerId}
        displayName={displayName}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
