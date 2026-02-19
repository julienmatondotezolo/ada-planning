'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2 } from 'lucide-react';
import { usePlanningStore, usePlanningHelpers } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { Shift, StaffMember } from '@/types/planning';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShiftModal } from './ShiftModal';

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
  onDragStart: (shift: Shift) => void;
  draggedShiftId?: string;
}> = ({ entry, onEdit, onDragStart, draggedShiftId }) => {
  const { staff, shifts } = entry;
  
  return (
    <div className="mb-1 last:mb-0">
      {shifts.map((shift, index) => {
        const isBeingDragged = draggedShiftId === shift.id;
        
        return (
          <div 
            key={shift.id}
            draggable
            onDragStart={(e) => {
              onDragStart(shift);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', shift.id);
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.style.transform = 'rotate(2deg)';
              document.body.style.userSelect = 'none';
            }}
            onDragEnd={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
              document.body.style.userSelect = '';
            }}
            className={`
              group hover:bg-blue-50 p-1 rounded text-xs cursor-grab active:cursor-grabbing 
              border border-transparent hover:border-blue-200 transition-all select-none
              ${isBeingDragged ? 'animate-pulse bg-blue-100 border-blue-300' : ''}
            `}
            onClick={(e) => {
              // Prevent edit when dragging
              if (e.detail === 1) {
                setTimeout(() => onEdit(shift), 100);
              }
            }}
            title="Cliquer pour modifier, glisser pour déplacer"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 truncate">
                  {staff.first_name} {staff.last_name}
                </div>
                <div className="text-gray-600 text-xs">
                  {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                </div>
              </div>
              <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </div>
        );
      })}
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
  onDragStart: (shift: Shift) => void;
  onDrop: (date: Date) => void;
  isDragOver: boolean;
  onDragOver: (date: Date | null) => void;
  draggedShiftId?: string;
}> = ({ date, shifts, staff, isCurrentMonth, isToday, onAddShift, onEditShift, onDragStart, onDrop, isDragOver, onDragOver, draggedShiftId }) => {
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
    let staffMember = staff.find(s => s.id === staffId);
    
    // If staff member not found in loaded staff list, try to get it from shift data
    if (!staffMember && staffShifts.length > 0 && staffShifts[0].staff) {
      staffMember = {
        id: staffId,
        first_name: staffShifts[0].staff.first_name,
        last_name: staffShifts[0].staff.last_name,
        position: staffShifts[0].staff.position,
        email: '',
        hourly_rate: 15,
        hire_date: '',
        status: 'active' as const,
        default_hours_per_week: 30,
        availability: []
      };
    }
    
    if (staffMember) {
      staffShifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
      shiftEntries.push({
        staff: staffMember,
        shifts: staffShifts
      });
    }
  });
  
  // Sort entries by earliest shift time for consistent display order
  shiftEntries.sort((a, b) => {
    const aFirstTime = a.shifts[0]?.start_time || '';
    const bFirstTime = b.shifts[0]?.start_time || '';
    return aFirstTime.localeCompare(bFirstTime);
  });
  
  // Debug log for days with multiple employees
  if (shiftEntries.length > 1) {
    console.log(`📅 ${date.toISOString().split('T')[0]}: ${shiftEntries.length} employees working:`, 
      shiftEntries.map(e => `${e.staff.first_name} ${e.staff.last_name}`).join(', '));
  }

  return (
    <div 
      className={`
        border border-gray-200 p-2 relative group
        ${shiftEntries.length === 0 ? 'min-h-[120px]' : 'min-h-[140px]'}
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'ring-2 ring-blue-500/20 bg-blue-50/50' : ''}
        ${isDragOver ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}
        transition-all
      `}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(date);
      }}
      onDragLeave={() => {
        onDragOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(date);
        onDragOver(null);
      }}
    >
      {/* Date number */}
      <div className={`
        text-sm font-medium mb-2
        ${isToday ? 'text-blue-600 font-bold' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
      `}>
        {date.getDate()}
      </div>

      {/* Shift entries */}
      <div className="space-y-1">
        {shiftEntries.map((entry, index) => (
          <ShiftEntry
            key={`${entry.staff.id}-${index}`}
            entry={entry}
            onEdit={onEditShift}
            onDragStart={onDragStart}
            draggedShiftId={draggedShiftId}
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
        <Plus className="w-3 h-3 text-blue-600" />
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
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

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
      
      // Get all shifts (don't filter by date in API call)
      const shiftsResponse = await adaPlanningAPI.getShifts();
      
      // Filter shifts for the current month view (including adjacent days)  
      const monthShifts = shiftsResponse.data.filter(shift => {
        const shiftDate = new Date(shift.scheduled_date);
        const firstCalendarDay = calendarDays[0];
        const lastCalendarDay = calendarDays[calendarDays.length - 1];
        return shiftDate >= firstCalendarDay && shiftDate <= lastCalendarDay;
      });
      
      dispatch({ type: 'SET_SHIFTS', payload: monthShifts });
      console.log('✅ Shifts loaded from API:', monthShifts.length, 'shifts');
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des données' });
      console.error('Error loading month data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadStaff = async () => {
    try {
      const staffResponse = await adaPlanningAPI.getStaff({ active_only: true });
      dispatch({ type: 'SET_STAFF', payload: staffResponse.data });
      console.log('✅ Staff loaded from API:', staffResponse.data.length, 'members');
    } catch (error) {
      console.error('❌ Erreur lors du chargement du personnel:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement du personnel' });
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
    setSelectedDate(new Date(shift.scheduled_date));
    setIsShiftModalOpen(true);
  };

  const handleDragStart = (shift: Shift) => {
    setDraggedShift(shift);
  };

  const handleDragOver = (date: Date | null) => {
    setDragOverDate(date);
  };

  const handleDrop = async (targetDate: Date) => {
    if (!draggedShift) return;
    
    const targetDateString = targetDate.toISOString().split('T')[0];
    const originalDateString = draggedShift.scheduled_date;
    
    // Don't do anything if dropped on same date
    if (targetDateString === originalDateString) {
      setDraggedShift(null);
      return;
    }
    
    // Create the optimistic update immediately
    const optimisticShift = {
      ...draggedShift,
      scheduled_date: targetDateString
    };
    
    // Immediately update the UI state (optimistic update)
    dispatch({ type: 'UPDATE_SHIFT', payload: optimisticShift });
    setDraggedShift(null);
    
    console.log(`🔄 Moving ${draggedShift.staff?.first_name || 'Employee'} from ${originalDateString} to ${targetDateString}`);
    
    try {
      // Update the shift's date in the background
      const updatedShift = await adaPlanningAPI.updateShift(draggedShift.id, {
        scheduled_date: targetDateString
      });
      
      // Update with the real response from API (in case server changed anything)
      dispatch({ type: 'UPDATE_SHIFT', payload: updatedShift });
      
      console.log(`✅ Successfully moved ${draggedShift.staff?.first_name || 'Employee'} to ${targetDateString}`);
      
    } catch (error) {
      // Revert the optimistic update on error
      dispatch({ type: 'UPDATE_SHIFT', payload: draggedShift });
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du déplacement de l\'affectation' });
      console.error('❌ Error moving shift, reverting:', error);
    }
  };

  const handleSaveShift = async (shiftData: Partial<Shift>) => {
    if (isOperationInProgress) return;
    
    try {
      setIsOperationInProgress(true);
      
      if (selectedShift) {
        // Create optimistic update
        const optimisticShift = { ...selectedShift, ...shiftData };
        dispatch({ type: 'UPDATE_SHIFT', payload: optimisticShift });
        
        // Close modal immediately for better UX
        setIsShiftModalOpen(false);
        setSelectedShift(null);
        setSelectedDate(null);
        
        // Update existing shift in background
        const updatedShift = await adaPlanningAPI.updateShift(selectedShift.id, shiftData);
        dispatch({ type: 'UPDATE_SHIFT', payload: updatedShift });
        
        console.log('✅ Shift updated successfully');
      } else {
        // For new shifts, we need to wait for the API to generate the ID
        const newShift = await adaPlanningAPI.createShift(shiftData);
        dispatch({ type: 'ADD_SHIFT', payload: newShift });
        
        setIsShiftModalOpen(false);
        setSelectedShift(null);
        setSelectedDate(null);
        
        console.log('✅ New shift created successfully');
      }
      
    } catch (error) {
      // Revert optimistic update on error
      if (selectedShift) {
        dispatch({ type: 'UPDATE_SHIFT', payload: selectedShift });
        // Reopen modal so user can try again
        setIsShiftModalOpen(true);
      }
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: selectedShift ? 'Erreur lors de la mise à jour de l\'affectation' : 'Erreur lors de la création de l\'affectation' 
      });
      console.error('❌ Error saving shift:', error);
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!selectedShift) return;
    
    // Confirm deletion
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      return;
    }
    
    try {
      // Optimistically remove from UI
      dispatch({ type: 'DELETE_SHIFT', payload: shiftId });
      
      // Close modal immediately
      setIsShiftModalOpen(false);
      setSelectedShift(null);
      setSelectedDate(null);
      
      // Delete from API in background
      await adaPlanningAPI.deleteShift(shiftId);
      
      console.log('✅ Shift deleted successfully');
      
    } catch (error) {
      // Revert optimistic deletion on error
      dispatch({ type: 'ADD_SHIFT', payload: selectedShift });
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la suppression de l\'affectation' });
      console.error('❌ Error deleting shift, restored:', error);
    }
  };

  const handlePublishSchedule = async () => {
    try {
      if (!confirm('Êtes-vous sûr de vouloir publier le planning ? Les membres du personnel recevront une notification.')) {
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      // Create a schedule for the current month
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      const scheduleData = {
        restaurant_id: 'losteria-deerlijk',
        start_date: startDate,
        end_date: endDate,
        name: `Planning ${MONTHS_FR[currentMonth]} ${currentYear}`,
        status: 'draft' as const,
      };

      // Create the schedule first
      const newSchedule = await adaPlanningAPI.createSchedule(scheduleData);
      
      // Then publish it
      const publishedSchedule = await adaPlanningAPI.publishSchedule(newSchedule.id, {
        notify_staff: true,
        notification_message: `Planning pour ${MONTHS_FR[currentMonth]} ${currentYear} publié`
      });

      dispatch({ type: 'SET_SCHEDULES', payload: [publishedSchedule] });
      
      alert('Planning publié avec succès ! Le personnel a été notifié.');
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la publication du planning' });
      console.error('Error publishing schedule:', error);
      alert('Erreur lors de la publication du planning. Veuillez réessayer.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-6 border-b bg-white flex-shrink-0">
        <div className="flex items-center space-x-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            className="border-gray-300 text-black hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">
            {MONTHS_FR[currentMonth]} {currentYear}
          </h1>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            className="border-gray-300 text-black hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            L'Osteria Deerlijk
          </div>
          <Button 
            onClick={handlePublishSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Publication...' : 'Publier le planning'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex-shrink-0">
          {state.error}
          <button 
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            className="float-right text-red-500 hover:text-red-700 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Drag feedback */}
      {draggedShift && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-2xl z-50 pointer-events-none border border-blue-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">
              Déplacement de {draggedShift.staff?.first_name || 'Employé'} 
              ({draggedShift.start_time.slice(0, 5)} - {draggedShift.end_time.slice(0, 5)})
            </span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <div className="text-blue-200 text-xs text-center mt-1">
            Glissez vers une nouvelle date
          </div>
        </div>
      )}

      {/* Calendar - Scrollable */}
      <div className="flex-1 overflow-auto p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 mb-2 sticky top-0 z-10">
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
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              isDragOver={dragOverDate?.toDateString() === date.toDateString()}
              onDragOver={handleDragOver}
              draggedShiftId={draggedShift?.id}
            />
          ))}
        </div>
      </div>

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        shift={selectedShift}
        date={selectedDate}
        staff={state.staff}
        onClose={() => {
          setIsShiftModalOpen(false);
          setSelectedShift(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveShift}
        onDelete={selectedShift ? handleDeleteShift : undefined}
        saving={isOperationInProgress}
      />
    </div>
  );
};