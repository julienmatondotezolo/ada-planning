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
  const { user, loading, authenticateWithToken, setUserManually } = useAuth();
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
          console.log('Processing token:', token.substring(0, 50) + '...');
          
          // Parse JWT token to get user info
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', payload);
            
            // Create user object from token payload
            const userData = {
              id: payload.sub,
              email: payload.email || payload.user_metadata?.email,
              full_name: payload.user_metadata?.full_name,
              role: payload.user_metadata?.restaurant_role || 'staff',
              restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140' // L'Osteria
            };
            
            console.log('User data extracted:', userData);
            setDebugInfo(`User: ${userData.email} (${userData.role})`);
            
            // Store token and user data
            localStorage.setItem('ada_access_token', token);
            localStorage.setItem('access_token', token); // Legacy compatibility
            
            // CRITICAL FIX: Update AuthContext user state immediately
            // This prevents the redirect loop by ensuring AuthContext knows user is authenticated
            setUserManually(userData);
            console.log('AuthContext updated with user data:', userData);
            
            setStatus('success');
            setMessage(`Welcome, ${userData.full_name || userData.email}! Redirecting...`);
            
            // Small delay to show success message, then redirect
            setTimeout(() => {
              window.location.href = redirectTo; // Force navigation to ensure clean state
            }, 1500);
          } else {
            throw new Error('Invalid token format');
          }
          
        } catch (error) {
          console.error('Token processing failed:', error);
          setStatus('error');
          setMessage(`Failed to process authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return;
      }

      // If user is already authenticated (from context check)
      if (!loading && user) {
        setStatus('success');
        setMessage('Already authenticated! Redirecting...');
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
        return;
      }

      // If no token and no user, something went wrong
      if (!loading) {
        setStatus('error');
        setMessage('No authentication token received. Please try logging in again.');
      }
    };

    processAuth();
  }, [token, error, redirectTo, user, loading, router, authenticateWithToken, setUserManually]);

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
                  <span>Authenticated via AdaAuth SSO</span>
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
                <span>Validating authentication token...</span>
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