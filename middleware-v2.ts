import { NextRequest, NextResponse } from 'next/server';

// Simplified middleware - just handles redirects, no API calls
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('favicon') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ada_access_token')?.value;
  
  // Protected routes
  const isProtectedRoute = ['/', '/calendar', '/staff', '/schedules', '/settings']
    .some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Auth routes
  const isAuthRoute = pathname.startsWith('/auth') || pathname === '/login';
  
  // If accessing protected route without token
  if (isProtectedRoute && !token) {
    const callbackUrl = `${request.nextUrl.origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`;
    const authUrl = `https://adaauth.mindgen.app/?redirect=${encodeURIComponent(callbackUrl)}`;
    return NextResponse.redirect(authUrl);
  }
  
  // If accessing auth route with token, redirect to app
  if (isAuthRoute && token && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};