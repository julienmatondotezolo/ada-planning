'use client';

import { useEffect, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Spinner, AdaLogo } from 'ada-design-system';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/';
    
    if (token) {
      // Set cookie via API route for security
      fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      }).then(() => {
        // Force router refresh to get new user data
        router.refresh();
        router.push(redirect);
      }).catch(() => {
        router.push('/login?error=token_error');
      });
    } else {
      router.push('/login?error=no_token');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AdaLogo size="lg" variant="primary" className="mx-auto mb-4" />
        <Spinner size="lg" variant="primary" />
        <p className="mt-4 text-lg font-medium">Finalizing authentication...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}