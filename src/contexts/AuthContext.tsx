'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  restaurant_id?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Production API URL - hardcoded for reliability
const API_BASE_URL = 'https://ada.mindgen.app';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get stored tokens
  const getAccessToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const getRefreshToken = () => typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  
  // Store tokens
  const storeTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  };

  // Clear tokens
  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Make authenticated API call
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        const newToken = getAccessToken();
        return fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newToken && { Authorization: `Bearer ${newToken}` }),
            ...options.headers,
          },
        });
      } else {
        // Refresh failed, redirect to login
        await logout();
        throw new Error('Session expired');
      }
    }

    return response;
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = getAccessToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      clearTokens();
      setUser(null);
    }
    
    // Always ensure loading is set to false
    setLoading(false);
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      storeTokens(data.session.access_token, data.session.refresh_token);
      
      // Set user
      setUser(data.user);
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
      // Call logout endpoint if user is logged in
      if (user) {
        await apiCall('/auth/signout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
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

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
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
      storeTokens(data.session.access_token, data.session.refresh_token);
      
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};