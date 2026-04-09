'use client';

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Lock, CalendarCheck, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, Badge } from 'ada-design-system';
import { cn } from '@/lib/utils';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useLongPress } from '@/hooks/useLongPress';
import { fmtTime, timeToMinutes } from './types';
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
  /** Long-press (≈450ms) on a shift card — opens quick actions sheet. */
  onShiftLongPress?: (shift: ShiftAssignment, date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

/** Per-shift row with tap vs long-press detection. */
function ShiftRow({
  shift,
  date,
  onTap,
  onLongPress,
}: {
  shift: ShiftAssignment;
  date: Date;
  onTap: () => void;
  onLongPress?: () => void;
}) {
  const longPress = useLongPress({
    onTap,
    onLongPress: onLongPress ?? (() => {}),
    disabled: !onLongPress,
  });

  return (
    <button
      type="button"
      {...longPress}
      className="flex items-center gap-3 w-full px-4 py-2.5 touch-feedback active:bg-muted/40 select-none"
    >
      <div className="relative shrink-0">
        <Avatar className="w-9 h-9 ring-2 ring-white">
          <AvatarFallback
            className="text-[11px] font-bold text-white"
            style={{ backgroundColor: shift.color }}
          >
            {shift.initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white',
            statusTone(shift.status),
          )}
        />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p
          className={cn(
            'text-sm font-semibold text-foreground truncate',
            shift.status === 'declined' && 'line-through opacity-50',
          )}
        >
          {shift.name}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
          {shift.position && (
            <>
              <span className="mx-1.5 text-border">·</span>
              <span className="font-medium">{shift.position}</span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}

/** Compute total scheduled hours for a list of shifts (declined excluded). */
function totalHours(list: ShiftAssignment[]): number {
  return list.reduce((sum, s) => {
    if (s.status === 'declined') return sum;
    const start = timeToMinutes(s.startTime);
    let end = timeToMinutes(s.endTime);
    if (end <= start) end += 24 * 60; // overnight
    return sum + (end - start) / 60;
  }, 0);
}

function statusTone(status?: string): string {
  if (status === 'declined') return 'bg-rose-400';
  if (status === 'pending' || status === 'sent') return 'bg-amber-400';
  return 'bg-emerald-500';
}

export function MobileWeekView({
  currentDate,
  shifts,
  isClosedDay,
  getClosingPeriod,
  getExclusiveOpeningDay,
  onDayClick,
  onShiftClick,
  onShiftLongPress,
  onNavigate,
}: MobileWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();

  const swipeHandlers = useSwipeNavigation(
    () => onNavigate('next'),
    () => onNavigate('prev'),
  );

  // Week-wide stats for the sticky header
  const weekShiftCount = days.reduce(
    (n, d) => n + (shifts[format(d, 'yyyy-MM-dd')]?.length || 0),
    0,
  );
  const weekHours = days.reduce(
    (n, d) => n + totalHours(shifts[format(d, 'yyyy-MM-dd')] || []),
    0,
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20" {...swipeHandlers}>
      {/* ─── Sticky week strip ─── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border/60">
        <div className="px-4 pt-3 pb-1.5 flex items-baseline justify-between">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Semaine
            </h2>
            <p className="text-base font-bold text-foreground capitalize leading-tight">
              {format(weekStart, 'd MMM', { locale: fr })} – {format(weekEnd, 'd MMM', { locale: fr })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {weekShiftCount} services
            </p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {weekHours.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Day pills */}
        <div className="grid grid-cols-7 gap-1 px-2 pb-2">
          {days.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayShifts = shifts[dateKey] || [];
            const isToday = isSameDay(date, today);
            const closed = isClosedDay(date);
            const dotCount = Math.min(dayShifts.length, 3);

            return (
              <button
                key={dateKey}
                onClick={() => {
                  // Scroll the matching card into view
                  const el = document.getElementById(`mw-day-${dateKey}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-feedback active:scale-95',
                  isToday && 'bg-primary text-primary-foreground shadow-sm',
                  !isToday && closed && 'opacity-40',
                )}
              >
                <span className={cn(
                  'text-[9px] uppercase font-bold tracking-wider',
                  !isToday && 'text-muted-foreground',
                )}>
                  {format(date, 'EEEEE', { locale: fr })}
                </span>
                <span className={cn(
                  'text-base font-bold tabular-nums leading-none mt-0.5',
                  !isToday && 'text-foreground',
                )}>
                  {format(date, 'd')}
                </span>
                <div className="flex items-center gap-[2px] h-1.5 mt-1">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isToday ? 'bg-white/90' : 'bg-primary/70',
                      )}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Day cards ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {days.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayShifts = (shifts[dateKey] || []).sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );
          const closed = isClosedDay(date);
          const closingPeriod = getClosingPeriod(date);
          const exclusiveOpening = getExclusiveOpeningDay(date);
          const isToday = isSameDay(date, today);
          const dayHours = totalHours(dayShifts);

          return (
            <section
              id={`mw-day-${dateKey}`}
              key={dateKey}
              className={cn(
                'rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                isToday && 'ring-2 ring-primary/40 border-primary/30',
                closed && 'opacity-70',
              )}
            >
              {/* Day header */}
              <button
                onClick={() => onDayClick(date)}
                className="flex items-center justify-between w-full px-4 py-3 touch-feedback active:bg-muted/40"
              >
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className={cn(
                    'text-2xl font-black tabular-nums leading-none',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}>
                    {format(date, 'd')}
                  </span>
                  <span className={cn(
                    'text-sm font-semibold capitalize truncate',
                    isToday ? 'text-primary' : 'text-foreground/80',
                  )}>
                    {format(date, 'EEEE', { locale: fr })}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {closed ? (
                    <Badge variant="outline" className="gap-1 text-rose-600 border-rose-200 bg-rose-50">
                      <Lock className="w-3 h-3" />
                      Fermé
                    </Badge>
                  ) : dayShifts.length > 0 ? (
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {dayHours.toFixed(1)}h
                    </span>
                  ) : null}
                </div>
              </button>

              {exclusiveOpening && !closed && (
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 border-y border-emerald-100 text-[11px] text-emerald-700 font-medium">
                  <CalendarCheck className="w-3 h-3" />
                  {exclusiveOpening.name}
                </div>
              )}

              {/* Shift list */}
              {!closed && dayShifts.length > 0 && (
                <ul className="divide-y divide-border/40 border-t border-border/40">
                  {dayShifts.map((shift) => (
                    <li key={shift.id}>
                      <ShiftRow
                        shift={shift}
                        date={date}
                        onTap={() => onShiftClick(shift, date)}
                        onLongPress={
                          onShiftLongPress ? () => onShiftLongPress(shift, date) : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}

              {/* Closed day */}
              {closed && (
                <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border/40">
                  {closingPeriod ? closingPeriod.name : 'Restaurant fermé'}
                </div>
              )}

              {/* Empty open day → tap day to add */}
              {!closed && dayShifts.length === 0 && (
                <button
                  onClick={() => onDayClick(date)}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-3 text-xs font-medium text-muted-foreground border-t border-dashed border-border/60 touch-feedback active:bg-muted/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aucun service — appuyer pour ajouter
                </button>
              )}
            </section>
          );
        })}

        {/* Bottom spacer to clear FAB + bottom nav */}
        <div className="h-20" />
      </div>
    </div>
  );
}
