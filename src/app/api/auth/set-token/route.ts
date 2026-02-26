import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token || typeof token !== 'string') {
      console.log('❌ Invalid token in set-token request');
      return NextResponse.json({ error: 'Valid token required' }, { status: 400 });
    }
    
    console.log('🔐 Setting authentication cookie...');
    
    // Set secure httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('ada_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    console.log('✅ Authentication cookie set successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Token stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Set token error:', error);
    return NextResponse.json({ 
      error: 'Failed to store token' 
    }, { status: 500 });
  }
}