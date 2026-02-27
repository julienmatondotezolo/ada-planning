'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Spinner, AdaLogo } from 'ada-design-system';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        const redirect = searchParams.get('redirect') || '/';
        const error = searchParams.get('error');
        
        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }
        
        if (!token) {
          setStatus('error');
          setMessage('No authentication token received');
          return;
        }
        
        console.log('🔐 Processing authentication token...');
        setMessage('Storing authentication credentials...');
        
        // Store token via API route (sets httpOnly cookie)
        const response = await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
          throw new Error('Failed to store authentication token');
        }
        
        console.log('✅ Authentication token stored successfully');
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Small delay for user feedback, then redirect
        setTimeout(() => {
          console.log('↗️ Redirecting to:', redirect);
          
          // Force router refresh to get new user data from server
          router.refresh();
          router.push(redirect);
        }, 1000);
        
      } catch (error) {
        console.error('❌ Authentication error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    };

    processAuth();
  }, [searchParams, router]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><span className="text-white text-sm">✓</span></div>;
      case 'error': return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-sm">✕</span></div>;
      default: return <Spinner size="md" variant="primary" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <AdaLogo size="lg" variant="primary" className="mx-auto mb-6" />
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            AdaPlanning Authentication
          </h1>
          
          <p className={`text-sm ${getStatusColor()}`}>
            {message}
          </p>
          
          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => {
                  const returnUrl = encodeURIComponent(
                    window.location.origin + '/auth/callback?redirect=' + encodeURIComponent('/')
                  );
                  window.location.href = `https://auth.adasystems.app/?redirect=${returnUrl}`;
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-500">
            <a 
              href="https://auth.adasystems.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700"
            >
              Powered by AdaAuth
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" variant="primary" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}