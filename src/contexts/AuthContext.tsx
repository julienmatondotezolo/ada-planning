'use client';

import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

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
  token: string | null;
  restaurantId: string | null;
  logout: () => void;
  setToken: (token: string) => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )ada_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setTokenState] = useState<string | null>(getTokenFromCookie);
  const [isLoggingOut, startTransition] = useTransition();

  const restaurantId = user?.restaurant_id ?? null;

  // Sync restaurant_id to cookie so apiFetch can read it
  useEffect(() => {
    if (restaurantId) {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `ada_restaurant_id=${encodeURIComponent(restaurantId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
    }
  }, [restaurantId]);

  const setToken = (newToken: string) => {
    // Store in a client-readable cookie (7 days, same as httpOnly one)
    document.cookie = `ada_token=${encodeURIComponent(newToken)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    setTokenState(newToken);
  };

  const logout = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          console.warn('Logout API call failed, but continuing logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear client cookies
        document.cookie = 'ada_token=; path=/; max-age=0';
        document.cookie = 'ada_restaurant_id=; path=/; max-age=0';
        setUser(null);
        setTokenState(null);

        const returnUrl = encodeURIComponent(
          window.location.origin + '/auth/callback?redirect=' + encodeURIComponent('/')
        );
        window.location.href = `${AUTH_URL}/?redirect=${returnUrl}`;
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, restaurantId, logout, setToken, isLoggingOut }}>
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
