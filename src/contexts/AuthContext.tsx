'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  restaurant_id?: string;
  restaurant_access?: Array<{
    role: string;
    active: boolean;
    restaurants: {
      id: string;
      name: string;
      slug: string;
    };
    restaurant_id: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  authenticateWithToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AdaAuth API URL - centralized authentication
const ADAAUTH_API_URL = 'https://adaauth.mindgen.app';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get stored tokens
  const getAccessToken = () => typeof window !== 'undefined' ? localStorage.getItem('ada_access_token') : null;
  const getRefreshToken = () => typeof window !== 'undefined' ? localStorage.getItem('ada_refresh_token') : null;
  
  // Store tokens
  const storeTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ada_access_token', accessToken);
      localStorage.setItem('ada_refresh_token', refreshToken);
      // Also store in legacy keys for compatibility
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  };

  // Clear tokens
  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ada_access_token');
      localStorage.removeItem('ada_refresh_token');
      // Also clear legacy keys
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = getAccessToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${ADAAUTH_API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Try to refresh token if validation fails
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          clearTokens();
          setUser(null);
        } else {
          // Retry validation with new token
          await checkAuth();
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearTokens();
      setUser(null);
    }
    
    setLoading(false);
  };

  // Authenticate with existing token (for SSO flow)
  const authenticateWithToken = async (token: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${ADAAUTH_API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store the token (we don't have refresh token from URL redirect)
        storeTokens(token, ''); // Store empty refresh token for now
        setUser(data.user);
        return true;
      } else {
        throw new Error('Token validation failed');
      }
    } catch (error) {
      console.error('Token authentication failed:', error);
      clearTokens();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login function using AdaAuth
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${ADAAUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      storeTokens(data.access_token, data.session.refresh_token);
      
      // Set user from user_profile (AdaAuth format)
      setUser(data.user_profile);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await fetch(`${ADAAUTH_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${ADAAUTH_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      const data = await response.json();
      storeTokens(data.access_token, data.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      return false;
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    authenticateWithToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};