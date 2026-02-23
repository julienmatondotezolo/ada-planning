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
  setUserManually: (userData: User) => void;
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
    }
  };

  // Clear tokens
  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ada_access_token');
      localStorage.removeItem('ada_refresh_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Check if user is authenticated using ONLY AdaAuth API
  const checkAuth = async () => {
    try {
      const token = getAccessToken();
      
      if (!token) {
        console.log('No token found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Validating token with AdaAuth API...');
      
      // Use ONLY AdaAuth API for validation
      const response = await fetch(`${ADAAUTH_API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ AdaAuth validation successful:', data.user);
        setUser(data.user);
      } else {
        console.error('❌ AdaAuth validation failed:', response.status);
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      clearTokens();
      setUser(null);
    }
    
    setLoading(false);
  };

  // Authenticate with existing token (for SSO flow) - ONLY AdaAuth API
  const authenticateWithToken = async (token: string) => {
    try {
      setLoading(true);
      console.log('Authenticating with token via AdaAuth API...');
      
      const response = await fetch(`${ADAAUTH_API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token authentication successful:', data.user);
        storeTokens(token, ''); // Store token, empty refresh for now
        setUser(data.user);
        return true;
      } else {
        console.error('❌ Token validation failed:', response.status);
        throw new Error('Token validation failed');
      }
    } catch (error) {
      console.error('❌ Token authentication failed:', error);
      clearTokens();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login function using ONLY AdaAuth API
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Logging in via AdaAuth API...');
      
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
      console.log('✅ Login successful:', data.user_profile);
      
      // Store tokens
      storeTokens(data.access_token, data.session?.refresh_token || '');
      
      // Set user from user_profile (AdaAuth format)
      setUser(data.user_profile);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function using ONLY AdaAuth API
  const logout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        console.log('Logging out via AdaAuth API...');
        await fetch(`${ADAAUTH_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
    } finally {
      clearTokens();
      setUser(null);
      console.log('✅ Logged out');
    }
  };

  // Refresh token function using ONLY AdaAuth API
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        return false;
      }

      console.log('Refreshing token via AdaAuth API...');
      
      const response = await fetch(`${ADAAUTH_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed');
        clearTokens();
        return false;
      }

      const data = await response.json();
      console.log('✅ Token refreshed successfully');
      storeTokens(data.access_token, data.refresh_token);
      
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      clearTokens();
      return false;
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Manual user state setter for callback page
  const setUserManually = (userData: User) => {
    console.log('✅ Setting user manually:', userData);
    setUser(userData);
    setLoading(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    authenticateWithToken,
    setUserManually,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};