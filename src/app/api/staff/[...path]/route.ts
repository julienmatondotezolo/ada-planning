import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADASTAFF_API_URL = process.env.ADASTAFF_API_URL || 'https://adastaff.mindgen.app';
const RESTAURANT_ID = process.env.RESTAURANT_ID || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140';

/**
 * Proxy API route: forwards client requests to AdaStaff backend
 * with the httpOnly cookie token.
 *
 * Client calls:  /api/staff/settings
 * Proxy calls:   https://adastaff.mindgen.app/api/v1/restaurants/{id}/settings
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

  const subPath = path.join('/');
  const targetUrl = `${ADASTAFF_API_URL}/api/v1/restaurants/${RESTAURANT_ID}/${subPath}`;

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
