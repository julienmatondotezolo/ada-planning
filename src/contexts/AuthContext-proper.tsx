'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types
interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  restaurant_id?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isHydrated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  authenticateWithToken: (token: string) => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants
const ADAAUTH_API_URL = 'http://46.224.93.79:5004';
const TOKEN_KEY = 'ada_access_token';
const REFRESH_KEY = 'ada_refresh_token';

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility functions
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
};

const parseUserFromToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email || payload.user_metadata?.email,
      full_name: payload.user_metadata?.full_name || payload.full_name,
      role: payload.user_metadata?.restaurant_role || 'staff',
      restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
    };
  } catch {
    return null;
  }
};

// Storage utilities
const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn(`Failed to store ${key}`);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`Failed to remove ${key}`);
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      [TOKEN_KEY, REFRESH_KEY, 'access_token', 'refresh_token'].forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {
      console.warn('Failed to clear auth tokens');
    }
  }
};

// Main Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true, // Start loading until we check existing auth
    error: null,
    isHydrated: false
  });

  // Actions
  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user, loading: false, error: null }));
  };

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Authentication functions
  const authenticateWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      if (!isTokenValid(token)) {
        storage.clear();
        return false;
      }

      const user = parseUserFromToken(token);
      if (!user) {
        storage.clear();
        return false;
      }

      storage.set(TOKEN_KEY, token);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Token authentication failed:', error);
      storage.clear();
      setUser(null);
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await fetch(`${ADAAUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Login failed (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received');
      }

      const success = await authenticateWithToken(data.access_token);
      if (!success) {
        throw new Error('Failed to authenticate with received token');
      }

      if (data.refresh_token) {
        storage.set(REFRESH_KEY, data.refresh_token);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      storage.clear();
      throw error;
    }
  }, [authenticateWithToken, clearError]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = storage.get(TOKEN_KEY);
      
      // Attempt server logout (don't wait forever)
      if (token) {
        fetch(`${ADAAUTH_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore server logout errors
        });
      }
    } finally {
      // Always clean up local state
      storage.clear();
      setUser(null);
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Mark as hydrated
        setState(prev => ({ ...prev, isHydrated: true }));

        // Check for existing valid token
        const token = storage.get(TOKEN_KEY);
        
        if (token && isTokenValid(token)) {
          const user = parseUserFromToken(token);
          if (user) {
            setUser(user);
            return;
          }
        }

        // No valid token found
        storage.clear();
        setUser(null);
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        storage.clear();
        setUser(null);
      }
    };

    initializeAuth();
  }, []);

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    authenticateWithToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};