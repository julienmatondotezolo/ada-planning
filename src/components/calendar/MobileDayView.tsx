'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Lock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { fmtTime } from './types';
import type { ShiftAssignment, StaffMember } from './types';
import type { ClosingPeriod, ExclusiveOpeningDay } from '@/lib/api';

interface MobileDayViewProps {
  currentDate: Date;
  shifts: Record<string, ShiftAssignment[]>;
  staff: StaffMember[];
  isClosedDay: (date: Date) => boolean;
  getClosingPeriod: (date: Date) => ClosingPeriod | null;
  getExclusiveOpeningDay: (date: Date) => ExclusiveOpeningDay | null;
  onShiftClick: (shift: ShiftAssignment, date: Date) => void;
  onAddShift: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function MobileDayView({
  currentDate,
  shifts,
  staff,
  isClosedDay,
  getClosingPeriod,
  getExclusiveOpeningDay,
  onShiftClick,
  onAddShift,
  onNavigate,
}: MobileDayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayShifts = (shifts[dateKey] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const closed = isClosedDay(currentDate);
  const closingPeriod = getClosingPeriod(currentDate);
  const exclusiveOpening = getExclusiveOpeningDay(currentDate);

  const swipeHandlers = useSwipeNavigation(
    () => onNavigate('next'),
    () => onNavigate('prev'),
  );

  if (closed) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        {...swipeHandlers}
      >
        <Lock className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h3 className="text-lg font-semibold text-muted-foreground">Restaurant fermé</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {closingPeriod ? closingPeriod.name : format(currentDate, 'EEEE', { locale: fr })}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
      {...swipeHandlers}
    >
      {exclusiveOpening && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 mb-2">
          <CalendarCheck className="w-4 h-4 shrink-0" />
          <span className="font-medium">{exclusiveOpening.name}</span>
        </div>
      )}

      {dayShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">Aucun service planifié</p>
          <button
            onClick={() => onAddShift(currentDate)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium touch-feedback"
          >
            <Plus className="w-4 h-4" />
            Ajouter un service
          </button>
        </div>
      ) : (
        dayShifts.map((shift) => {
          const staffMember = staff.find((s) => s.id === shift.staffId);
          return (
            <button
              key={shift.id}
              onClick={() => onShiftClick(shift, currentDate)}
              className={cn(
                'flex items-center gap-3 w-full p-3 rounded-xl border bg-white touch-feedback',
                shift.status === 'declined' && 'opacity-50',
              )}
            >
              {/* Staff avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: shift.color }}
              >
                {shift.initials}
              </div>

              {/* Details */}
              <div className="flex-1 text-left min-w-0">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  shift.status === 'declined' && 'line-through',
                )}>
                  {shift.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
                </p>
              </div>

              {/* Position badge */}
              {shift.position && (
                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground shrink-0">
                  {shift.position}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
