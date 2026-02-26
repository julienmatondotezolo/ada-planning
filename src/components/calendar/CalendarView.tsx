'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarCell } from './CalendarCell';

// French day names to match the paper calendar
const FRENCH_DAYS = [
  'Dimanche',
  'Lundi', 
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi'
];

// Mock staff data (based on the paper calendar)
const MOCK_STAFF = [
  { id: '1', name: 'José', color: '#ef4444' },
  { id: '2', name: 'Angélys', color: '#8b5cf6' },
  { id: '3', name: 'Mélia', color: '#10b981' },
  { id: '4', name: 'Lino', color: '#f59e0b' },
  { id: '5', name: 'Lucas', color: '#3b82f6' },
];

// Mock assignments based on the February 2026 paper calendar
const MOCK_ASSIGNMENTS: Record<string, { staffId: string; name: string; color: string; }[]> = {
  '2026-02-01': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-02': [
    { staffId: '1', name: 'José', color: '#ef4444' },
    { staffId: '4', name: 'Lino', color: '#f59e0b' },
  ],
  '2026-02-03': [{ staffId: '3', name: 'Mélia', color: '#10b981' }],
  '2026-02-04': [{ staffId: '2', name: 'Angélys', color: '#8b5cf6' }],
  '2026-02-05': [{ staffId: '4', name: 'Lino', color: '#f59e0b' }],
  '2026-02-06': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-08': [{ staffId: '3', name: 'Mélia', color: '#10b981' }],
  '2026-02-09': [{ staffId: '2', name: 'Angélys', color: '#8b5cf6' }],
  '2026-02-10': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-11': [{ staffId: '4', name: 'Lino', color: '#f59e0b' }],
  '2026-02-12': [
    { staffId: '3', name: 'Mélia', color: '#10b981' },
    { staffId: '2', name: 'Angélys', color: '#8b5cf6' },
  ],
  '2026-02-13': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-14': [
    { staffId: '1', name: 'José', color: '#ef4444' },
    { staffId: '3', name: 'Mélia', color: '#10b981' },
    { staffId: '5', name: 'Lucas', color: '#3b82f6' },
  ],
  '2026-02-15': [{ staffId: '2', name: 'Angélys', color: '#8b5cf6' }],
  '2026-02-16': [{ staffId: '4', name: 'Lino', color: '#f59e0b' }],
  '2026-02-17': [{ staffId: '3', name: 'Mélia', color: '#10b981' }],
  '2026-02-18': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-19': [
    { staffId: '2', name: 'Angélys', color: '#8b5cf6' },
    { staffId: '5', name: 'Lucas', color: '#3b82f6' },
  ],
  '2026-02-20': [
    { staffId: '1', name: 'José', color: '#ef4444' },
    { staffId: '3', name: 'Mélia', color: '#10b981' },
  ],
  '2026-02-22': [{ staffId: '4', name: 'Lino', color: '#f59e0b' }],
  '2026-02-23': [{ staffId: '2', name: 'Angélys', color: '#8b5cf6' }],
  '2026-02-25': [{ staffId: '1', name: 'José', color: '#ef4444' }],
  '2026-02-26': [{ staffId: '3', name: 'Mélia', color: '#10b981' }],
  '2026-02-27': [{ staffId: '5', name: 'Lucas', color: '#3b82f6' }],
  '2026-02-28': [{ staffId: '1', name: 'José', color: '#ef4444' }],
};

export function CalendarView() {
  // Start with February 2026 to match the paper calendar
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // February 2026

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getAssignmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return MOCK_ASSIGNMENTS[dateKey] || [];
  };

  // Create grid with proper week alignment
  const generateCalendarGrid = () => {
    const firstDayOfWeek = getDay(monthStart); // 0 = Sunday
    const previousMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      return date;
    });

    const nextMonthDays = [];
    const totalCells = [...previousMonthDays, ...days].length;
    const remainingCells = 42 - totalCells; // 6 weeks × 7 days = 42 cells
    
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(monthEnd);
      date.setDate(monthEnd.getDate() + i);
      nextMonthDays.push(date);
    }

    return [...previousMonthDays, ...days, ...nextMonthDays];
  };

  const calendarDays = generateCalendarGrid();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-blue-700 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy', { locale: fr }).toUpperCase()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-blue-700 rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {FRENCH_DAYS.map((day) => (
          <div
            key={day}
            className="p-4 text-center font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const assignments = getAssignmentsForDate(date);
          
          return (
            <CalendarCell
              key={index}
              date={date}
              assignments={assignments}
              isCurrentMonth={isCurrentMonth}
              isToday={isSameDay(date, new Date())}
              onAssignmentClick={(assignment) => {
                console.log('Assignment clicked:', assignment);
              }}
              onCellClick={() => {
                console.log('Cell clicked for date:', format(date, 'yyyy-MM-dd'));
              }}
            />
          );
        })}
      </div>

      {/* Staff Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Personnel:</span>
          {MOCK_STAFF.map((staff) => (
            <div key={staff.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: staff.color }}
              />
              <span className="text-sm text-gray-600">{staff.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}