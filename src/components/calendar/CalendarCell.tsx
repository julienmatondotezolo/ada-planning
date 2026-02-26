'use client';

import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignment {
  staffId: string;
  name: string;
  color: string;
  position?: string;
  shiftStart?: string;
  shiftEnd?: string;
}

interface CalendarCellProps {
  date: Date;
  assignments: Assignment[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onAssignmentClick: (assignment: Assignment) => void;
  onCellClick: () => void;
}

export function CalendarCell({
  date,
  assignments,
  isCurrentMonth,
  isToday,
  onAssignmentClick,
  onCellClick,
}: CalendarCellProps) {
  const dayNumber = format(date, 'd');

  return (
    <div
      className={cn(
        'calendar-cell group p-2 cursor-pointer transition-colors',
        'min-h-[120px] flex flex-col border-r border-b border-gray-100 last:border-r-0',
        {
          'bg-gray-50 text-gray-400': !isCurrentMonth,
          'bg-white hover:bg-gray-50': isCurrentMonth,
          'bg-blue-50 border-blue-200': isToday && isCurrentMonth,
        }
      )}
      onClick={onCellClick}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-sm font-semibold',
            {
              'text-gray-400': !isCurrentMonth,
              'text-gray-900': isCurrentMonth && !isToday,
              'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center text-xs': isToday && isCurrentMonth,
            }
          )}
        >
          {dayNumber}
        </span>
        
        {/* Add assignment button (show on hover) */}
        {isCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCellClick();
            }}
            className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-md hover:bg-gray-200 transition-all"
          >
            <Plus className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Staff assignments */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {assignments.map((assignment, index) => (
          <div
            key={`${assignment.staffId}-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onAssignmentClick(assignment);
            }}
            className={cn(
              'staff-badge px-2 py-1 rounded text-xs font-medium cursor-pointer',
              'hover:opacity-80 transition-opacity',
              'truncate w-full text-center'
            )}
            style={{
              backgroundColor: assignment.color,
              color: 'white',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
            title={`${assignment.name}${assignment.position ? ` - ${assignment.position}` : ''}${
              assignment.shiftStart && assignment.shiftEnd
                ? ` (${assignment.shiftStart}-${assignment.shiftEnd})`
                : ''
            }`}
          >
            {assignment.name}
          </div>
        ))}
        
        {/* Show overflow indicator if too many assignments */}
        {assignments.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{assignments.length - 3} autres
          </div>
        )}
      </div>

      {/* Empty state for current month cells */}
      {isCurrentMonth && assignments.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-300 text-xs hover:text-gray-500 transition-colors">
            Cliquez pour ajouter
          </div>
        </div>
      )}
    </div>
  );
}