import { StaffMember, Shift, Schedule, ShiftTemplate } from '@/types/planning';

const API_BASE = process.env.NEXT_PUBLIC_ADA_API_URL || 'https://ada.mindgen.app/api/v1';

class AdaPlanningAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ada_token') : null;
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Staff Management
  async getStaff(params?: { active_only?: boolean; position?: string }): Promise<{ data: StaffMember[] }> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return this.request(`/staff${query}`);
  }

  async createStaffMember(staff: Partial<StaffMember>): Promise<StaffMember> {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  }

  async updateStaffMember(id: string, staff: Partial<StaffMember>): Promise<StaffMember> {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
  }

  // Schedule Management
  async getSchedules(params?: { period?: string; date?: string }): Promise<{ data: Schedule[] }> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return this.request(`/schedules${query}`);
  }

  async createSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  async publishSchedule(id: string, data: { notify_staff: boolean; notification_message?: string }): Promise<Schedule> {
    return this.request(`/schedules/${id}/publish`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Shift Operations
  async getShifts(params?: { date?: string; staff_id?: string; week?: string }): Promise<{ data: Shift[] }> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return this.request(`/shifts${query}`);
  }

  async createShift(shift: Partial<Shift>): Promise<Shift> {
    return this.request('/shifts', {
      method: 'POST',
      body: JSON.stringify(shift),
    });
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<Shift> {
    return this.request(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shift),
    });
  }

  async assignShiftToStaff(shiftId: string, staffId: string, notify = true): Promise<Shift> {
    return this.request(`/shifts/${shiftId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ staff_member_id: staffId, notify_staff: notify }),
    });
  }

  async deleteShift(id: string): Promise<void> {
    return this.request(`/shifts/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateShifts(shifts: Partial<Shift>[]): Promise<{ data: Shift[] }> {
    return this.request('/shifts/bulk', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    });
  }

  // Templates
  async getTemplates(params?: { day_of_week?: number; position?: string }): Promise<{ data: ShiftTemplate[] }> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return this.request(`/templates${query}`);
  }

  async createTemplate(template: Partial<ShiftTemplate>): Promise<ShiftTemplate> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  // Reports
  async getHoursReport(params: { period: string; date: string; staff_id?: string }): Promise<any> {
    const query = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return this.request(`/reports/hours${query}`);
  }

  async getCoverageReport(params: { date: string; position?: string }): Promise<any> {
    const query = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return this.request(`/reports/coverage${query}`);
  }
}

export const adaPlanningAPI = new AdaPlanningAPI();