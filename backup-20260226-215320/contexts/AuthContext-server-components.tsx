'use client';

import React, { createContext, useContext, useState, useTransition } from 'react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  restaurant_id: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null; // Passed from Server Components
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoggingOut, startTransition] = useTransition();

  console.log('🔗 AuthProvider initialized:', { 
    hasInitialUser: !!initialUser, 
    userEmail: initialUser?.email 
  });

  const logout = () => {
    startTransition(async () => {
      try {
        console.log('🚪 Starting logout process...');
        
        // Call API route to clear cookies
        const response = await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
          console.warn('⚠️ Logout API call failed, but continuing logout');
        }
        
        console.log('✅ Logout API call completed');
        
      } catch (error) {
        console.error('❌ Logout error:', error);
      } finally {
        // Always clear user state and redirect  
        setUser(null);
        
        console.log('↗️ Redirecting to AdaAuth for clean logout');
        
        // Redirect to AdaAuth with return URL
        const returnUrl = encodeURIComponent(
          window.location.origin + '/auth/callback?redirect=' + encodeURIComponent('/')
        );
        window.location.href = `https://adaauth.mindgen.app/?redirect=${returnUrl}`;
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoggingOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}