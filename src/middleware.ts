import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

// In-memory validation cache (per server instance)
// Prevents hammering AdaAuth /auth/validate on every single request
const validationCache = new Map<string, { valid: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function buildAuthRedirect(request: NextRequest, pathname: string): NextResponse {
  const host = request.headers.get('host') || request.nextUrl.host;
  const protocol = request.nextUrl.protocol || 'http:';
  const origin = `${protocol}//${host}`;
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(pathname)}`;
  const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(callbackUrl)}`;
  
  const response = NextResponse.redirect(authUrl);
  response.cookies.delete('ada_access_token');
  return response;
}

async function validateToken(token: string): Promise<boolean> {
  // Check cache first
  const cached = validationCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.valid;
  }

  try {
    const response = await fetch(`${AUTH_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdaPlanning-Middleware/1.0',
      },
      body: JSON.stringify({ access_token: token }),
    });

    if (!response.ok) {
      // 429 = rate limited — don't cache as invalid, let through
      if (response.status === 429) {
        console.warn('⚠️ Middleware: Rate limited by AdaAuth — letting through');
        return true;
      }
      validationCache.set(token, { valid: false, expiresAt: Date.now() + CACHE_TTL_MS });
      return false;
    }

    const data = await response.json();
    const isValid = data.valid === true && !!data.user;
    validationCache.set(token, { valid: isValid, expiresAt: Date.now() + CACHE_TTL_MS });
    return isValid;
  } catch (error) {
    console.error('🚫 Middleware: Token validation error:', error);
    // Network error — let through rather than locking users out
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ada_access_token')?.value;

  // Auth routes — let through (callback needs to work without token)
  if (pathname.startsWith('/auth') || pathname === '/login') {
    if (token && pathname !== '/auth/callback') {
      const isValid = await validateToken(token);
      if (isValid) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      const response = NextResponse.next();
      response.cookies.delete('ada_access_token');
      return response;
    }
    return NextResponse.next();
  }

  // Protected routes — no token → redirect to login
  if (!token) {
    return buildAuthRedirect(request, pathname);
  }

  // Has token — validate it
  const isValid = await validateToken(token);
  if (!isValid) {
    console.log('🚫 Middleware: Invalid/expired token — redirecting to login');
    return buildAuthRedirect(request, pathname);
  }

  // Valid — proceed
  const response = NextResponse.next();
  response.headers.set('x-middleware-ran', 'true');
  return response;
}

export const config = {
  matcher: [
    // Only match page routes, NOT static assets/API/icons
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
