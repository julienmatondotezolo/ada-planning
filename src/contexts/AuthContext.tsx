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
  isHydrated: boolean;
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
  const [loading, setLoading] = useState(true); // Start as true until we check auth
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // PREVENT any multiple checks
  const [isHydrated, setIsHydrated] = useState(false); // Track client-side hydration

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
  const authenticateWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      console.log('🔑 Authenticating with provided token...');
      setLoading(true); // Show loading during authentication
      
      // Store the token first
      storeTokens(token, '');
      
      // Parse JWT token directly
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Create user from token payload
      const userData: User = {
        id: payload.sub,
        email: payload.email || payload.user_metadata?.email,
        full_name: payload.user_metadata?.full_name || payload.full_name,
        role: payload.user_metadata?.restaurant_role || 'staff',
        restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
      };
      
      // Set user state immediately for smooth transition
      setUser(userData);
      setHasCheckedAuth(true);
      setLoading(false);
      
      console.log('✅ Token authentication successful:', userData);
      return true;
      
    } catch (error) {
      console.error('❌ Token authentication failed:', error);
      clearTokens();
      setUser(null);
      setLoading(false);
      return false;
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

  // Initial auth check on mount - handle hydration properly
  useEffect(() => {
    console.log('🏁 AuthProvider mounted - checking initial auth state');
    
    // Mark as hydrated (client-side only)
    setIsHydrated(true);
    
    const initializeAuth = async () => {
      try {
        // Check for existing token
        const token = getAccessToken();
        
        if (token && !hasCheckedAuth) {
          console.log('📋 Existing token found, validating...');
          
          // Parse token to check if it's still valid
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              
              // Check if token is expired
              const now = Math.floor(Date.now() / 1000);
              if (payload.exp && payload.exp > now) {
                // Token is valid, create user object
                const userData: User = {
                  id: payload.sub,
                  email: payload.email || payload.user_metadata?.email,
                  full_name: payload.user_metadata?.full_name || payload.full_name,
                  role: payload.user_metadata?.restaurant_role || 'staff',
                  restaurant_id: payload.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
                };
                
                setUser(userData);
                setHasCheckedAuth(true);
                console.log('✅ Restored user from valid token:', userData.email);
              } else {
                console.log('🔄 Token expired, clearing...');
                clearTokens();
              }
            }
          } catch (parseError) {
            console.warn('❌ Token parse failed, clearing:', parseError);
            clearTokens();
          }
        } else {
          console.log('📭 No existing token found');
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
      } finally {
        setLoading(false);
        console.log('🎯 Auth initialization complete');
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - runs only once

  const value: AuthContextType = {
    user,
    loading,
    isHydrated,
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