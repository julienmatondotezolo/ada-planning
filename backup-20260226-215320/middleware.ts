import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/calendar',
  '/staff',
  '/schedules',
  '/settings'
];

// Routes that should redirect to main app if already authenticated
const AUTH_ROUTES = ['/login', '/auth/callback'];

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/unauthorized', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes (except protected ones), and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.includes('favicon') ||
    PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Get token from cookies or localStorage (via custom header)
  const token = request.cookies.get('ada_access_token')?.value || 
                request.headers.get('x-ada-token');

  console.log('🛡️ Middleware: Checking auth for', pathname, { hasToken: !!token });

  // Handle authentication routes
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    // If already authenticated, redirect to main app
    if (token) {
      console.log('✅ Middleware: Already authenticated, redirecting to main app');
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Allow access to auth routes if not authenticated
    return NextResponse.next();
  }

  // Handle protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route) || pathname === route)) {
    if (!token) {
      console.log('🔒 Middleware: No token, redirecting to auth');
      // Redirect to AdaAuth with return URL
      const returnUrl = encodeURIComponent(`${request.nextUrl.origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`);
      const authUrl = `https://adaauth.mindgen.app/?redirect=${returnUrl}`;
      return NextResponse.redirect(authUrl);
    }

    // Validate token with AdaAuth API
    try {
      const response = await fetch('https://adaauth.mindgen.app/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.log('❌ Middleware: Token validation failed');
        // Clear invalid token and redirect to auth
        const authUrl = `https://adaauth.mindgen.app/?redirect=${encodeURIComponent(`${request.nextUrl.origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`)}`;
        const redirectResponse = NextResponse.redirect(authUrl);
        redirectResponse.cookies.delete('ada_access_token');
        return redirectResponse;
      }

      const userData = await response.json();
      console.log('✅ Middleware: Token valid for user', userData.user?.email);

      // Add user data to headers for components to access
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-ada-user', JSON.stringify(userData.user));
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('❌ Middleware: Token validation error', error);
      // On validation error, redirect to auth
      const authUrl = `https://adaauth.mindgen.app/?redirect=${encodeURIComponent(`${request.nextUrl.origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`)}`;
      return NextResponse.redirect(authUrl);
    }
  }

  // Allow access to all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, images, etc.)
     */
    '/((?!api/public|_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};