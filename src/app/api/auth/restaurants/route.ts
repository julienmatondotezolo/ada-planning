import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

/**
 * Proxy to AdaAuth GET /auth/profile → extract restaurant info
 * Uses /auth/profile (routed by nginx) since /users/* isn't proxied on VPS
 */
export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ada_access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 });
  }

  try {
    const res = await fetch(`${AUTH_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }

    const profile = await res.json();

    // Extract restaurant info from user_restaurant_access
    const restaurants = (profile.user_restaurant_access || []).map((access: any) => ({
      id: access.restaurants?.id || access.restaurant_id,
      slug: access.restaurants?.slug,
      name: access.restaurants?.name,
      phone: access.restaurants?.phone,
      email: access.restaurants?.email,
      address: access.restaurants?.address,
      website: access.restaurants?.website,
      role: access.role,
      active: access.active,
    }));

    return NextResponse.json({ restaurants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
