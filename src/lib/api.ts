/**
 * AdaPlanning API client
 *
 * All requests go through Next.js API proxy (/api/staff/...) which:
 * 1. Reads the httpOnly auth cookie
 * 2. Forwards to AdaStaff backend with Bearer token
 *
 * This avoids exposing tokens to client-side JavaScript.
 */

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.adasystems.app';

// ─── Core fetch helper ──────────────────────────────────────────────────────

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; success: boolean; error?: string }> {
  try {
    const url = `/api/staff/${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // send httpOnly cookie to Next.js proxy
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null as T,
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
      };
    }

    return { data: result as T, success: true };
  } catch (error) {
    console.error(`API error [${path}]:`, error);
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  restaurant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position: string;
  role?: string;
  color?: string;
  active: boolean;
  hourly_rate?: number;
  hire_date?: string;
  notes?: string;
  emergency_contact?: { name?: string; phone?: string };
  availability?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Shift {
  id: string;
  restaurant_id: string;
  employee_id: string;
  date: string;
  scheduled_date?: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  position?: string;
  role?: string;
  employee_name?: string;
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  notified_at?: string | null;
  employee?: Employee;
}

export interface DaySchedule {
  enabled: boolean;
  slots: { from: string; to: string }[];
}

export interface RestaurantSettings {
  id?: string;
  restaurant_id: string;
  opening_hours: Record<string, DaySchedule>;
  schedule_rules: {
    default_break_minutes: number;
    max_hours_per_week: number;
    min_staff_per_service: number;
    min_rest_days_per_week: number;
  };
  restaurant_info: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Restaurant {
  id: string;
  name?: string;
  slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  [key: string]: any;
}

// ─── Staff / Employees ──────────────────────────────────────────────────────

export const staffApi = {
  getAll: (params?: { active_only?: boolean }) => {
    const qs = params?.active_only === false ? '?active_only=false' : '';
    return apiFetch<Employee[]>(`employees${qs}`);
  },

  getById: (id: string) =>
    apiFetch<Employee>(`employees/${id}`),

  create: (data: Partial<Employee>) =>
    apiFetch<Employee>('employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Employee>) =>
    apiFetch<Employee>(`employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`employees/${id}`, { method: 'DELETE' }),
};

// ─── Shifts ─────────────────────────────────────────────────────────────────

export const shiftsApi = {
  getAll: (params?: { start_date?: string; end_date?: string; employee_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.start_date) qs.set('start_date', params.start_date);
    if (params?.end_date) qs.set('end_date', params.end_date);
    if (params?.employee_id) qs.set('employee_id', params.employee_id);
    const query = qs.toString();
    return apiFetch<Shift[]>(`planning/shifts${query ? `?${query}` : ''}`);
  },

  create: (data: Partial<Shift>) =>
    apiFetch<Shift>('planning/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Shift>) =>
    apiFetch<Shift>(`planning/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`planning/shifts/${id}`, { method: 'DELETE' }),
};

// ─── Settings ───────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    apiFetch<RestaurantSettings>('settings'),

  update: (data: Partial<{
    opening_hours: Record<string, DaySchedule>;
    schedule_rules: Record<string, any>;
    restaurant_info: Record<string, any>;
  }>) =>
    apiFetch<{ success: boolean; data: RestaurantSettings }>('settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Shift Presets ──────────────────────────────────────────────────────────

export interface ShiftTimeRange {
  start_time: string;
  end_time: string;
}

export interface ShiftPreset {
  id: string;
  restaurant_id: string;
  name: string;
  color: string;
  shifts: ShiftTimeRange[];
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export const shiftPresetsApi = {
  getAll: () =>
    apiFetch<ShiftPreset[]>('shift-presets'),

  create: (data: { name: string; color?: string; shifts: ShiftTimeRange[]; sort_order?: number }) =>
    apiFetch<ShiftPreset>('shift-presets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; color: string; shifts: ShiftTimeRange[]; sort_order: number }>) =>
    apiFetch<ShiftPreset>(`shift-presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`shift-presets/${id}`, { method: 'DELETE' }),

  reorder: (orderedIds: string[]) =>
    apiFetch<void>('shift-presets/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ordered_ids: orderedIds }),
    }),
};

// ─── Closing Periods ────────────────────────────────────────────────────────

export interface ClosingPeriod {
  id: string;
  restaurant_id: string;
  name: string;
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export const closingPeriodsApi = {
  getAll: () =>
    apiFetch<ClosingPeriod[]>('closing-periods'),

  getById: (id: string) =>
    apiFetch<ClosingPeriod>(`closing-periods/${id}`),

  create: (data: { name: string; date_from: string; date_to: string; comment?: string }) =>
    apiFetch<ClosingPeriod>('closing-periods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; date_from: string; date_to: string; comment?: string }>) =>
    apiFetch<ClosingPeriod>(`closing-periods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`closing-periods/${id}`, { method: 'DELETE' }),
};

// ─── Notifications ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  restaurant_id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export const notificationsApi = {
  getAll: (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.unread_only) qs.set('unread_only', 'true');
    const query = qs.toString();
    return apiFetch<Notification[]>(`notifications${query ? `?${query}` : ''}`);
  },

  getUnreadCount: () =>
    apiFetch<{ count: number }>('notifications/unread-count'),

  markRead: (id: string) =>
    apiFetch<void>(`notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: () =>
    apiFetch<void>('notifications/read-all', { method: 'PUT' }),
};

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface LaborCostData {
  period: string;
  total_cost: number;
  total_hours: number;
  breakdown: {
    employee_id: string;
    employee_name: string;
    hours: number;
    hourly_rate: number;
    cost: number;
  }[];
  daily_totals: {
    date: string;
    cost: number;
    hours: number;
  }[];
}

export const analyticsApi = {
  getLaborCost: (params: { period: string; start_date: string; end_date: string }) => {
    const qs = new URLSearchParams(params);
    return apiFetch<LaborCostData>(`analytics/labor-cost?${qs.toString()}`);
  },
};

// ─── Templates ──────────────────────────────────────────────────────────────

export const templatesApi = {
  getAll: () => apiFetch<any[]>('planning/templates'),

  create: (data: any) =>
    apiFetch<any>('planning/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`planning/templates/${id}`, { method: 'DELETE' }),
};

// ─── Schedules ──────────────────────────────────────────────────────────────

export const schedulesApi = {
  generate: (params: { start_date: string; end_date: string; template_id?: string }) =>
    apiFetch<any>('planning/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  publish: (params: { start_date: string; end_date: string }) =>
    apiFetch<any>('planning/publish', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ─── AdaAuth (direct — for restaurant info) ─────────────────────────────────

export const authApi = {
  getMyRestaurants: async (): Promise<{ data: Restaurant[]; success: boolean; error?: string }> => {
    try {
      // Go through our own proxy for auth too — need cookie
      const res = await fetch('/api/auth/restaurants', { credentials: 'include' });
      if (!res.ok) return { data: [], success: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      const restaurants = Array.isArray(data) ? data : (data.restaurants || data.data || []);
      return { data: restaurants, success: true };
    } catch (err: any) {
      return { data: [], success: false, error: err.message };
    }
  },
};

// ─── Health ─────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => fetch('/api/staff/health').then(r => r.json()).catch(() => null),
};

export default {
  staff: staffApi,
  employees: staffApi,
  shifts: shiftsApi,
  templates: templatesApi,
  schedules: schedulesApi,
  settings: settingsApi,
  auth: authApi,
  health: healthApi,
};
