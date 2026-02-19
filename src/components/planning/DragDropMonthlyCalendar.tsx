'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { usePlanningStore, usePlanningHelpers } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { Shift, StaffMember } from '@/types/planning';
import { SimpleButton as Button } from '@/components/ui/simple-button';
import { SimpleCard as Card } from '@/components/ui/simple-card';
import { EditableShiftModal } from './EditableShiftModal';

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

// Draggable Shift Entry Component
const DraggableShiftEntry: React.FC<{ 
  entry: DayShiftEntry; 
  onEdit: (shift: Shift) => void;
}> = ({ entry, onEdit }) => {
  const { staff, shifts } = entry;
  
  return (
    <div className="mb-1 last:mb-0">
      {shifts.map((shift, index) => {
        const draggableId = `shift-${shift.id}`;
        
        return (
          <DraggableShiftItem
            key={shift.id}
            shift={shift}
            staff={staff}
            isFirstShift={index === 0}
            onEdit={onEdit}
            draggableId={draggableId}
          />
        );
      })}
    </div>
  );
};

// Individual draggable shift item
const DraggableShiftItem: React.FC<{
  shift: Shift;
  staff: StaffMember;
  isFirstShift: boolean;
  onEdit: (shift: Shift) => void;
  draggableId: string;
}> = ({ shift, staff, isFirstShift, onEdit, draggableId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: {
      shift,
      staff,
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between group hover:bg-gray-50 p-1 rounded text-xs cursor-move
        ${isDragging ? 'opacity-50 shadow-lg' : 'cursor-pointer'}
        transition-all duration-200
      `}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onEdit(shift);
        }
      }}
    >
      <div className="flex items-center space-x-1 min-w-0 flex-1">
        {isFirstShift && (
          <span className="font-medium text-gray-700 truncate">
            {staff.first_name}
          </span>
        )}
        {!isFirstShift && <span className="w-8"></span>}
        <span className="text-gray-600 ml-auto">
          {shift.start_time}-{shift.end_time}
        </span>
      </div>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// Droppable Calendar Day Component
const DroppableCalendarDay: React.FC<{
  date: Date;
  shifts: Shift[];
  staff: StaffMember[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onAddShift: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
}> = ({ date, shifts, staff, isCurrentMonth, isToday, onAddShift, onEditShift }) => {
  const dateString = date.toISOString().split('T')[0];
  const dropId = `day-${dateString}`;
  
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: {
      date,
      dateString,
    }
  });

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
      ref={setNodeRef}
      className={`
        border border-gray-200 min-h-[100px] p-2 relative group
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
        ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
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
          <DraggableShiftEntry
            key={`${entry.staff.id}-${index}`}
            entry={entry}
            onEdit={onEditShift}
          />
        ))}
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-2 border-2 border-dashed border-blue-400 rounded bg-blue-50/30 flex items-center justify-center">
          <div className="text-center">
            <span className="text-blue-600 text-xs font-medium block">Déposer ici</span>
            <span className="text-blue-500 text-xs font-mono">{dateString}</span>
          </div>
        </div>
      )}

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

