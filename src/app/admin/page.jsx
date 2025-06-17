'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin analytics page
    router.replace('/admin-analytics');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-2xl font-bold mb-2">Redirecting to Admin Dashboard...</h1>
        <p className="text-purple-200">Taking you to the admin analytics</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
