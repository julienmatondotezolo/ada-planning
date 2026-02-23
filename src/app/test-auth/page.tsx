'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, loading, login, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState({ accessToken: false, refreshToken: false });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setTokenInfo({
        accessToken: !!localStorage.getItem('access_token'),
        refreshToken: !!localStorage.getItem('refresh_token')
      });
    }
  }, []);

  const testLogin = async () => {
    try {
      await login('admin@losteria.be', 'AdaPlanning2026!');
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!isClient) {
    return <div className="p-8">Loading...</div>;
  }

  if (loading) {
    return <div className="p-8">Loading authentication...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Authentication Status:</h3>
          <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
        </div>

        {user ? (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-semibold text-green-800">User Details:</h3>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Name: {user.full_name || 'N/A'}</p>
            <p>Role: {user.role}</p>
            <button 
              onClick={logout}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="p-4 bg-red-100 rounded">
            <h3 className="font-semibold text-red-800">Not Authenticated</h3>
            <p>You need to log in to access protected content.</p>
            <button 
              onClick={testLogin}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Login
            </button>
            <a 
              href="/login"
              className="mt-2 ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
            >
              Go to Login Page
            </a>
          </div>
        )}

        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">Token Info:</h3>
          <p>Access Token: {tokenInfo.accessToken ? 'Present' : 'Missing'}</p>
          <p>Refresh Token: {tokenInfo.refreshToken ? 'Present' : 'Missing'}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Emergency Actions:</h3>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.clear();
                alert('All localStorage cleared!');
                window.location.reload();
              }
            }}
            className="block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mb-2"
          >
            🛑 Clear All Data & Reload
          </button>

          <a
            href="/break-loop"
            className="block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-center"
          >
            🔧 Break Authentication Loops
          </a>
        </div>
      </div>
    </div>
  );
}