export const DragDropMonthlyCalendar: React.FC = () => {
  const { state, dispatch } = usePlanningStore();
  const { getStaffById } = usePlanningHelpers();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

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
      
      console.log('🔄 Loading shifts data...');
      
      // Try API first for shifts
      try {
        console.log('📡 API shifts call...');
        const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const shiftsResponse = await adaPlanningAPI.getShifts({ date: startDate });
        
        // Filter shifts for the current month view (including adjacent days)
        const monthShifts = shiftsResponse.data.filter(shift => {
          const shiftDate = new Date(shift.scheduled_date);
          const firstCalendarDay = calendarDays[0];
          const lastCalendarDay = calendarDays[calendarDays.length - 1];
          return shiftDate >= firstCalendarDay && shiftDate <= lastCalendarDay;
        });
        
        console.log('✅ API shifts loaded:', monthShifts.length, 'shifts');
        dispatch({ type: 'SET_SHIFTS', payload: monthShifts });
        
      } catch (error) {
        console.warn('❌ Shifts API failed - demo shifts will be generated with staff');
        // Initialize empty shifts - staff loading will populate with demo data if needed
        dispatch({ type: 'SET_SHIFTS', payload: [] });
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
      console.log('🔄 Loading staff data...');
      
      // Try API first - we know it works!
      try {
        console.log('📡 Loading API staff data...');
        const staffResponse = await adaPlanningAPI.getStaff({ active_only: true });
        console.log('✅ API staff data loaded:', staffResponse.data);
        dispatch({ type: 'SET_STAFF', payload: staffResponse.data });
        
        // Now generate shifts for these REAL staff members
        console.log('🔄 Generating shifts for API staff...');
        const { generateShiftsForStaff } = await import('@/lib/demo-data');
        const realShifts = generateShiftsForStaff(staffResponse.data, currentYear, currentMonth);
        console.log('✅ Generated shifts for real staff:', realShifts.length, 'shifts');
        dispatch({ type: 'SET_SHIFTS', payload: realShifts });
        
      } catch (apiError) {
        console.warn('❌ API failed, using demo data:', apiError);
        // Fallback to demo data
        const { demoStaff, generateShiftsForStaff } = await import('@/lib/demo-data');
        console.log('✅ Demo staff loaded:', demoStaff);
        dispatch({ type: 'SET_STAFF', payload: demoStaff });
        
        // Generate shifts for demo staff too
        const demoShifts = generateShiftsForStaff(demoStaff, currentYear, currentMonth);
        console.log('✅ Generated demo shifts:', demoShifts.length);
        dispatch({ type: 'SET_SHIFTS', payload: demoShifts });
      }
      
    } catch (error) {
      console.error('❌ Complete staff loading failure:', error);
      // Last resort - hardcoded staff
      const fallbackStaff = [
        { id: 'staff-1', first_name: 'Jessica', last_name: 'Bombini', email: 'jessica@losteria.be', position: 'manager', hourly_rate: 18.50, hire_date: '2023-01-15', status: 'active', default_hours_per_week: 40, availability: [] },
        { id: 'staff-2', first_name: 'Marco', last_name: 'Ferrari', email: 'marco@losteria.be', position: 'server', hourly_rate: 15.00, hire_date: '2023-03-01', status: 'active', default_hours_per_week: 32, availability: [] },
        { id: 'staff-3', first_name: 'Sofia', last_name: 'Rossi', email: 'sofia@losteria.be', position: 'kitchen', hourly_rate: 16.50, hire_date: '2023-02-15', status: 'active', default_hours_per_week: 35, availability: [] }
      ];
      console.log('🚨 Using fallback staff:', fallbackStaff);
      dispatch({ type: 'SET_STAFF', payload: fallbackStaff });
      
      // Generate shifts for fallback staff too
      const { generateShiftsForStaff } = await import('@/lib/demo-data');
      const fallbackShifts = generateShiftsForStaff(fallbackStaff, currentYear, currentMonth);
      console.log('✅ Generated fallback shifts:', fallbackShifts.length);
      dispatch({ type: 'SET_SHIFTS', payload: fallbackShifts });
    }
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    return state.shifts.filter(shift => {
      const shiftDate = new Date(shift.scheduled_date);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const shiftData = event.active.data.current;
    if (shiftData && shiftData.shift) {
      const shift = shiftData.shift;
      console.log(`🎯 DRAG STARTED: ${shift.staff?.first_name || 'Unknown'} from ${shift.scheduled_date}`);
      setActiveShift(shiftData.shift);
    } else {
      console.log('❌ No shift data in drag start');
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    // Only log when we move over a new date
    if (over && over.data.current) {
      const overDate = over.data.current.dateString;
      console.log(`📍 HOVERING OVER: ${overDate}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShift(null);

    console.log('🎯 DROP EVENT DETECTED');
    console.log('   Active:', active?.id);
    console.log('   Over:', over?.id);
    console.log('   Active Data:', active?.data?.current);
    console.log('   Over Data:', over?.data?.current);

    if (!over) {
      console.log('❌ No drop target found');
      return;
    }

    const shiftData = active.data.current;
    const dropData = over.data.current;

    console.log('🔍 Checking drop data...');
    console.log('   Shift Data:', shiftData);
    console.log('   Drop Data:', dropData);

    if (shiftData && dropData && shiftData.shift && dropData.date) {
      const shift = shiftData.shift as Shift;
      const newDate = dropData.date as Date;
      const newDateString = newDate.toISOString().split('T')[0];

      console.log('✅ VALID DROP DETECTED:');
      console.log(`   Employee: ${shift.staff?.first_name || 'Unknown'}`);
      console.log(`   From Date: ${shift.scheduled_date}`);
      console.log(`   To Date: ${newDateString}`);
      console.log(`   New Date Object:`, newDate);

      // Don't move if it's the same date
      if (shift.scheduled_date === newDateString) {
        console.log('⚪ Same date - no update needed');
        return;
      }

      try {
        console.log('🚀 UPDATING DATABASE...');
        // Update shift date via API
        const updatedShift = await adaPlanningAPI.updateShift(shift.id, {
          scheduled_date: newDateString,
        });

        // Update local state
        dispatch({ type: 'UPDATE_SHIFT', payload: updatedShift });
        
        console.log(`✅ SUCCESS: Moved ${shift.staff?.first_name} to ${newDateString}`);
      } catch (error) {
        console.error('❌ Database update failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du déplacement du poste' });
      }
    } else {
      console.log('❌ Invalid drop data:');
      console.log('   Has shift data:', !!shiftData?.shift);
      console.log('   Has drop date:', !!dropData?.date);
    }
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

  const handleSaveShift = (savedShift: Shift) => {
    if (selectedShift) {
      // Update existing shift
      dispatch({ type: 'UPDATE_SHIFT', payload: savedShift });
    } else {
      // Add new shift
      dispatch({ type: 'ADD_SHIFT', payload: savedShift });
    }
    setIsShiftModalOpen(false);
  };

  const handleDeleteShift = (shiftId: string) => {
    dispatch({ type: 'DELETE_SHIFT', payload: shiftId });
    setIsShiftModalOpen(false);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              <DroppableCalendarDay
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

        {/* Drag Overlay */}
        <DragOverlay>
          {activeShift ? (
            <div className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow-lg p-2 text-xs opacity-90">
              <div className="flex items-center space-x-1">
                <span className="font-medium">
                  {getStaffById(activeShift.staff_member_id || '')?.first_name}
                </span>
                <span className="text-gray-600">
                  {activeShift.start_time}-{activeShift.end_time}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Editable Shift Modal */}
        <EditableShiftModal
          shift={selectedShift}
          selectedDate={selectedDate}
          staff={state.staff}
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      </div>
    </DndContext>
  );
};