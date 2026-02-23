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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // TEMPORARY: Be less aggressive about redirects to prevent loops
    if (!loading) {
      if (!user) {
        // Only redirect after a delay to prevent immediate loops
        console.log('🔄 No user found, will redirect to auth in 2 seconds...');
        const redirectTimer = setTimeout(() => {
          const currentUrl = encodeURIComponent(window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(window.location.pathname));
          console.log('🔗 Redirecting to AdaAuth SSO...');
          window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
        }, 2000); // 2 second delay to prevent immediate redirect loops

        return () => clearTimeout(redirectTimer);
      }

      if (requiredRole && user.role !== requiredRole) {
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
          // Insufficient permissions, redirect to dashboard
          console.log('❌ Insufficient permissions, redirecting to unauthorized');
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [user, loading, requiredRole, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading Ada Planning...</p>
          <p className="mt-1 text-sm text-gray-500">Verifying authentication</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
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