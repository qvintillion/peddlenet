#!/bin/bash

echo "🚨 SWITCHING TO EMERGENCY CHAT MODE"
echo "=================================="

# Backup the current chat page
cp "src/app/chat/[roomId]/page.tsx" "src/app/chat/[roomId]/page.tsx.backup.$(date +%Y%m%d-%H%M%S)"

echo "📋 Original chat page backed up"

# Create emergency chat page that uses the simplified hook
cat > "src/app/chat/[roomId]/page.tsx" << 'EOF'
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEmergencyHybridChat } from '@/hooks/use-emergency-hybrid-chat';
import type { Message } from '@/lib/types';

// EMERGENCY SIMPLIFIED CHAT PAGE
// This bypasses all complex features and focuses only on basic chat functionality

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function EmergencyChatRoomPage() {
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
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // EMERGENCY: Use simplified hybrid chat (WebSocket only)
  const {
    status,
    messages,
    sendMessage,
    isRetrying,
    retryCount,
    getConnectionDiagnostics,
    forceReconnect
  } = useEmergencyHybridChat(roomId, displayName);

  // Early return for invalid room
  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-900 via-black to-red-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-xl font-semibold mb-2">Emergency Mode - Invalid Room</h2>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Get display name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('displayName');
      if (storedName) {
        setDisplayName(storedName);
      } else {
        const name = prompt('🚨 Emergency Mode - Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
        setDisplayName(name);
        localStorage.setItem('displayName', name);
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !displayName) return;

    console.log('🚨 EMERGENCY: Sending message:', inputMessage);

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

  // Debug info
  const debugInfo = getConnectionDiagnostics();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-red-900 via-black to-red-900 text-white">
      {/* EMERGENCY HEADER */}
      <div className="bg-red-900/80 backdrop-blur border-b border-red-700 p-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-red-800/50 transition"
          >
            🚨 Emergency Mode
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-red-400 hover:text-white"
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Room: {roomId}</h1>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : (isRetrying ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')}`} />
            <span className="text-sm">
              {status.isConnected ? `${status.connectedPeers} online` : isRetrying ? `Connecting (${retryCount})` : 'Disconnected'}
            </span>
            {!status.isConnected && (
              <button
                onClick={forceReconnect}
                className="px-2 py-1 bg-red-600 text-xs rounded hover:bg-red-700"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mt-4 p-3 bg-red-800/50 rounded border text-xs">
            <h4 className="font-bold mb-2">🚨 Emergency Debug Info</h4>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-red-300 mt-8">
            <div className="text-6xl mb-4">🚨</div>
            <h3 className="text-xl font-semibold text-white">Emergency Chat Mode</h3>
            <p className="text-red-400">Simplified WebSocket-only chat for debugging</p>
            {status.connectedPeers === 0 && status.isConnected && (
              <p className="text-red-300 mt-2">Connected to server - waiting for other users</p>
            )}
            {!status.isConnected && (
              <p className="text-red-400 mt-2">Not connected to server - check console for errors</p>
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
                className={`max-w-[85%] rounded-lg p-3 ${
                  isMyMessage
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-600'
                }`}
              >
                {!isMyMessage && (
                  <div className="font-semibold text-sm mb-1">{message.sender}</div>
                )}
                <div className="text-sm break-words">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE INPUT */}
      <form onSubmit={handleSendMessage} className="bg-red-900/95 backdrop-blur p-4 border-t border-red-700 shrink-0">
        <div className="flex space-x-2 items-end">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={status.isConnected ? "Emergency message..." : "Connecting..."}
            className="flex-1 p-3 bg-gray-800 border border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
            disabled={!status.isConnected || !displayName}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !status.isConnected || !displayName}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-red-400">
          🚨 Emergency Mode: {status.isConnected ? 'WebSocket connected' : 'Connecting to server...'}
          {displayName && ` | Logged in as: ${displayName}`}
        </div>
      </form>
    </div>
  );
}
EOF

echo "✅ Emergency chat page created"

echo ""
echo "🚨 EMERGENCY MODE ACTIVATED!"
echo "============================="
echo ""
echo "The chat page now uses a simplified WebSocket-only implementation"
echo "that bypasses all complex WebRTC and hybrid logic."
echo ""
echo "📋 What this does:"
echo "- Uses only WebSocket connections (no WebRTC)"
echo "- Aggressive console logging with 🚨 EMERGENCY prefix"
echo "- Simplified connection logic"
echo "- Built-in debug panel"
echo "- Red emergency theme"
echo ""
echo "📋 Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy to staging: npm run staging:vercel:complete"
echo "3. Check browser console for 🚨 EMERGENCY logs"
echo ""
echo "📋 To revert:"
echo "- Restore backup: cp src/app/chat/[roomId]/page.tsx.backup.* src/app/chat/[roomId]/page.tsx"
