import type { ShiftPreset, DaySchedule, ClosingPeriod } from '@/lib/api';

export interface StaffMember {
  id: string;
  name: string;
  color: string;
  position: string;
  initials: string;
}

export interface ShiftAssignment {
  id: string;
  staffId: string;
  name: string;
  color: string;
  position: string;
  initials: string;
  startTime: string;
  endTime: string;
}

export type CalendarViewMode = 'month' | 'week' | 'day';

/** Props shared across weekly/daily view components */
export interface TimeViewProps {
  currentDate: Date;
  shifts: Record<string, ShiftAssignment[]>;
  staff: StaffMember[];
  servicePresets: ShiftPreset[];
  openingHours: Record<string, DaySchedule>;
  closingPeriods: ClosingPeriod[];
  isClosedDay: (date: Date) => boolean;
  getClosingPeriod: (date: Date) => ClosingPeriod | null;
  hasShiftOnDate: (staffId: string, dateKey: string) => boolean;
  onCellClick: (date: Date) => void;
  onShiftClick: (shift: ShiftAssignment, date: Date) => void;
  onDragShift: (shiftId: string, targetDate: string, newStartTime?: string, newEndTime?: string) => void;
  onDropNewStaff: (staffId: string, date: Date, startTime?: string, endTime?: string) => void;
}

// Format time to hh:mm (strip seconds if present)
export function fmtTime(t: string): string {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0]}:${parts[1]}`;
}

// Map JS getDay() (0=Sun) to French day keys
export const JS_DAY_TO_FR_KEY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Time grid constants
export const HOUR_START = 6; // 06:00
export const HOUR_END = 24;  // 00:00 (midnight)
export const HOUR_HEIGHT_PX = 60; // pixels per hour row (vertical layout)
export const HOUR_WIDTH_PX = 80; // pixels per hour column (horizontal/rotated layout)

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTop(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT_PX;
}

export function minutesToHeight(startMin: number, endMin: number): number {
  return ((endMin - startMin) / 60) * HOUR_HEIGHT_PX;
}

// Horizontal layout helpers (for rotated weekly/daily views)
export function minutesToLeft(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * HOUR_WIDTH_PX;
}

export function minutesToWidth(startMin: number, endMin: number): number {
  return ((endMin - startMin) / 60) * HOUR_WIDTH_PX;
}

/** Snap minutes to nearest 15-min increment */
export function snapTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/** Convert pixel offset in the time grid back to minutes */
export function pxToMinutes(px: number): number {
  return HOUR_START * 60 + (px / HOUR_HEIGHT_PX) * 60;
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
