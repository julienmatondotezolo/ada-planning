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
      // Check for error in URL
      if (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
        }
        return;
      }

      // Check for token in URL
      if (token) {
        try {
          console.log('🔄 Processing token via AdaAuth API - ONE TIME ONLY');
          
          // Use ONLY AdaAuth API for token validation
          const success = await authenticateWithToken(token);
          
          if (isMounted && success) {
            setStatus('success');
            setMessage(`Welcome! Redirecting to your dashboard...`);
            setDebugInfo('Authentication successful via AdaAuth API');
            
            // Small delay to show success message, then redirect
            setTimeout(() => {
              if (isMounted) router.push(redirectTo);
            }, 1500);
          } else if (isMounted) {
            throw new Error('Token validation failed');
          }
          
        } catch (error) {
          console.error('AdaAuth token validation failed:', error);
          if (isMounted) {
            setStatus('error');
            setMessage(`Failed to validate authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        return;
      }

      // If user is already authenticated (from context check)
      if (!loading && user) {
        if (isMounted) {
          setStatus('success');
          setMessage('Already authenticated! Redirecting...');
          setDebugInfo(`User: ${user.email} (${user.role})`);
          setTimeout(() => {
            if (isMounted) router.push(redirectTo);
          }, 1000);
        }
        return;
      }

      // If no token and no user, something went wrong
      if (!loading && isMounted) {
        setStatus('error');
        setMessage('No authentication token received. Please try logging in again.');
      }
    };

    processAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token, error, redirectTo, user, loading]); // REMOVED authenticateWithToken from dependencies!

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