'use client';

import { format, isSameDay, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Lock, CalendarCheck, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, Badge } from 'ada-design-system';
import { cn } from '@/lib/utils';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useLongPress } from '@/hooks/useLongPress';
import { fmtTime, timeToMinutes } from './types';
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
  /** Long-press on a shift card — opens quick-actions bottom sheet. */
  onShiftLongPress?: (shift: ShiftAssignment, date: Date) => void;
  onAddShift: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

function shiftHours(s: ShiftAssignment): number {
  const start = timeToMinutes(s.startTime);
  let end = timeToMinutes(s.endTime);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}

function statusTone(status?: string) {
  if (status === 'declined') return { dot: 'bg-rose-400', label: 'Refusé', tone: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (status === 'pending' || status === 'sent') return { dot: 'bg-amber-400', label: 'En attente', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (status === 'accepted' || status === 'confirmed') return { dot: 'bg-emerald-500', label: 'Confirmé', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  return { dot: 'bg-emerald-500', label: '', tone: '' };
}

/** Group consecutive overlapping shifts into "service blocks" for visual chunking. */
function groupByService(shifts: ShiftAssignment[]): ShiftAssignment[][] {
  if (shifts.length === 0) return [];
  const sorted = [...shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const groups: ShiftAssignment[][] = [];
  let current: ShiftAssignment[] = [sorted[0]];
  let blockEnd = timeToMinutes(sorted[0].endTime);

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    const start = timeToMinutes(s.startTime);
    if (start <= blockEnd + 30) {
      current.push(s);
      blockEnd = Math.max(blockEnd, timeToMinutes(s.endTime));
    } else {
      groups.push(current);
      current = [s];
      blockEnd = timeToMinutes(s.endTime);
    }
  }
  groups.push(current);
  return groups;
}

/** Shift card with tap vs long-press handling. */
function ShiftCard({
  shift,
  onTap,
  onLongPress,
}: {
  shift: ShiftAssignment;
  onTap: () => void;
  onLongPress?: () => void;
}) {
  const tone = statusTone(shift.status);
  const longPress = useLongPress({
    onTap,
    onLongPress: onLongPress ?? (() => {}),
    disabled: !onLongPress,
  });

  return (
    <button
      type="button"
      {...longPress}
      className={cn(
        'flex items-stretch gap-0 w-full rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] touch-feedback active:scale-[0.98] transition-transform select-none',
        shift.status === 'declined' && 'opacity-60',
      )}
    >
      {/* Color rail */}
      <div className="w-1.5 shrink-0" style={{ backgroundColor: shift.color }} />

      <div className="flex-1 flex items-center gap-3 p-3 min-w-0">
        <Avatar className="w-11 h-11 shrink-0 ring-2 ring-white shadow-sm">
          <AvatarFallback
            className="text-xs font-bold text-white"
            style={{ backgroundColor: shift.color }}
          >
            {shift.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'text-sm font-bold text-foreground truncate',
                shift.status === 'declined' && 'line-through',
              )}
            >
              {shift.name}
            </p>
            <span className={cn('w-2 h-2 rounded-full shrink-0', tone.dot)} />
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
            <span className="mx-1.5 text-border">·</span>
            <span className="font-semibold text-foreground/70">
              {shiftHours(shift).toFixed(1)}h
            </span>
          </p>
          {shift.position && (
            <Badge
              variant="outline"
              className="mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0 h-4 border-border/60 text-muted-foreground"
            >
              {shift.position}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export function MobileDayView({
  currentDate,
  shifts,
  staff,
  isClosedDay,
  getClosingPeriod,
  getExclusiveOpeningDay,
  onShiftClick,
  onShiftLongPress,
  onAddShift,
  onNavigate,
}: MobileDayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayShifts = (shifts[dateKey] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const closed = isClosedDay(currentDate);
  const closingPeriod = getClosingPeriod(currentDate);
  const exclusiveOpening = getExclusiveOpeningDay(currentDate);
  const isToday = isSameDay(currentDate, new Date());

  const swipeHandlers = useSwipeNavigation(
    () => onNavigate('next'),
    () => onNavigate('prev'),
  );

  const totalHours = dayShifts.reduce((n, s) => (s.status === 'declined' ? n : n + shiftHours(s)), 0);
  const uniqueStaff = new Set(dayShifts.filter((s) => s.status !== 'declined').map((s) => s.staffId)).size;
  const groups = groupByService(dayShifts);

  // Mini 3-day strip context
  const stripDays = [subDays(currentDate, 1), currentDate, addDays(currentDate, 1)];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20" {...swipeHandlers}>
      {/* ─── Hero header ─── */}
      <header className="bg-white border-b border-border/60 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onNavigate('prev')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-muted/60 text-foreground touch-feedback active:scale-90"
            aria-label="Jour précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isToday ? "Aujourd'hui" : format(currentDate, 'EEEE', { locale: fr })}
            </span>
            <h1 className={cn(
              'text-xl font-black capitalize leading-tight',
              isToday ? 'text-primary' : 'text-foreground',
            )}>
              {format(currentDate, 'd MMMM', { locale: fr })}
            </h1>
          </div>

          <button
            onClick={() => onNavigate('next')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-muted/60 text-foreground touch-feedback active:scale-90"
            aria-label="Jour suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 3-day mini strip */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {stripDays.map((d) => {
            const k = format(d, 'yyyy-MM-dd');
            const count = (shifts[k] || []).length;
            const isCurrent = isSameDay(d, currentDate);
            return (
              <div
                key={k}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs',
                  isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground',
                )}
              >
                <span className="capitalize">{format(d, 'EEE d', { locale: fr })}</span>
                {count > 0 && <span className="tabular-nums opacity-70">· {count}</span>}
              </div>
            );
          })}
        </div>

        {/* KPI row */}
        {!closed && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Équipe</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{uniqueStaff}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        )}

        {exclusiveOpening && !closed && (
          <div className="flex items-center gap-2 px-3 py-2 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span className="font-medium">{exclusiveOpening.name}</span>
          </div>
        )}
      </header>

      {/* ─── Body ─── */}
      {closed ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-foreground">Restaurant fermé</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {closingPeriod ? closingPeriod.name : format(currentDate, 'EEEE', { locale: fr })}
          </p>
        </div>
      ) : dayShifts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">Aucun service planifié</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Commencez à composer la journée
          </p>
          <button
            onClick={() => onAddShift(currentDate)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow-sm touch-feedback active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Ajouter un service
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-24">
          {groups.map((group, gi) => {
            const blockStart = group.reduce(
              (min, s) => Math.min(min, timeToMinutes(s.startTime)),
              Infinity,
            );
            const blockEnd = group.reduce((max, s) => {
              let end = timeToMinutes(s.endTime);
              if (end <= timeToMinutes(s.startTime)) end += 24 * 60;
              return Math.max(max, end);
            }, 0);
            const fmtMin = (m: number) => {
              const h = Math.floor((m % (24 * 60)) / 60);
              const mm = m % 60;
              return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
            };

            return (
              <div key={gi} className="mb-4">
                {/* Service block header */}
                <div className="flex items-center gap-2 px-2 mb-1.5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                    {fmtMin(blockStart)} – {fmtMin(blockEnd)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Shift cards */}
                <div className="space-y-2">
                  {group.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onTap={() => onShiftClick(shift, currentDate)}
                      onLongPress={
                        onShiftLongPress
                          ? () => onShiftLongPress(shift, currentDate)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
