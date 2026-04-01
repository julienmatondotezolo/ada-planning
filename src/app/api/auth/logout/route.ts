import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Processing logout request...');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('ada_access_token')?.value;
    
    // Optional: Call AdaAuth logout endpoint to invalidate token
    if (token) {
      try {
        console.log('🔄 Invalidating token with AdaAuth...');
        const response = await fetch(`${AUTH_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        if (response.ok) {
          console.log('✅ Token invalidated successfully');
        } else {
          console.warn('⚠️ Token invalidation failed, but continuing logout');
        }
      } catch (error) {
        console.warn('⚠️ AdaAuth logout call failed:', error);
      }
    }
    
    // Clear authentication cookies
    cookieStore.delete('ada_access_token');
    cookieStore.delete('ada_refresh_token');
    
    console.log('✅ Authentication cookie cleared');
    
    return NextResponse.json({ 
      success: true,
      message: 'Logout successful',
      cleared_cookie: true
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Still try to clear cookies even on error
    const cookieStore = await cookies();
    cookieStore.delete('ada_access_token');
    cookieStore.delete('ada_refresh_token');
    
    return NextResponse.json({ 
      error: 'Logout failed', 
      cleared_cookie: true 
    }, { status: 500 });
  }
}