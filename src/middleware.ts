import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ada_access_token')?.value;

  // Auth routes — let through (callback needs to work without token)
  if (pathname.startsWith('/auth') || pathname === '/login') {
    // If already authenticated and not on callback, redirect to app
    if (token && pathname !== '/auth/callback') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to AdaAuth if no token
  if (!token) {
    const callbackUrl = `${request.nextUrl.origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`;
    const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(callbackUrl)}`;
    return NextResponse.redirect(authUrl);
  }

  // Has token — add header so we can verify middleware ran
  const response = NextResponse.next();
  response.headers.set('x-middleware-ran', 'true');
  return response;
}

export const config = {
  matcher: [
    '/',
    '/calendar/:path*',
    '/staff/:path*',
    '/schedules/:path*',
    '/settings/:path*',
    '/login',
    '/auth/:path*',
    '/unauthorized',
  ],
};
