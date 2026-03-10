'use client';

import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Lock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { fmtTime } from './types';
import type { ShiftAssignment, StaffMember } from './types';
import type { ClosingPeriod, ExclusiveOpeningDay } from '@/lib/api';

interface MobileWeekViewProps {
  currentDate: Date;
  shifts: Record<string, ShiftAssignment[]>;
  staff: StaffMember[];
  isClosedDay: (date: Date) => boolean;
  getClosingPeriod: (date: Date) => ClosingPeriod | null;
  getExclusiveOpeningDay: (date: Date) => ExclusiveOpeningDay | null;
  onDayClick: (date: Date) => void;
  onShiftClick: (shift: ShiftAssignment, date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function MobileWeekView({
  currentDate,
  shifts,
  isClosedDay,
  getClosingPeriod,
  getExclusiveOpeningDay,
  onDayClick,
  onShiftClick,
  onNavigate,
}: MobileWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const swipeHandlers = useSwipeNavigation(
    () => onNavigate('next'),
    () => onNavigate('prev'),
  );

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
      {...swipeHandlers}
    >
      {days.map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayShifts = shifts[dateKey] || [];
        const closed = isClosedDay(date);
        const closingPeriod = getClosingPeriod(date);
        const exclusiveOpening = getExclusiveOpeningDay(date);
        const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

        return (
          <div
            key={dateKey}
            className={cn(
              'rounded-xl border bg-white overflow-hidden',
              isToday && 'ring-2 ring-primary/30',
              closed && 'opacity-60',
            )}
          >
            {/* Day header */}
            <button
              onClick={() => onDayClick(date)}
              className="flex items-center justify-between w-full px-3 py-2 bg-muted/30 border-b touch-feedback"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-bold capitalize',
                    isToday && 'text-primary',
                  )}
                >
                  {format(date, 'EEEE d', { locale: fr })}
                </span>
                {closed && (
                  <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                    <Lock className="w-3 h-3" />
                    Fermé
                  </span>
                )}
                {exclusiveOpening && (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                    <CalendarCheck className="w-3 h-3" />
                    {exclusiveOpening.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {dayShifts.length > 0 && `${dayShifts.length} service${dayShifts.length > 1 ? 's' : ''}`}
              </span>
            </button>

            {/* Shift list */}
            {!closed && dayShifts.length > 0 && (
              <div className="divide-y divide-border/30">
                {dayShifts
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => onShiftClick(shift, date)}
                      className="flex items-center gap-3 w-full px-3 py-2 touch-feedback"
                    >
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: shift.color }}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          shift.status === 'declined' && 'line-through opacity-50',
                        )}>
                          {shift.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
                          {shift.position && ` · ${shift.position}`}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Closed day - no content */}
            {closed && (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                {closingPeriod ? closingPeriod.name : 'Restaurant fermé'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
