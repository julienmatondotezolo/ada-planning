'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, AdaLogo } from 'ada-design-system';
import { AlertCircle, ArrowLeft, Home, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <AdaLogo size="lg" variant="primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription className="mt-2">
              You don't have permission to access this resource
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          {user && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="text-muted-foreground">Signed in as:</div>
              <div className="font-medium">{user.full_name || user.email}</div>
              <div className="text-xs text-muted-foreground capitalize">
                Role: {user.role} • Restaurant ID: {user.restaurant_id?.substring(0, 8)}...
              </div>
            </div>
          )}

          {/* Error Message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your current role doesn't have access to this page. Please contact your administrator if you believe this is an error.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleGoHome} 
              className="w-full"
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={handleGoBack} 
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleLogout} 
              className="w-full"
              variant="secondary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help? Contact support for assistance with access permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}