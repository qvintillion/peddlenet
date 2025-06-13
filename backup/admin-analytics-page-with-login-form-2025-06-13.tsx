'use client';

// 🔒 ADMIN AUTHENTICATION WITH CUSTOM LOGIN - June 13, 2025
// Professional login form with session management and logout capability
// Better UX than HTTP Basic Auth

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerUtils } from '@/utils/server-utils';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Authentication state interface
interface AuthCredentials {
  username: string;
  password: string;
}

// Helper function to make authenticated API calls
function makeAuthenticatedRequest(url: string, credentials: AuthCredentials, options: RequestInit = {}): Promise<Response> {
  const authHeaders = {
    'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers: authHeaders
  });
}

// Login Form Component
function LoginForm({ onLogin, error, isLoading }: {
  onLogin: (credentials: AuthCredentials) => void;
  error: string | null;
  isLoading: boolean;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin({ username: username.trim(), password: password.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white flex items-center justify-center">
      <div className="bg-gray-800/80 rounded-lg p-8 w-full max-w-md backdrop-blur-sm border border-gray-700/50">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
            Admin Login
          </h1>
          <p className="text-gray-300 mt-2">Festival Chat Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter admin username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <div className="font-bold text-red-300">Authentication Failed</div>
                  <div className="text-red-400 text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Authenticating...
              </>
            ) : (
              <>
                <span className="mr-2">🔐</span>
                Login to Admin Dashboard
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <div>Secure admin access for festival management</div>
          <div className="mt-2 text-xs">
            Contact system administrator if you need access
          </div>
        </div>
      </div>
    </div>
  );
}