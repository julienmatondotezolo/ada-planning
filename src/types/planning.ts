export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: 'manager' | 'server' | 'kitchen' | 'bar' | 'host';
  hourly_rate: number;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  default_hours_per_week: number;
  availability: Availability[];
}

export interface Availability {
  day_of_week: number; // 1-7 (Monday-Sunday)
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  availability_type: 'regular' | 'preferred' | 'unavailable';
}

export interface Shift {
  id: string;
  staff_member?: StaffMember;
  staff_member_id?: string;
  scheduled_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  break_duration: number; // minutes
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  calculated_hours: number;
  is_overtime: boolean;
  notes?: string;
}

export interface Schedule {
  id: string;
  restaurant_id: string;
  start_date: string;
  end_date: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  total_shifts: number;
  total_hours: number;
  published_at?: string;
  shifts?: Shift[];
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  position: string;
  min_staff: number;
  max_staff: number;
  is_active: boolean;
}

export interface DraggedShift extends Shift {
  dragId: string;
}

export type WeekDay = {
  date: Date;
  dayName: string;
  isToday: boolean;
  shifts: Shift[];
}