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
import { ExternalLink, LogIn } from 'lucide-react';

function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Auto-redirect to AdaAuth for SSO
  useEffect(() => {
    if (!loading && !user) {
      // Build redirect URL to come back to ada-planning after auth
      const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectTo));
      
      // Redirect to AdaAuth centralized login
      setTimeout(() => {
        window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
      }, 1500); // Short delay to show the redirect message
    }
  }, [loading, user, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size="lg" variant="primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
              You'll be redirected to AdaAuth for secure login
            </p>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <LogIn className="h-3 w-3" />
              <span>Single Sign-On (SSO) Authentication</span>
            </div>
          </div>

          {/* Manual redirect link if auto-redirect fails */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              If you're not redirected automatically:
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