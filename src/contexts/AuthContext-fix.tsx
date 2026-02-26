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
const ADAAUTH_API_URL = 'http://46.224.93.79:5004';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true until we check auth
  const [isHydrated, setIsHydrated] = useState(false); // Track client-side hydration

  // Get stored tokens
  const getAccessToken = () => typeof window !== 'undefined' ? localStorage.getItem('ada_access_token') : null;
  
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

  // FIXED: Add timeout to prevent infinite loading
  const setLoadingWithTimeout = (isLoading: boolean, timeoutMs: number = 10000) => {
    setLoading(isLoading);
    
    if (isLoading) {
      // Force loading to false after timeout to prevent white screen
      setTimeout(() => {
        console.log('⏰ Auth loading timeout - forcing loading = false');
        setLoading(false);
      }, timeoutMs);
    }
  };

  // Authenticate with existing token (for SSO flow)
  const authenticateWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      console.log('🔑 Authenticating with provided token...');
      setLoadingWithTimeout(true, 5000); // 5 second timeout
      
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
      
      setUser(userData);
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
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoadingWithTimeout(true, 10000); // 10 second timeout for login
      console.log('🔐 Logging in via AdaAuth API...');
      
      const response = await fetch(`${ADAAUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        storeTokens(data.access_token, data.refresh_token || '');
        await authenticateWithToken(data.access_token);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoadingWithTimeout(true, 3000); // 3 second timeout for logout
      
      const token = getAccessToken();
      if (token) {
        // Attempt logout API call but don't wait forever
        await Promise.race([
          fetch(`${ADAAUTH_API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Logout timeout')), 3000)
          )
        ]);
      }
    } catch (error) {
      console.warn('⚠️ Logout API call failed, continuing with local logout:', error);
    } finally {
      clearTokens();
      setUser(null);
      setLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      setLoadingWithTimeout(true, 5000); // 5 second timeout
      
      const refreshTokenValue = typeof window !== 'undefined' 
        ? localStorage.getItem('ada_refresh_token') 
        : null;
      
      if (!refreshTokenValue) {
        setLoading(false);
        return false;
      }

      const response = await Promise.race([
        fetch(`${ADAAUTH_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timeout')), 5000)
        )
      ]);

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      
      if (data.access_token) {
        storeTokens(data.access_token, data.refresh_token || refreshTokenValue);
        await authenticateWithToken(data.access_token);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      clearTokens();
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  // Manual user setting
  const setUserManually = (userData: User) => {
    setUser(userData);
    setLoading(false);
  };

  // Clear auth state
  const clearAuthState = () => {
    clearTokens();
    setUser(null);
    setLoading(false);
  };

  // FIXED: Improved initialization with timeout and error handling
  useEffect(() => {
    // Mark as hydrated (client-side only)
    setIsHydrated(true);
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        
        // Set a maximum initialization timeout
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            console.log('⏰ Auth initialization timeout - using fallback');
            setLoading(false);
            resolve('timeout');
          }, 8000); // 8 second maximum initialization time
        });
        
        // Check for existing token
        const token = getAccessToken();
        
        if (token) {
          console.log('📋 Existing token found, validating...');
          
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
                console.log('✅ Restored user from valid token:', userData.email);
                setLoading(false);
                return 'success';
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
        
        setLoading(false);
        return 'no-token';
        
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setLoading(false);
        return 'error';
      }
    };

    // Race between initialization and timeout
    Promise.race([initializeAuth(), timeoutPromise])
      .then((result) => {
        console.log(`🎯 Auth initialization complete: ${result}`);
      });
    
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