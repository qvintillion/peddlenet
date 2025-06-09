'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoomCodeJoin } from '@/components/RoomCode';

function slugifyRoomName(roomName: string): string {
  return roomName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export default function HomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('displayName');
      if (savedName) setDisplayName(savedName);
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    console.log('🚀 Creating room with name:', roomName);

    try {
      // Ensure user has a display name
      let userName = displayName;
      if (!userName) {
        userName = prompt('Enter your display name:') || `Host_${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('displayName', userName);
        setDisplayName(userName);
        console.log('📝 Set display name:', userName);
      }

      // Create room ID and auto-join
      const roomId = slugifyRoomName(roomName);
      console.log('🏷️ Generated room ID:', roomId);
      
      const targetUrl = `/chat/${roomId}`;
      console.log('🗺️ Navigating to:', targetUrl);
      
      // Use Next.js router now that we have SSR
      router.push(targetUrl);
      console.log('✅ Navigation initiated');
      
    } catch (error) {
      console.error('❌ Error creating room:', error);
      setIsCreating(false);
    }
  };

  // Suggested room names for events
  const suggestedNames = [
    'Main Stage Chat',
    'Food Court Meetup',
    'Lost & Found',
    'Ride Share',
    'After Party Planning',
    'VIP Lounge'
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white px-6 py-12 flex flex-col items-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-4xl font-bold mb-2">PeddleNet</h1>
          <p className="text-purple-200">Create instant P2P chat rooms</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'create'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            🏠 Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'join'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            🚪 Join Room
          </button>
        </div>
        
        {/* Conditional Form Rendering */}
        {mode === 'create' ? (
          <form onSubmit={handleCreateRoom} className="space-y-6" suppressHydrationWarning={true}>
            <div>
              <label className="block mb-3 font-semibold text-lg">Room Name</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                placeholder="e.g. Main Stage VIP"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                disabled={isCreating}
                required
                suppressHydrationWarning={true}
              />
              <p className="mt-1 text-xs text-gray-400">
                This creates Room ID: {roomName ? slugifyRoomName(roomName) : 'room-name-here'}
              </p>
              <p className="mt-1 text-xs text-purple-200">
                💡 Others will join using the Room Code shown in chat
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2">
              <p className="text-sm text-purple-200">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedNames.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setRoomName(suggestion)}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded-full text-sm transition-colors"
                    disabled={isCreating}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!roomName.trim() || isCreating}
              className="w-full py-4 rounded-lg bg-purple-600 font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isCreating ? '🚀 Creating Room...' : '🎪 Create & Join Room'}
            </button>
          </form>
        ) : (
          /* Join Room Form - Room Code Only */
          <div className="space-y-6">
            {/* Room Code Join - Primary Method */}
            <RoomCodeJoin className="" />
            
            {/* Festival Reconnection Tips */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="mr-2">🎪</span>
                Festival Reconnection
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Lost connection? Recent rooms show your history</li>
                <li>• Room codes work even after phone refresh</li>
                <li>• Share room codes with friends as backup</li>
                <li>• All conversations preserved automatically</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">💡</span>
            How it works
          </h3>
          {mode === 'create' ? (
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Create a room and join automatically</li>
              <li>2. Share QR code from chat to invite others</li>
              <li>3. Instant P2P connections (5-10 seconds)</li>
              <li>4. Works offline once connected!</li>
            </ol>
          ) : (
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Get a Room Code from someone (e.g., "blue-stage-42")</li>
              <li>2. Enter it in the Room Code field</li>
              <li>3. Join the conversation instantly</li>
              <li>4. Room Code is saved for quick rejoin</li>
            </ol>
          )}
        </div>

        {displayName && (
          <div className="mt-4 text-center text-sm text-purple-200">
            Creating as: <span className="font-semibold">{displayName}</span>
            <button
              onClick={() => {
                const newName = prompt('Change display name:', displayName);
                if (newName) {
                  localStorage.setItem('displayName', newName);
                  setDisplayName(newName);
                }
              }}
              className="ml-2 text-purple-400 hover:text-purple-300"
            >
              (change)
            </button>
          </div>
        )}

        {/* Network Diagnostics CTA */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <Link
            href="/diagnostics"
            className="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-500 transition-colors text-sm"
          >
            <span className="mr-2">🔍</span>
            Network Diagnostics
          </Link>
          <p className="text-xs text-gray-500 text-center mt-2">
            Test connection capabilities and troubleshoot issues
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Offline - P2P Only</span>
        </div>
      </div>
    </main>
  );
}
