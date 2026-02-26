'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user data was passed from middleware via headers
    // Since we can't access headers directly in client components,
    // we need to get user data from localStorage or make an API call
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('ada_access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Validate token and get user data
        const response = await fetch('https://adaauth.mindgen.app/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          // Token invalid, remove it
          localStorage.removeItem('ada_access_token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    try {
      const token = localStorage.getItem('ada_access_token');
      if (token) {
        // Call logout endpoint
        await fetch('https://adaauth.mindgen.app/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('ada_access_token');
      setUser(null);
      
      // Redirect to AdaAuth for clean logout
      const returnUrl = encodeURIComponent(`${window.location.origin}/auth/callback?redirect=/`);
      window.location.href = `https://adaauth.mindgen.app/?redirect=${returnUrl}`;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
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