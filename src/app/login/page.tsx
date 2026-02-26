'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { ExternalLink, LogIn } from 'lucide-react';

function LoginPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/';

  // If user is already authenticated (shouldn't happen — middleware redirects),
  // just navigate to the target page
  useEffect(() => {
    if (user) {
      console.log('✅ User already authenticated, redirecting...');
      window.location.href = redirectTo;
    }
  }, [user, redirectTo]);

  // Auto-redirect to AdaAuth for SSO
  useEffect(() => {
    if (!user) {
      console.log('🔄 No user found, redirecting to AdaAuth in 1.5s...');
      const currentUrl = encodeURIComponent(
        window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo)
      );
      
      const redirectTimer = setTimeout(() => {
        console.log('🔗 Redirecting to AdaAuth SSO now...');
        window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, redirectTo]);

  if (user) {
    return null; // Will redirect
  }

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
              Redirecting to centralized login...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Spinner size="lg" variant="primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You&apos;ll be redirected to AdaAuth for secure login
            </p>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <LogIn className="h-3 w-3" />
              <span>Single Sign-On (SSO) Authentication</span>
            </div>
          </div>

          {/* Manual redirect link if auto-redirect fails */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              If you&apos;re not redirected automatically:
            </p>
            <a
              href={`https://adaauth.mindgen.app/?redirect=${encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo))}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
            >
              <span>Click here to login</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size="lg" variant="primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
