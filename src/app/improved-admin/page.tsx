'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { slugifyRoomName, generateFestivalRoomName } from '../../utils/room-utils';

export default function ImprovedAdminPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('displayName');
    if (storedName) {
      setDisplayName(storedName);
    }
  }, []);

  const generateQRCode = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    if (!displayName.trim()) {
      const name = prompt('Enter your display name:') || `User_${Math.floor(Math.random() * 1000)}`;
      setDisplayName(name);
      localStorage.setItem('displayName', name);
    }

    setIsGenerating(true);
    
    // Slugify the room name to create a short, readable ID
    const slugifiedId = slugifyRoomName(roomName);
    setRoomId(slugifiedId);
    
    // Generate QR code
    const baseUrl = window.location.origin;
    const chatUrl = `${baseUrl}/chat/${slugifiedId}`;
    setFullUrl(chatUrl);
    
    try {
      const qrUrl = await QRCode.toDataURL(chatUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestRoomName = () => {
    const suggestion = generateFestivalRoomName();
    setRoomName(suggestion);
  };

  const joinRoom = () => {
    if (roomId) {
      router.push(`/chat/${roomId}`);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  const copyFullUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    alert('Full URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
          Festival Chat
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-4">Create a Chat Room</h2>
          
          {/* Room Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Room Name
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Main Stage VIP"
                className="flex-1 p-3 rounded-lg bg-white/20 backdrop-blur text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={suggestRoomName}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                title="Suggest a room name"
              >
                🎲
              </button>
            </div>
            {roomName && (
              <div className="mt-2 text-sm text-gray-300">
                Room ID will be: <span className="font-mono text-yellow-400">{slugifyRoomName(roomName)}</span>
              </div>
            )}
          </div>

          {/* Display Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                localStorage.setItem('displayName', e.target.value);
              }}
              placeholder="Enter your name"
              className="w-full p-3 rounded-lg bg-white/20 backdrop-blur text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQRCode}
            disabled={isGenerating || !roomName.trim()}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>

        {/* QR Code Display */}
        {qrCodeUrl && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-center">Room QR Code</h3>
            
            <div className="bg-white p-4 rounded-lg mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-full" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between bg-white/10 p-2 rounded">
                <span className="text-sm">Room ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-yellow-400">{roomId}</span>
                  <button
                    onClick={copyRoomId}
                    className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/10 p-2 rounded">
                <span className="text-sm">URL:</span>
                <button
                  onClick={copyFullUrl}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded"
                >
                  Copy Full URL
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-300 mb-4">
              Others can scan this QR code to join your room instantly!
            </div>

            <button
              onClick={joinRoom}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            >
              Enter Chat Room
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-300">
          <p>1. Enter a memorable room name</p>
          <p>2. Generate QR code</p>
          <p>3. Share with friends at the festival</p>
          <p>4. Chat without internet!</p>
        </div>
      </div>
    </div>
  );
}
