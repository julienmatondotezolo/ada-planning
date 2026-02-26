'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from 'ada-design-system';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'supervisor' | 'staff';
}

// Loading component
const AuthLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4">
      <Spinner size="lg" />
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Loading Application</h2>
        <p className="text-sm text-gray-600">Verifying authentication...</p>
      </div>
    </div>
  </div>
);

// Error component with retry
const AuthError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-red-500 text-5xl">⚠️</div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Authentication Error</h2>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
      </div>
      <div className="space-y-2">
        <button
          onClick={onRetry}
          className="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
        <p className="text-xs text-gray-500">
          If this persists, please contact support
        </p>
      </div>
    </div>
  </div>
);

// Login redirect component
const LoginRedirect: React.FC = () => {
  React.useEffect(() => {
    // Immediate redirect without timeout
    const currentUrl = encodeURIComponent(
      window.location.origin + '/auth/callback?redirect=' + 
      encodeURIComponent(window.location.pathname)
    );
    
    window.location.href = `https://adaauth.mindgen.app/?redirect=${currentUrl}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Redirecting to Login</h2>
          <p className="text-sm text-gray-600">Taking you to secure authentication...</p>
        </div>
      </div>
    </div>
  );
};

// Unauthorized access component
const UnauthorizedAccess: React.FC<{ userRole?: string; requiredRole: string }> = ({ 
  userRole, 
  requiredRole 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-orange-500 text-5xl">🚫</div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
        <p className="text-sm text-gray-600 mt-2">
          You need {requiredRole} access to view this page.
          {userRole && ` Your current role is: ${userRole}`}
        </p>
      </div>
      <button
        onClick={() => window.history.back()}
        className="btn-secondary px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  manager: 3,
  supervisor: 2,
  staff: 1
} as const;

// Permission checker utility
const hasRequiredPermission = (userRole: string, requiredRole: string): boolean => {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= requiredLevel;
};

// Main ProtectedRoute component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'staff' 
}) => {
  const { user, loading, error, isHydrated, clearError } = useAuth();

  // Show loading while hydrating or checking auth
  if (!isHydrated || loading) {
    return <AuthLoading />;
  }

  // Show error if authentication failed
  if (error) {
    return <AuthError error={error} onRetry={clearError} />;
  }

  // Redirect to login if no user
  if (!user) {
    return <LoginRedirect />;
  }

  // Check role permissions
  if (!hasRequiredPermission(user.role || '', requiredRole)) {
    return (
      <UnauthorizedAccess 
        userRole={user.role} 
        requiredRole={requiredRole} 
      />
    );
  }

  // All checks passed - render protected content
  return <>{children}</>;
};