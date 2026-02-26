import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Processing logout request...');
    
    const cookieStore = cookies();
    const token = cookieStore.get('ada_access_token')?.value;
    
    // Optional: Call AdaAuth logout endpoint to invalidate token
    if (token) {
      try {
        console.log('🔄 Invalidating token with AdaAuth...');
        const response = await fetch('https://adaauth.mindgen.app/auth/logout', {
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
    
    // Clear the authentication cookie
    cookieStore.delete('ada_access_token');
    
    console.log('✅ Authentication cookie cleared');
    
    return NextResponse.json({ 
      success: true,
      message: 'Logout successful',
      cleared_cookie: true
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Still try to clear cookie even on error
    const cookieStore = cookies();
    cookieStore.delete('ada_access_token');
    
    return NextResponse.json({ 
      error: 'Logout failed', 
      cleared_cookie: true 
    }, { status: 500 });
  }
}