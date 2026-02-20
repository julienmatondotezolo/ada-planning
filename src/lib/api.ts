// API utility functions with authentication support

// Production API URL - hardcoded for reliability
const API_BASE_URL = 'https://ada.mindgen.app';

// Debug logging for API URL
if (typeof window !== 'undefined') {
  console.log('API lib - API_BASE_URL:', API_BASE_URL);
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

// Base API call function with authentication
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit & {
    requireAuth?: boolean;
  } = {}
): Promise<{ data: T; success: boolean; error?: string }> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge headers from options if they exist
  if (fetchOptions.headers) {
    if (Array.isArray(fetchOptions.headers)) {
      // Handle array format: [['key', 'value'], ...]
      fetchOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else if (typeof fetchOptions.headers === 'object') {
      // Handle object format: { key: value }
      Object.entries(fetchOptions.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
  }

  // Add auth header if required and token available
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null as T,
        success: false,
        error: result.error || result.message || `HTTP ${response.status}`,
      };
    }

    return {
      data: result.data || result,
      success: result.success !== false,
      error: undefined,
    };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Staff API functions
export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  hire_date?: string;
  default_hours_per_week?: number;
}

export const staffApi = {
  // Get all staff
  getAll: (params?: { active_only?: boolean; position?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.active_only) queryParams.set('active_only', 'true');
    if (params?.position) queryParams.set('position', params.position);
    
    const query = queryParams.toString();
    return apiCall<Staff[]>(`/staff${query ? `?${query}` : ''}`);
  },

  // Get staff by ID
  getById: (id: string) => 
    apiCall<Staff>(`/staff/${id}`),

  // Create staff
  create: (data: Omit<Staff, 'id'>) =>
    apiCall<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update staff
  update: (id: string, data: Partial<Staff>) =>
    apiCall<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete staff
  delete: (id: string) =>
    apiCall(`/staff/${id}`, {
      method: 'DELETE',
    }),
};

// Shift API functions
export interface Shift {
  id: string;
  staff_member_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  position: string;
  break_duration: number;
  status: 'scheduled' | 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  is_overtime: boolean;
  notes?: string;
  staff?: Staff;
}

export const shiftsApi = {
  // Get shifts with filters
  getAll: (params?: { 
    date?: string; 
    staff_id?: string; 
    week?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.set('date', params.date);
    if (params?.staff_id) queryParams.set('staff_id', params.staff_id);
    if (params?.week) queryParams.set('week', params.week);
    
    const query = queryParams.toString();
    return apiCall<Shift[]>(`/shifts${query ? `?${query}` : ''}`);
  },

  // Create shift
  create: (data: Omit<Shift, 'id' | 'staff'>) =>
    apiCall<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update shift
  update: (id: string, data: Partial<Shift>) =>
    apiCall<Shift>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete shift
  delete: (id: string) =>
    apiCall(`/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Bulk create shifts
  createBulk: (shifts: Array<Omit<Shift, 'id' | 'staff'>>) =>
    apiCall<Shift[]>('/shifts/bulk', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    }),

  // Assign shift to staff
  assign: (id: string, staff_member_id: string, notify_staff = false) =>
    apiCall<Shift>(`/shifts/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ staff_member_id, notify_staff }),
    }),
};

// Schedule API functions
export interface Schedule {
  id: string;
  restaurant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  total_shifts: number;
  total_hours: number;
  notification_sent: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export const schedulesApi = {
  // Get schedules
  getAll: (params?: { year?: number; month?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.set('year', params.year.toString());
    if (params?.month) queryParams.set('month', params.month.toString());
    
    const query = queryParams.toString();
    return apiCall<Schedule[]>(`/schedules${query ? `?${query}` : ''}`);
  },

  // Create schedule
  create: (data: { name: string; year: number; month: number }) =>
    apiCall<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Publish schedule
  publish: (id: string, options?: { 
    notify_staff?: boolean; 
    notification_message?: string; 
  }) =>
    apiCall<Schedule>(`/schedules/${id}/publish`, {
      method: 'PUT',
      body: JSON.stringify(options || {}),
    }),
};

// Health check
export const healthApi = {
  check: () => 
    apiCall('/health', { requireAuth: false }),
  
  testDb: () => 
    apiCall('/test-db', { requireAuth: false }),
};

export default {
  staff: staffApi,
  shifts: shiftsApi,
  schedules: schedulesApi,
  health: healthApi,
};