'use client';

import React, { useEffect } from 'react';

export default function BreakLoopPage() {
  useEffect(() => {
    // Immediately clear everything to break any loops
    console.log('🛑 EMERGENCY: Breaking authentication loops');
    
    // Clear all localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ada_access_token');
      localStorage.removeItem('ada_refresh_token'); 
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear any other potential auth data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Clear any running timers or intervals
    for (let i = 1; i < 99999; i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }

    console.log('✅ Emergency clear completed');
  }, []);

  const goHome = () => {
    window.location.href = '/';
  };

  const goAuth = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent('/'));
    window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#fef2f2',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        border: '1px solid #fecaca'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛑</div>
        
        <h1 style={{ 
          color: '#dc2626', 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          Loop Breaker Activated
        </h1>
        
        <p style={{ 
          color: '#374151', 
          marginBottom: '1.5rem',
          lineHeight: '1.6'
        }}>
          Emergency action completed! All authentication data has been cleared to break any infinite loops.
        </p>

        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#15803d', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            ✅ Actions Taken:
          </h3>
          <ul style={{ 
            color: '#166534', 
            textAlign: 'left', 
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            <li>Cleared all authentication tokens</li>
            <li>Removed cached user data</li>
            <li>Stopped all running timers</li>
            <li>Reset authentication state</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={goHome}
            style={{
              backgroundColor: '#4d6aff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🏠 Go to Home
          </button>
          
          <button
            onClick={goAuth}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none', 
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔐 Fresh Login
          </button>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6b7280' }}>
          <p>If you continue to experience issues, contact support.</p>
          <a 
            href="https://adaauth.mindgen.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4d6aff', textDecoration: 'none' }}
          >
            Powered by AdaAuth ↗
          </a>
        </div>
      </div>
    </div>
  );
}