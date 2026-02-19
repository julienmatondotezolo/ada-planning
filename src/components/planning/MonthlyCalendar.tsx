'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2 } from 'lucide-react';
import { usePlanningStore, usePlanningHelpers } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { Shift, StaffMember } from '@/types/planning';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MONTHS_FR = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
];

const DAYS_FR = [
  'DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'
];

interface DayShiftEntry {
  staff: StaffMember;
  shifts: Shift[];
}

const ShiftEntry: React.FC<{ 
  entry: DayShiftEntry; 
  onEdit: (shift: Shift) => void;
}> = ({ entry, onEdit }) => {
  const { staff, shifts } = entry;
  
  return (
    <div className="mb-1 last:mb-0">
      {shifts.map((shift, index) => (
        <div 
          key={shift.id}
          className="flex items-center justify-between group hover:bg-gray-50 p-1 rounded text-xs cursor-pointer"
          onClick={() => onEdit(shift)}
        >
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            {index === 0 && (
              <span className="font-medium text-gray-700 truncate">
                {staff.first_name}
              </span>
            )}
            {index > 0 && <span className="w-8"></span>}
            <span className="text-gray-600 ml-auto">
              {shift.start_time}-{shift.end_time}
            </span>
          </div>
          <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
};

const CalendarDay: React.FC<{
  date: Date;
  shifts: Shift[];
  staff: StaffMember[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onAddShift: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
}> = ({ date, shifts, staff, isCurrentMonth, isToday, onAddShift, onEditShift }) => {
  // Group shifts by staff member
  const shiftEntries: DayShiftEntry[] = [];
  const shiftsByStaff = new Map<string, Shift[]>();
  
  shifts.forEach(shift => {
    if (shift.staff_member_id) {
      if (!shiftsByStaff.has(shift.staff_member_id)) {
        shiftsByStaff.set(shift.staff_member_id, []);
      }
      shiftsByStaff.get(shift.staff_member_id)!.push(shift);
    }
  });
  
  shiftsByStaff.forEach((staffShifts, staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember) {
      staffShifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
      shiftEntries.push({
        staff: staffMember,
        shifts: staffShifts
      });
    }
  });

  return (
    <div 
      className={`
        border border-gray-200 min-h-[100px] p-2 relative group
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
        hover:bg-gray-50 transition-colors
      `}
    >
      {/* Date number */}
      <div className={`
        text-sm font-medium mb-2
        ${isToday ? 'text-primary font-bold' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
      `}>
        {date.getDate()}
      </div>

      {/* Shift entries */}
      <div className="space-y-0.5">
        {shiftEntries.map((entry, index) => (
          <ShiftEntry
            key={`${entry.staff.id}-${index}`}
            entry={entry}
            onEdit={onEditShift}
          />
        ))}
      </div>

      {/* Add shift button */}
      <button
        onClick={() => onAddShift(date)}
        className={`
          absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary/10 
          flex items-center justify-center opacity-0 group-hover:opacity-100 
          transition-opacity hover:bg-primary/20
          ${shiftEntries.length === 0 ? 'opacity-30' : ''}
        `}
      >
        <Plus className="w-3 h-3 text-primary" />
      </button>
    </div>
  );
};

export const MonthlyCalendar: React.FC = () => {
  const { state, dispatch } = usePlanningStore();
  const { getStaffById } = usePlanningHelpers();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = new Date();
  
  // Generate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: Date[] = [];
  
  // Add previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth, -i);
    calendarDays.push(date);
  }
  
  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    calendarDays.push(date);
  }
  
  // Add next month days to complete the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(currentYear, currentMonth + 1, day);
    calendarDays.push(date);
  }

  // Load data
  useEffect(() => {
    loadMonthData();
    loadStaff();
  }, [currentDate]);

  const loadMonthData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try API first, fallback to demo data
      try {
        const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const shiftsResponse = await adaPlanningAPI.getShifts({ date: startDate });
        
        // Filter shifts for the current month view (including adjacent days)
        const monthShifts = shiftsResponse.data.filter(shift => {
          const shiftDate = new Date(shift.scheduled_date);
          const firstCalendarDay = calendarDays[0];
          const lastCalendarDay = calendarDays[calendarDays.length - 1];
          return shiftDate >= firstCalendarDay && shiftDate <= lastCalendarDay;
        });
        
        dispatch({ type: 'SET_SHIFTS', payload: monthShifts });
      } catch (apiError) {
        // Fallback to demo data for development
        const { generateDemoShifts } = await import('@/lib/demo-data');
        const demoShifts = generateDemoShifts(currentYear, currentMonth);
        dispatch({ type: 'SET_SHIFTS', payload: demoShifts });
        console.warn('Using demo data - API unavailable');
      }
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des données' });
      console.error('Error loading month data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadStaff = async () => {
    try {
      // Try API first, fallback to demo data
      try {
        const staffResponse = await adaPlanningAPI.getStaff({ active_only: true });
        dispatch({ type: 'SET_STAFF', payload: staffResponse.data });
      } catch (apiError) {
        // Fallback to demo data
        const { demoStaff } = await import('@/lib/demo-data');
        dispatch({ type: 'SET_STAFF', payload: demoStaff });
        console.warn('Using demo staff data - API unavailable');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du personnel', error);
    }
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    return state.shifts.filter(shift => {
      const shiftDate = new Date(shift.scheduled_date);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setIsShiftModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedDate(null);
    setIsShiftModalOpen(true);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center space-x-6">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">
            {MONTHS_FR[currentMonth]} {currentYear}
          </h1>
          
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            L'Osteria Deerlijk
          </div>
          <Button variant="primary">
            Publier le planning
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {DAYS_FR.map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-sm text-gray-700 bg-gray-100 border border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {calendarDays.map((date, index) => (
            <CalendarDay
              key={`${date.toISOString()}-${index}`}
              date={date}
              shifts={getShiftsForDate(date)}
              staff={state.staff}
              isCurrentMonth={isCurrentMonth(date)}
              isToday={isToday(date)}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
            />
          ))}
        </div>
      </div>

      {/* Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedShift ? 'Modifier le poste' : 'Nouveau poste'}
                {selectedDate && (
                  <div className="text-sm text-gray-600 font-normal mt-1">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personnel
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Sélectionner un membre</option>
                    {state.staff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name} - {staff.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Début
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue={selectedShift?.start_time || '09:00'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue={selectedShift?.end_time || '17:00'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="server">Serveur</option>
                    <option value="kitchen">Cuisine</option>
                    <option value="bar">Bar</option>
                    <option value="host">Accueil</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                  Annuler
                </Button>
                {selectedShift && (
                  <Button variant="destructive" size="sm">
                    Supprimer
                  </Button>
                )}
                <Button variant="primary">
                  {selectedShift ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};