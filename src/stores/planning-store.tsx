'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { StaffMember, Shift, Schedule, WeekDay } from '@/types/planning';
import { getWeekDates } from '@/lib/utils';

interface PlanningState {
  staff: StaffMember[];
  shifts: Shift[];
  schedules: Schedule[];
  currentWeek: Date;
  selectedDate: Date | null;
  isLoading: boolean;
  error: string | null;
}

type PlanningAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STAFF'; payload: StaffMember[] }
  | { type: 'ADD_STAFF'; payload: StaffMember }
  | { type: 'UPDATE_STAFF'; payload: StaffMember }
  | { type: 'SET_SHIFTS'; payload: Shift[] }
  | { type: 'ADD_SHIFT'; payload: Shift }
  | { type: 'UPDATE_SHIFT'; payload: Shift }
  | { type: 'DELETE_SHIFT'; payload: string }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'SET_CURRENT_WEEK'; payload: Date }
  | { type: 'SET_SELECTED_DATE'; payload: Date | null };

const initialState: PlanningState = {
  staff: [],
  shifts: [],
  schedules: [],
  currentWeek: new Date(),
  selectedDate: null,
  isLoading: false,
  error: null,
};

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STAFF':
      return { ...state, staff: action.payload };
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };
    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'SET_SHIFTS':
      return { ...state, shifts: action.payload };
    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.payload] };
    case 'UPDATE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'DELETE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.filter(s => s.id !== action.payload)
      };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload };
    case 'SET_CURRENT_WEEK':
      return { ...state, currentWeek: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    default:
      return state;
  }
}

const PlanningContext = createContext<{
  state: PlanningState;
  dispatch: React.Dispatch<PlanningAction>;
} | null>(null);

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(planningReducer, initialState);

  return (
    <PlanningContext.Provider value={{ state, dispatch }}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanningStore = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanningStore must be used within a PlanningProvider');
  }
  return context;
};

// Helper hooks
export const usePlanningHelpers = () => {
  const { state, dispatch } = usePlanningStore();

  const getWeekData = (): WeekDay[] => {
    const weekDates = getWeekDates(state.currentWeek);
    const today = new Date();
    
    return weekDates.map(date => ({
      date,
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      isToday: date.toDateString() === today.toDateString(),
      shifts: state.shifts.filter(shift => {
        const shiftDate = new Date(shift.scheduled_date);
        return shiftDate.toDateString() === date.toDateString();
      })
    }));
  };

  const getStaffById = (id: string) => {
    return state.staff.find(s => s.id === id);
  };

  const getShiftsByDate = (date: Date) => {
    return state.shifts.filter(shift => {
      const shiftDate = new Date(shift.scheduled_date);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const getShiftsByStaff = (staffId: string) => {
    return state.shifts.filter(shift => shift.staff_member_id === staffId);
  };

  const getMonthData = () => {
    // This method can be used for monthly-specific data processing if needed
    // For now, we'll rely on the calendar component to generate the grid
    return [];
  };

  return {
    getWeekData,
    getMonthData,
    getStaffById,
    getShiftsByDate,
    getShiftsByStaff,
  };
};