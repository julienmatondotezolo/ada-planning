'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Only act after hydration is complete to prevent SSR mismatch
    if (!isHydrated) return;
    
    // Only redirect if not loading and no user found
    if (!loading && !user) {
      console.log('🔄 ProtectedRoute: No user found, will redirect to auth...');
      const redirectTimer = setTimeout(() => {
        const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(window.location.pathname));
        console.log('🔗 ProtectedRoute: Redirecting to AdaAuth SSO...', currentUrl);
        window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
      }, 500); // Faster redirect for better UX

      return () => clearTimeout(redirectTimer);
    }

    // Check role permissions after user is loaded
    if (!loading && user && requiredRole) {
      // Check role hierarchy: owner > admin > manager > supervisor > staff
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
  }, [user, loading, isHydrated, requiredRole]); // Added isHydrated to dependencies

  // Show loading until hydration is complete or while loading
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading Ada Planning...</p>
          <p className="mt-1 text-sm text-gray-500">
            {!isHydrated ? 'Initializing application...' : 'Verifying authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Only check user after hydration is complete
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Redirecting to login...</p>
          <p className="mt-1 text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

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