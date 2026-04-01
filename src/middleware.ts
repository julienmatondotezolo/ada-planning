import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';
const SKIP_AUTH_VALIDATION = process.env.SKIP_AUTH_VALIDATION === 'true';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// In-memory validation cache (per server instance)
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
  response.cookies.delete('ada_refresh_token');
  return response;
}

async function validateToken(token: string): Promise<boolean | 'APP_ACCESS_DENIED'> {
  if (SKIP_AUTH_VALIDATION) {
    return true;
  }

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
      body: JSON.stringify({ access_token: token, app_slug: 'ada-planning' }),
    });

    if (!response.ok) {
      if (response.status === 429) return true;
      if (response.status === 403) {
        validationCache.set(token, { valid: false, expiresAt: Date.now() + CACHE_TTL_MS });
        return 'APP_ACCESS_DENIED';
      }
      validationCache.set(token, { valid: false, expiresAt: Date.now() + CACHE_TTL_MS });
      return false;
    }

    const data = await response.json();
    const isValid = data.valid === true && !!data.user;
    validationCache.set(token, { valid: isValid, expiresAt: Date.now() + CACHE_TTL_MS });
    return isValid;
  } catch (error) {
    console.error('Middleware: Token validation error:', error);
    return true;
  }
}

async function tryRefreshToken(refreshToken: string, request: NextRequest): Promise<NextResponse | null> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newToken = data.access_token || data.session?.access_token;
    const newRefresh = data.session?.refresh_token;

    if (!newToken) return null;

    // Validate the new token
    const isValid = await validateToken(newToken);
    if (isValid !== true) return null;

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.next();

    response.cookies.set('ada_access_token', newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    });

    if (newRefresh) {
      response.cookies.set('ada_refresh_token', newRefresh, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: THIRTY_DAYS,
      });
    }

    // Also update client-readable token cookie
    response.cookies.set('ada_token', newToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    });

    response.headers.set('x-middleware-ran', 'true');
    return response;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ada_access_token')?.value;
  const refreshToken = request.cookies.get('ada_refresh_token')?.value;

  // Auth routes and unauthorized page — let through
  if (pathname.startsWith('/auth') || pathname === '/login' || pathname === '/unauthorized') {
    if (token && pathname !== '/auth/callback' && pathname !== '/unauthorized') {
      const isValid = await validateToken(token);
      if (isValid === true) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isValid === 'APP_ACCESS_DENIED') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      const response = NextResponse.next();
      response.cookies.delete('ada_access_token');
      return response;
    }
    return NextResponse.next();
  }

  // Protected routes — no token
  if (!token) {
    // Try refresh before redirecting to login
    if (refreshToken) {
      const refreshed = await tryRefreshToken(refreshToken, request);
      if (refreshed) return refreshed;
    }
    return buildAuthRedirect(request, pathname);
  }

  // Has token — validate it
  const isValid = await validateToken(token);
  if (isValid === 'APP_ACCESS_DENIED') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (!isValid) {
    // Token invalid — try refresh before redirecting
    if (refreshToken) {
      const refreshed = await tryRefreshToken(refreshToken, request);
      if (refreshed) return refreshed;
    }
    return buildAuthRedirect(request, pathname);
  }

  // Valid — proceed
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
    '/analytics/:path*',
    '/notifications/:path*',
    '/login',
    '/auth/:path*',
    '/unauthorized',
  ],
};
