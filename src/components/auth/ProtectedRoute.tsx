'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'supervisor' | 'staff';
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { user, loading, isHydrated } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Only act after hydration is complete to prevent SSR mismatch
    if (!isHydrated) return;
    
    // Only check for redirect if not loading
    if (!loading) {
      if (!user) {
        console.log('🔄 ProtectedRoute: No user found, scheduling redirect...');
        setShouldRedirect(true);
        
        // Small delay to allow any pending auth updates
        const redirectTimer = setTimeout(() => {
          const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(window.location.pathname));
          console.log('🔗 ProtectedRoute: Redirecting to AdaAuth SSO...');
          window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
        }, 500);

        return () => clearTimeout(redirectTimer);
      } else {
        setShouldRedirect(false);
        
        // Check role permissions after user is loaded
        if (requiredRole) {
          const roleHierarchy = {
            owner: 5,    // Restaurant owner - highest access
            admin: 4,
            manager: 3,
            supervisor: 2,
            staff: 1
          };

          const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
          const requiredLevel = roleHierarchy[requiredRole];

          if (userLevel < requiredLevel) {
            console.log('❌ ProtectedRoute: Insufficient permissions, redirecting to unauthorized');
            router.push('/unauthorized');
            return;
          }
        }
      }
    }
  }, [user, loading, isHydrated, requiredRole, router]);

  // Show consistent loading state until hydration is complete AND auth is resolved
  if (!isHydrated || loading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div>
            <p className="text-lg font-medium text-foreground">AdaPlanning</p>
            <p className="text-sm text-muted-foreground">
              {!isHydrated ? 'Loading...' : shouldRedirect ? 'Redirecting to login...' : 'Verifying authentication...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // At this point, we're hydrated, not loading, and have auth status
  if (!user) {
    // This shouldn't happen due to the redirect logic above, but just in case
    return null;
  }

  // Check role permissions one final time
  if (requiredRole) {
    const roleHierarchy = {
      admin: 4,
      manager: 3,
      supervisor: 2,
      staff: 1
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return null; // Will redirect to unauthorized
    }
  }

  return <>{children}</>;
};