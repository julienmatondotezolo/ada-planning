'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdaLogo, Spinner } from '@/components/ui';
import { AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user, loading } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect to AdaAuth registration
  const handleRegister = () => {
    const currentUrl = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `https://adaauth.mindgen.app/register?redirect=${currentUrl}`;
  };

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
              Sign in to manage employee schedules for L'Osteria
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-medium py-2.5"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" variant="white" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {/* Demo Credentials */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p className="font-medium">Demo Access:</p>
              <div className="mt-2 space-y-1 text-xs">
                <p><strong>Email:</strong> emjiada@yopmail.com</p>
                <p><strong>Password:</strong> Emjiada@yopmail.com123</p>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleRegister}
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
              >
                <span>Need an account? Register here</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {/* AdaAuth Link */}
            <div className="text-center">
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