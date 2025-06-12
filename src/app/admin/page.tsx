'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage since admin functionality is now there
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-2xl font-bold mb-2">Redirecting to PeddleNet...</h1>
        <p className="text-purple-200">Taking you to the main page</p>
      </div>
    </div>
  );
}
