// API utility functions with authentication support for AdaStaff API

// AdaStaff API URL - working staff management service
const ADASTAFF_API_URL = 'https://adastaff.mindgen.app';

// L'Osteria Restaurant ID - hardcoded for demo
const RESTAURANT_ID = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('API lib - AdaStaff URL:', ADASTAFF_API_URL);
  console.log('API lib - Restaurant ID:', RESTAURANT_ID);
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ada_access_token') || localStorage.getItem('access_token');
};

// Base API call function with authentication for AdaStaff API
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

  // Add auth header if required and token available
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      return {
        data: null as T,
        success: false,
        error: 'Authentication token required',
      };
    }
  }

  // Merge headers from options if they exist
  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  try {
    // Construct full URL - endpoint should start with /api/v1
    const fullUrl = endpoint.startsWith('/api/v1') 
      ? `${ADASTAFF_API_URL}${endpoint}`
      : `${ADASTAFF_API_URL}/api/v1/restaurants/${RESTAURANT_ID}${endpoint}`;

    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
    });

    // Handle different response types
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      return {
        data: null as T,
        success: false,
        error: result.message || result.error || result || `HTTP ${response.status}`,
      };
    }

    return {
      data: result,
      success: true,
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

// Employee interface matching AdaStaff API response
export interface Employee {
  id: string;
  restaurant_id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  position: string;
  email?: string;
  phone?: string;
  availability: Record<string, any>;
  hourly_rate: number;
  hire_date: string;
  active: boolean;
  notes?: string;
  emergency_contact: {
    name?: string;
    phone?: string;
  };
}

// Legacy Staff interface for backward compatibility
export interface Staff extends Employee {}

export const staffApi = {
  // Get all employees
  getAll: (params?: { active_only?: boolean; position?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.active_only) queryParams.set('active_only', 'true');
    if (params?.position) queryParams.set('position', params.position);
    
    const query = queryParams.toString();
    return apiCall<Employee[]>(`/employees${query ? `?${query}` : ''}`);
  },

  // Get employee by ID
  getById: (id: string) => 
    apiCall<Employee>(`/employees/${id}`),

  // Create employee
  create: (data: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    position: string;
    hourly_rate: number;
    availability?: Record<string, any>;
    notes?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) =>
    apiCall<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update employee
  update: (id: string, data: Partial<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    position: string;
    hourly_rate: number;
    active: boolean;
    availability?: Record<string, any>;
    notes?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }>) =>
    apiCall<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete employee (deactivate)
  delete: (id: string) =>
    apiCall(`/employees/${id}`, {
      method: 'DELETE',
    }),
};

// Shift interface matching AdaStaff API response
export interface Shift {
  id: string;
  restaurant_id: string;
  employee_id: string;
  employee_name: string;
  role: string;
  position: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  break_duration_minutes: number;
  status: 'draft' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Legacy compatibility
  staff_member_id?: string;
  scheduled_date?: string;
  break_duration?: number;
  is_overtime?: boolean;
  staff?: Employee;
}

export const shiftsApi = {
  // Get shifts with filters
  getAll: (params?: { 
    start_date?: string;
    end_date?: string;
    employee_id?: string; 
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.set('start_date', params.start_date);
    if (params?.end_date) queryParams.set('end_date', params.end_date);
    if (params?.employee_id) queryParams.set('employee_id', params.employee_id);
    if (params?.status) queryParams.set('status', params.status);
    
    const query = queryParams.toString();
    return apiCall<Shift[]>(`/planning/shifts${query ? `?${query}` : ''}`);
  },

  // Create shift
  create: (data: {
    employee_id: string;
    scheduled_date: string; // YYYY-MM-DD format
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
    position: string;
    break_duration_minutes?: number;
    notes?: string;
  }) =>
    apiCall<Shift>('/planning/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update shift
  update: (id: string, data: Partial<{
    employee_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    position: string;
    break_duration_minutes?: number;
    status: 'draft' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
  }>) =>
    apiCall<Shift>(`/planning/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete shift
  delete: (id: string) =>
    apiCall(`/planning/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Bulk create shifts
  createBulk: (shifts: Array<{
    employee_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    position: string;
    break_duration_minutes?: number;
    notes?: string;
  }>) =>
    apiCall<Shift[]>('/planning/shifts/bulk', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    }),
};

// Schedule Templates interface matching AdaStaff API
export interface ScheduleTemplate {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  template_data: Record<string, any>;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const templatesApi = {
  // Get schedule templates
  getAll: (params?: { active_only?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.active_only) queryParams.set('active_only', 'true');
    
    const query = queryParams.toString();
    return apiCall<ScheduleTemplate[]>(`/planning/templates${query ? `?${query}` : ''}`);
  },

  // Create template
  create: (data: {
    name: string;
    description?: string;
    template_data: Record<string, any>;
  }) =>
    apiCall<ScheduleTemplate>('/planning/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update template
  update: (id: string, data: Partial<{
    name: string;
    description?: string;
    template_data: Record<string, any>;
    active: boolean;
  }>) =>
    apiCall<ScheduleTemplate>(`/planning/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete template
  delete: (id: string) =>
    apiCall(`/planning/templates/${id}`, {
      method: 'DELETE',
    }),
};

// Legacy Schedule API (keeping for compatibility)
export interface Schedule {
  id: string;
  restaurant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  total_shifts: number;
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export const schedulesApi = {
  // Get schedules (placeholder - not implemented in AdaStaff API yet)
  getAll: (params?: { year?: number; month?: number }) => {
    console.warn('Schedules API not yet implemented in AdaStaff API');
    return Promise.resolve({ data: [], success: true });
  },

  // Create schedule (placeholder)
  create: (data: { name: string; year: number; month: number }) => {
    console.warn('Schedules API not yet implemented in AdaStaff API');
    return Promise.resolve({ data: null, success: false, error: 'Not implemented' });
  },
};

// Health check for AdaStaff API
export const healthApi = {
  check: () => 
    apiCall('/api/v1/health', { requireAuth: false }),
};

export default {
  staff: staffApi,
  employees: staffApi, // Alias for new name
  shifts: shiftsApi,
  templates: templatesApi,
  schedules: schedulesApi,
  health: healthApi,
};