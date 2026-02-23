'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, loading, login, logout } = useAuth();

  const testLogin = async () => {
    try {
      await login('admin@losteria.be', 'AdaPlanning2026!');
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

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
          <p>Access Token: {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</p>
          <p>Refresh Token: {localStorage.getItem('refresh_token') ? 'Present' : 'Missing'}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test API Calls:</h3>
          <button 
            onClick={async () => {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/health`);
                const data = await response.json();
                console.log('Health check:', data);
                alert('Health check: ' + JSON.stringify(data, null, 2));
              } catch (error) {
                console.error('Health check failed:', error);
                alert('Health check failed: ' + error);
              }
            }}
            className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-2"
          >
            Test Health Endpoint (No Auth)
          </button>

          <button 
            onClick={async () => {
              try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                const data = await response.json();
                console.log('Staff API:', data);
                alert('Staff API: ' + JSON.stringify(data, null, 2));
              } catch (error) {
                console.error('Staff API failed:', error);
                alert('Staff API failed: ' + error);
              }
            }}
            className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Staff Endpoint (Auth Required)
          </button>
        </div>
      </div>
    </div>
  );
}