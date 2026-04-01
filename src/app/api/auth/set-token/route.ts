import { NextRequest, NextResponse } from 'next/server';

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    const { token, refresh_token, remember_me } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Valid token required' }, { status: 400 });
    }

    const maxAge = remember_me ? THIRTY_DAYS : SEVEN_DAYS;
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ success: true });

    response.cookies.set('ada_access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    if (remember_me && refresh_token) {
      response.cookies.set('ada_refresh_token', refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: THIRTY_DAYS,
      });
    }

    return response;
  } catch (error) {
    console.error('Set token error:', error);
    return NextResponse.json({ error: 'Failed to store token' }, { status: 500 });
  }
}
