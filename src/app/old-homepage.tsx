import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-6">🎵</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {APP_CONFIG.name}
        </h1>
        <p className="text-gray-600 mb-8">
          Connect with people nearby without internet!
        </p>
        
        <div className="space-y-4">
          <Link
            href="/admin"
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors block"
          >
            Create Room
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            Create a room and share the QR code to invite others instantly!
          </p>
          
          <Link
            href="/diagnostics"
            className="w-full border-2 border-gray-400 text-gray-600 py-2 px-4 rounded-xl text-sm hover:bg-gray-50 transition-colors block"
          >
            🔍 Network Diagnostics
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Offline - P2P Only</span>
        </div>
      </div>
    </div>
  );
}
