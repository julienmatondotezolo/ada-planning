'use client';

import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

import { usePlanningStore, usePlanningHelpers } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { Shift, StaffMember, DraggedShift } from '@/types/planning';
import { SimpleButton as Button } from '@/components/ui/simple-button';
import { SimpleCard as Card, SimpleCardContent as CardContent, SimpleCardHeader as CardHeader, SimpleCardTitle as CardTitle } from '@/components/ui/simple-card';
import { formatTime } from '@/lib/utils';

// Sortable Shift Component
const SortableShift: React.FC<{ shift: Shift; onEdit: (shift: Shift) => void }> = ({ shift, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shift.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { getStaffById } = usePlanningHelpers();
  const staff = shift.staff_member_id ? getStaffById(shift.staff_member_id) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow-sm p-3 mb-2 cursor-move hover:shadow-md transition-shadow"
      onClick={() => onEdit(shift)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {shift.start_time} - {shift.end_time}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {shift.calculated_hours}h
        </div>
      </div>
      
      {staff && (
        <div className="flex items-center space-x-2 mt-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {staff.first_name} {staff.last_name}
          </span>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        {shift.position}
      </div>
    </div>
  );
};

// Day Column Component
const DayColumn: React.FC<{ 
  date: Date; 
  dayName: string; 
  isToday: boolean; 
  shifts: Shift[]; 
  onAddShift: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
}> = ({ date, dayName, isToday, shifts, onAddShift, onEditShift }) => {
  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
        <div className={`font-semibold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
          {dayName}
        </div>
        <div className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
          {date.getDate()}/{date.getMonth() + 1}
        </div>
      </div>
      
      <div className="flex-1 p-2 min-h-[400px]">
        <SortableContext items={shifts.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {shifts.map((shift) => (
            <SortableShift
              key={shift.id}
              shift={shift}
              onEdit={onEditShift}
            />
          ))}
        </SortableContext>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddShift(date)}
          className="w-full mt-2 border-dashed border-2 border-gray-300 hover:border-blue-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un poste
        </Button>
      </div>
    </div>
  );
};

// Main Weekly Schedule Component
export const WeeklySchedule: React.FC = () => {
  const { state, dispatch } = usePlanningStore();
  const { getWeekData } = usePlanningHelpers();
  const [activeShift, setActiveShift] = useState<DraggedShift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekData = getWeekData();

  // Load initial data
  useEffect(() => {
    loadWeekData();
    loadStaff();
  }, [state.currentWeek]);

  const loadWeekData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const startDate = weekData[0]?.date.toISOString().split('T')[0];
      const endDate = weekData[6]?.date.toISOString().split('T')[0];
      
      const shiftsResponse = await adaPlanningAPI.getShifts({
        date: startDate,
        week: `${state.currentWeek.getFullYear()}-W${Math.ceil(state.currentWeek.getDate() / 7)}`
      });
      
      dispatch({ type: 'SET_SHIFTS', payload: shiftsResponse.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadStaff = async () => {
    try {
      const staffResponse = await adaPlanningAPI.getStaff({ active_only: true });
      dispatch({ type: 'SET_STAFF', payload: staffResponse.data });
    } catch (error) {
      console.error('Erreur lors du chargement du personnel', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const shift = state.shifts.find(s => s.id === event.active.id);
    if (shift) {
      setActiveShift({ ...shift, dragId: event.active.id as string });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle drag and drop logic here
      // This would involve updating the shift date/time based on drop target
    }
    
    setActiveShift(null);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(state.currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    dispatch({ type: 'SET_CURRENT_WEEK', payload: newWeek });
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

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            Semaine du {weekData[0]?.date.toLocaleDateString('fr-FR')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="primary">
            Publier le planning
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-7 h-full">
            {weekData.map((day) => (
              <div key={day.date.toISOString()} className="border-r border-gray-200 last:border-r-0">
                <DayColumn
                  date={day.date}
                  dayName={day.dayName}
                  isToday={day.isToday}
                  shifts={day.shifts}
                  onAddShift={handleAddShift}
                  onEditShift={handleEditShift}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeShift ? (
              <div className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {activeShift.start_time} - {activeShift.end_time}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeShift.calculated_hours}h
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Shift Modal would go here */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedShift ? 'Modifier le poste' : 'Nouveau poste'}
            </h3>
            {/* Shift form would go here */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary">
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};