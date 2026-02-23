'use client';

import React, { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = () => {
      // Get all auth-related data from localStorage
      const token = localStorage.getItem('ada_access_token');
      const legacyToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('ada_refresh_token');
      
      let tokenData = null;
      let tokenError = null;
      
      // Try to parse token
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            tokenData = {
              payload,
              isExpired: payload.exp && payload.exp < currentTime,
              expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
              userData: {
                id: payload.sub,
                email: payload.email || payload.user_metadata?.email,
                full_name: payload.user_metadata?.full_name,
                role: payload.user_metadata?.restaurant_role || 'staff',
                restaurant_id: payload.user_metadata?.restaurant_id
              }
            };
          }
        } catch (error) {
          tokenError = error instanceof Error ? error.message : String(error);
        }
      }
      
      setDebugInfo({
        hasToken: !!token,
        hasLegacyToken: !!legacyToken,
        hasRefreshToken: !!refreshToken,
        tokenLength: token ? token.length : 0,
        tokenParts: token ? token.split('.').length : 0,
        tokenData,
        tokenError,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    checkAuth();
  }, []);

  const testAdaAuthAPI = async () => {
    const token = localStorage.getItem('ada_access_token');
    if (!token) {
      alert('No token found');
      return;
    }

    try {
      const response = await fetch('https://adaauth.mindgen.app/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      alert(`API Response: ${response.status}\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      alert(`API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('ada_access_token');
    localStorage.removeItem('ada_refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert('Auth data cleared');
    window.location.reload();
  };

  const redirectToAuth = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent('/'));
    window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#4d6aff' }}>🔍 AdaPlanning Auth Debug</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={testAdaAuthAPI} style={{ marginRight: '1rem', padding: '0.5rem', backgroundColor: '#4d6aff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test AdaAuth API
        </button>
        <button onClick={clearAuth} style={{ marginRight: '1rem', padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Clear Auth
        </button>
        <button onClick={redirectToAuth} style={{ padding: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
          Re-authenticate
        </button>
      </div>

      <pre style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '4px', 
        fontSize: '12px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>

      <div style={{ marginTop: '2rem', fontSize: '14px' }}>
        <h3>Common Issues:</h3>
        <ul>
          <li><strong>No token:</strong> Need to authenticate via AdaAuth</li>
          <li><strong>Token expired:</strong> Token exp &lt; current time</li>
          <li><strong>Invalid token format:</strong> Not 3 parts separated by dots</li>
          <li><strong>API validation failing:</strong> CORS or network issues</li>
          <li><strong>Component rendering errors:</strong> Check browser console</li>
        </ul>
      </div>
    </div>
  );
}