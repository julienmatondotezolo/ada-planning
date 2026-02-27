// Server-side authentication utilities for AdaPlanning
import { cookies } from 'next/headers';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  restaurant_id: string;
  active: boolean;
}

export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ada_access_token')?.value;
  
  if (!token) {
    console.log('🔍 No authentication token found in cookies');
    return null;
  }

  try {
    console.log('🔍 Validating token with AdaAuth API...');
    
    // Call improved AdaAuth API validate endpoint
    const response = await fetch(`${AUTH_URL}/auth/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'AdaPlanning-ServerComponents/1.0'
      },
      body: JSON.stringify({ access_token: token }),
      // No cache — always validate fresh (stale cache causes ghost sessions)
      cache: 'no-store'
    });

    if (!response.ok) {
      console.log('❌ Token validation failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.valid || !data.user) {
      console.log('❌ Invalid response from AdaAuth API:', data);
      return null;
    }

    console.log('✅ User authenticated:', {
      email: data.user.email,
      role: data.user.role,
      restaurant: data.user.restaurant_id
    });

    return {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
      full_name: data.user.full_name || data.user.first_name || data.user.email?.split('@')[0],
      role: data.user.role || 'staff',
      restaurant_id: data.user.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140',
      active: data.user.active !== false
    };
  } catch (error) {
    console.error('🚨 Server authentication error:', error);
    return null;
  }
}

export function getAuthRedirectUrl(currentPath: string = '/') {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://ada-planning.vercel.app' 
    : 'http://localhost:3005';
    
  const callbackUrl = `${baseUrl}/auth/callback?redirect=${encodeURIComponent(currentPath)}`;
  const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(callbackUrl)}`;
  
  return authUrl;
}