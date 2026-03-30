import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADASTAFF_API_URL = process.env.ADASTAFF_API_URL || 'https://api-planning.adasystems.app';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

/**
 * Get restaurant_id from the user's token via AdaAuth validation.
 */
async function getRestaurantId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token, app_slug: 'ada-planning' }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.valid) return null;

    // Get first active restaurant from restaurant_access
    const access = (data.restaurant_access || []).find((ra: any) => ra.active !== false);
    return access?.restaurant_id || null;
  } catch {
    return null;
  }
}

/**
 * Proxy API route: forwards client requests to AdaStaff backend.
 * Extracts restaurant_id from user's auth token automatically.
 */
async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('ada_access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'No authentication token' },
      { status: 401 }
    );
  }

  const restaurantId = await getRestaurantId(token);
  if (!restaurantId) {
    return NextResponse.json(
      { error: 'NO_RESTAURANT', message: 'Could not determine restaurant from token' },
      { status: 403 }
    );
  }

  const subPath = path.join('/');
  const targetUrl = `${ADASTAFF_API_URL}/api/v1/restaurants/${restaurantId}/${subPath}`;

  // Forward query params
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchInit: RequestInit = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const body = await request.text();
      if (body) fetchInit.body = body;
    } catch {
      // no body
    }
  }

  try {
    const response = await fetch(fullUrl, fetchInit);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`Proxy error [${request.method} ${subPath}]:`, error.message);
    return NextResponse.json(
      { error: 'PROXY_ERROR', message: error.message },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
