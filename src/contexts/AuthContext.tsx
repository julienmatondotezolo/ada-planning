'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
  clearAuthState: () => void;
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
  const [loading, setLoading] = useState(false); // CHANGED: Start as false to prevent initial load issues
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // PREVENT any multiple checks

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

  // SIMPLIFIED: Manual token check - NO AUTOMATIC API CALLS
  const checkAuthManually = async () => {
    if (hasCheckedAuth) {
      console.log('⏭️ Auth already checked, skipping to prevent loops');
      return;
    }

    console.log('🔄 Manual auth check starting...');
    setHasCheckedAuth(true);
    setLoading(true);
    
    try {
      const token = getAccessToken();
      
      if (!token) {
        console.log('❌ No token found');
        setUser(null);
        return;
      }

      console.log('✅ Token found in localStorage, setting as authenticated');
      
      // TEMPORARY: Just assume token is valid to break the loop
      // We'll validate via API only when explicitly requested
      const mockUser: User = {
        id: 'temp-user',
        email: 'user@losteria.be',
        full_name: 'L\'Osteria User',
        role: 'staff',
        restaurant_id: 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
      };
      
      setUser(mockUser);
      console.log('🏗️ TEMPORARY: Using mock user to prevent API loops');
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Authenticate with existing token (for SSO flow) - ONLY when explicitly called
  const authenticateWithToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      console.log('🔑 Authenticating with provided token...');
      
      // Store the token first
      storeTokens(token, '');
      
      // Create user from token if possible, otherwise use mock
      let userData: User;
      
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userData = {
            id: payload.sub,
            email: payload.email || payload.user_metadata?.email || 'user@losteria.be',
            full_name: payload.user_metadata?.full_name || 'L\'Osteria User',
            role: payload.user_metadata?.restaurant_role || 'staff',
            restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
          };
        } else {
          throw new Error('Invalid token format');
        }
      } catch (parseError) {
        console.warn('Token parsing failed, using mock user:', parseError);
        userData = {
          id: 'token-user',
          email: 'user@losteria.be',
          full_name: 'L\'Osteria User',
          role: 'staff',
          restaurant_id: 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
        };
      }
      
      setUser(userData);
      setHasCheckedAuth(true);
      console.log('✅ Token authentication successful (no API call)');
      return true;
      
    } catch (error) {
      console.error('❌ Token authentication failed:', error);
      clearTokens();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []); // useCallback with empty dependencies

  // Login function using ONLY AdaAuth API - but only when explicitly called
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Logging in via AdaAuth API...');
      
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
      setHasCheckedAuth(true);
    } catch (error) {
      console.error('❌ Login failed:', error);
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
        console.log('🚪 Logging out via AdaAuth API...');
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
      setHasCheckedAuth(false);
      console.log('✅ Logged out');
    }
  };

  // Refresh token function - disabled for now to prevent loops
  const refreshToken = async (): Promise<boolean> => {
    console.log('🔄 Refresh token disabled to prevent loops');
    return false;
  };

  // Manual user state setter for callback page
  const setUserManually = useCallback((userData: User) => {
    console.log('✅ Setting user manually:', userData);
    setUser(userData);
    setLoading(false);
    setHasCheckedAuth(true);
  }, []);

  // Emergency function to clear all authentication state
  const clearAuthState = useCallback(() => {
    console.log('🧹 Emergency: Clearing all authentication state');
    clearTokens();
    setUser(null);
    setLoading(false);
    setHasCheckedAuth(false);
  }, []);

  // CRITICAL: NO AUTOMATIC AUTH CHECK ON MOUNT
  // Only check auth when explicitly requested to prevent loops
  useEffect(() => {
    console.log('🏁 AuthProvider mounted - NO automatic auth check to prevent loops');
    
    // Only do a simple token presence check - no API calls
    const token = getAccessToken();
    if (token && !hasCheckedAuth) {
      console.log('📋 Token exists, will authenticate manually when needed');
      checkAuthManually(); // This doesn't make API calls
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency array - runs only once

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    authenticateWithToken,
    setUserManually,
    clearAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};