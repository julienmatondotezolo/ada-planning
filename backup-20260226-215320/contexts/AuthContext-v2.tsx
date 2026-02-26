'use client';

import React, { createContext, useContext, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  restaurant_id: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoggingOut, startTransition] = useTransition();
  const router = useRouter();

  const logout = () => {
    startTransition(async () => {
      try {
        // Call server action to clear cookies
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setUser(null);
        // Redirect to AdaAuth for clean logout
        window.location.href = 'https://adaauth.mindgen.app/?redirect=' + 
          encodeURIComponent(window.location.origin + '/auth/callback?redirect=/');
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