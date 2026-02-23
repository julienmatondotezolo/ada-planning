'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MinimalAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = React.useState('Processing authentication...');

  // Get redirect URL and token from search params
  const redirectTo = searchParams.get('redirect') || '/';
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    const processAuth = async () => {
      // Check for error in URL
      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        return;
      }

      // Check for token in URL
      if (token) {
        try {
          console.log('Validating token with AdaAuth API...');
          
          // Use ONLY AdaAuth API for token validation
          const response = await fetch('https://adaauth.mindgen.app/auth/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ AdaAuth validation successful:', data.user);
            
            // Store token
            localStorage.setItem('ada_access_token', token);
            localStorage.setItem('access_token', token); // Legacy compatibility
            
            setStatus('success');
            setMessage(`Welcome, ${data.user.email}! Redirecting...`);
            
            // Small delay to show success message, then redirect
            setTimeout(() => {
              window.location.href = redirectTo; // Force navigation to ensure clean state
            }, 1500);
          } else {
            console.error('❌ AdaAuth validation failed:', response.status);
            throw new Error('Token validation failed');
          }
          
        } catch (error) {
          console.error('AdaAuth token validation failed:', error);
          setStatus('error');
          setMessage(`Failed to validate authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return;
      }

      // If no token, something went wrong
      setStatus('error');
      setMessage('No authentication token received. Please try logging in again.');
    };

    processAuth();
  }, [token, error, redirectTo, router]);

  const handleRetry = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo));
    window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#fafafa',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#4d6aff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          AdaPlanning
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Authentication Status
        </p>
        
        <div style={{ marginBottom: '1rem' }}>
          {status === 'processing' && (
            <div style={{ color: '#4d6aff' }}>🔄 Validating via AdaAuth API...</div>
          )}
          {status === 'success' && (
            <div style={{ color: '#10b981' }}>✅ AdaAuth validation successful!</div>
          )}
          {status === 'error' && (
            <div style={{ color: '#ef4444' }}>❌ AdaAuth validation failed</div>
          )}
        </div>
        
        <p style={{ 
          color: status === 'success' ? '#10b981' : 
                status === 'error' ? '#ef4444' : '#666',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {message}
        </p>

        {status === 'error' && (
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: '#4d6aff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Try Again
          </button>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
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

export default function MinimalAuthCallback() {
  return (
    <React.Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>🔄 Loading...</div>
      </div>
    }>
      <MinimalAuthCallbackContent />
    </React.Suspense>
  );
}