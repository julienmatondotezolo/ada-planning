'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  AdaLogo,
  Spinner
} from 'ada-design-system';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

function AuthCallbackContent() {
  const { user, loading, authenticateWithToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = React.useState('Processing authentication...');
  const [debugInfo, setDebugInfo] = React.useState<string>('');

  // Get redirect URL and token from search params
  const redirectTo = searchParams.get('redirect') || '/';
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const processAuth = async () => {
      console.log('🔄 Processing authentication callback...', { token: !!token, error, redirectTo });
      
      // Check for error in URL
      if (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
        }
        return;
      }

      // Check for token in URL - DIRECT PROCESSING
      if (token) {
        try {
          console.log('🔑 Token found - processing directly...');
          
          // Parse JWT token directly (no API call to prevent loops)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT token format');
          }
          
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🎯 Token payload parsed:', payload);
          
          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('ada_access_token', token);
            console.log('💾 Token stored in localStorage');
          }
          
          // Create user object from token
          const userData = {
            id: payload.sub,
            email: payload.email || payload.user_metadata?.email,
            full_name: payload.user_metadata?.full_name || payload.full_name,
            role: payload.user_metadata?.restaurant_role || 'staff',
            restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
          };
          
          console.log('👤 User data created:', userData);
          
          if (isMounted) {
            setStatus('success');
            setMessage(`Welcome ${userData.full_name || userData.email}! Redirecting to AdaPlanning...`);
            setDebugInfo(`Authenticated as ${userData.role} for L'Osteria`);
            
            // Set user in auth context and wait for it to complete
            try {
              await authenticateWithToken(token);
              console.log('✅ Auth context updated successfully');
              
              // Multiple redirect strategies for robustness
              setTimeout(() => {
                if (isMounted) {
                  console.log('↗️ ATTEMPTING REDIRECT to:', redirectTo);
                  
                  // Strategy 1: Next.js router (preferred)
                  try {
                    console.log('🔄 Trying router.push...');
                    router.push(redirectTo);
                    
                    // Strategy 2: Fallback with window.location after delay
                    setTimeout(() => {
                      console.log('🔄 Fallback: Using window.location.href');
                      window.location.href = redirectTo;
                    }, 2000);
                    
                  } catch (routerError) {
                    console.error('❌ router.push failed:', routerError);
                    // Strategy 3: Immediate window.location fallback
                    console.log('🔄 Emergency fallback: window.location.replace');
                    window.location.replace(redirectTo);
                  }
                }
              }, 500); // Faster redirect
              
            } catch (authError) {
              console.error('❌ Auth context update failed:', authError);
              if (isMounted) {
                setStatus('error');
                setMessage('Authentication context update failed. Please try again.');
              }
            }
          }
          
        } catch (error) {
          console.error('❌ Token processing failed:', error);
          if (isMounted) {
            setStatus('error');
            setMessage(`Failed to process authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        return;
      }

      // If no token and no error, something went wrong
      if (isMounted) {
        setStatus('error');
        setMessage('No authentication token received. Please try logging in again.');
        setDebugInfo('Missing token parameter in callback URL');
      }
    };

    processAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token, error, redirectTo]); // Simplified dependencies

  const handleRetry = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo));
    window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <AdaLogo size="lg" variant="primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              AdaPlanning
            </CardTitle>
            <CardDescription className="mt-2">
              Authentication Status
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            {status === 'processing' && <Spinner size="lg" variant="primary" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-12 w-12 text-red-500" />}
          </div>
          
          <div className="space-y-2">
            <p className={`text-sm ${
              status === 'success' ? 'text-green-600' :
              status === 'error' ? 'text-red-600' :
              'text-muted-foreground'
            }`}>
              {message}
            </p>
            
            {status === 'success' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Authenticated via AdaAuth API</span>
                </div>
                {debugInfo && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    {debugInfo}
                  </div>
                )}
                
                {/* Manual redirect button as backup */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      console.log('🔄 Manual redirect clicked');
                      window.location.href = redirectTo;
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Click here if redirect doesn't work
                  </button>
                </div>
              </div>
            )}
            
            {status === 'processing' && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Validating token via AdaAuth API...</span>
              </div>
            )}
          </div>

          {/* Retry button for errors */}
          {status === 'error' && (
            <div className="pt-4 border-t space-y-3">
              <button
                onClick={handleRetry}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
              >
                <span>Try Again</span>
                <ExternalLink className="h-3 w-3" />
              </button>
              
              <p className="text-xs text-muted-foreground">
                You'll be redirected to AdaAuth for authentication
              </p>
            </div>
          )}

          {/* AdaAuth Link */}
          <div className="text-center pt-2">
            <a
              href="https://adaauth.mindgen.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>Powered by AdaAuth</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size="lg" variant="primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}