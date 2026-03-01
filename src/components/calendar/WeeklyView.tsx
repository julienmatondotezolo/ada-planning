'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { format, startOfWeek, addDays, isToday as isDateToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, Badge } from 'ada-design-system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import {
  type TimeViewProps,
  type ShiftAssignment,
  fmtTime,
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT_PX,
  timeToMinutes,
  minutesToTop,
  minutesToHeight,
  snapTo15,
  pxToMinutes,
  minutesToTimeStr,
} from './types';

// ─── Time Block (shift rendered in the time grid) ────────────────────────────

function TimeBlock({
  shift,
  onClick,
  onDragStart,
}: {
  shift: ShiftAssignment;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const startMin = timeToMinutes(shift.startTime);
  const endMin = timeToMinutes(shift.endTime);
  const top = minutesToTop(startMin);
  const height = Math.max(minutesToHeight(startMin, endMin), 24);

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'absolute left-1 right-1 rounded-md text-white text-[11px] font-medium',
        'cursor-grab active:cursor-grabbing transition-shadow',
        'hover:brightness-110 hover:shadow-lg active:scale-[0.99]',
        'overflow-hidden px-2 py-1 z-10',
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: shift.color,
      }}
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}`}
    >
      <div className="flex items-center gap-1 leading-tight">
        <span className="font-bold truncate">{shift.name}</span>
      </div>
      {height >= 40 && (
        <div className="text-[10px] opacity-80 mt-0.5">
          {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
        </div>
      )}
      {height >= 56 && shift.position && (
        <div className="text-[9px] opacity-60 mt-0.5 truncate">{shift.position}</div>
      )}
    </button>
  );
}

// ─── Current Time Indicator ──────────────────────────────────────────────────

function NowLine() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < HOUR_START * 60 || minutes > HOUR_END * 60) return null;
  const top = minutesToTop(minutes);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1 shrink-0" />
      <div className="flex-1 border-t-2 border-destructive" />
    </div>
  );
}

// ─── Weekly View Component ───────────────────────────────────────────────────

export function WeeklyView({
  currentDate,
  shifts,
  staff,
  isClosedDay,
  getClosingPeriod,
  hasShiftOnDate,
  onCellClick,
  onShiftClick,
  onDragShift,
  onDropNewStaff,
}: TimeViewProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingStaffId, setDraggingStaffId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Week days (Mon–Sun)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart.getTime()]);

  // Hours for the time axis
  const hours = useMemo(() => {
    return Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  }, []);

  const totalHeight = hours.length * HOUR_HEIGHT_PX;

  // ── Drag handlers ──

  const handleShiftDragStart = useCallback((e: React.DragEvent, shift: ShiftAssignment, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDraggingStaffId(shift.staffId);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      shiftId: shift.id,
      sourceDate: dateKey,
      staffId: shift.staffId,
      startTime: shift.startTime,
      endTime: shift.endTime,
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    if (dragOverCol !== dateKey) setDragOverCol(dateKey);
  }, [dragOverCol]);

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingStaffId(null);

    const targetDateKey = format(targetDate, 'yyyy-MM-dd');

    if (isClosedDay(targetDate)) {
      const dayName = format(targetDate, 'EEEE', { locale: fr });
      toast({
        title: 'Restaurant fermé',
        description: `Impossible d'ajouter un service le ${dayName} — le restaurant est fermé ce jour.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      // New staff from legend
      if (data.isNew) {
        const staffMember = staff.find((s) => s.id === data.staffId);
        if (!staffMember) return;

        if (hasShiftOnDate(data.staffId, targetDateKey)) {
          toast({
            title: 'Déjà planifié',
            description: `${staffMember.name} a déjà un service ce jour.`,
            variant: 'destructive',
          });
          return;
        }

        onDropNewStaff(data.staffId, targetDate);
        return;
      }

      // Move existing shift
      const { shiftId, sourceDate, staffId: draggedStaffId } = data;
      if (sourceDate === targetDateKey) return;

      if (draggedStaffId && hasShiftOnDate(draggedStaffId, targetDateKey)) {
        const staffMember = staff.find((s) => s.id === draggedStaffId);
        toast({
          title: 'Déjà planifié',
          description: `${staffMember?.name || 'Cet employé'} a déjà un service ce jour.`,
          variant: 'destructive',
        });
        return;
      }

      onDragShift(shiftId, targetDateKey);
    } catch {
      // invalid data
    }
  }, [isClosedDay, hasShiftOnDate, staff, onDragShift, onDropNewStaff]);

  const handleDragEnd = useCallback(() => {
    setDraggingStaffId(null);
    setDragOverCol(null);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Day headers ── */}
      <div className="flex border-b bg-muted/40 shrink-0">
        {/* Time gutter spacer */}
        <div className="w-14 shrink-0 border-r border-border/50" />

        {weekDays.map((date) => {
          const isToday = isDateToday(date);
          const closed = isClosedDay(date);
          const closingPeriod = getClosingPeriod(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'flex-1 px-2 py-2 text-center border-r border-border/50 last:border-r-0 min-w-0',
                closed && 'opacity-50',
              )}
            >
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(date, 'EEE', { locale: fr })}
              </div>
              <div
                className={cn(
                  'text-lg font-bold leading-tight mt-0.5',
                  isToday && 'bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm',
                  !isToday && 'text-foreground',
                )}
              >
                {format(date, 'd')}
              </div>
              {closingPeriod && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1">
                  {closingPeriod.name}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Time grid ── */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="flex" style={{ minHeight: `${totalHeight}px` }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 border-r border-border/50 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start justify-end pr-2 -translate-y-1/2"
                style={{ top: `${(hour - HOUR_START) * HOUR_HEIGHT_PX}px` }}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayShifts = shifts[dateKey] || [];
            const closed = isClosedDay(date);
            const isToday = isDateToday(date);
            const isDragOver = dragOverCol === dateKey;
            const blocked = closed || (draggingStaffId ? hasShiftOnDate(draggingStaffId, dateKey) : false);

            return (
              <div
                key={dateKey}
                className={cn(
                  'flex-1 relative border-r border-border/50 last:border-r-0 min-w-0',
                  closed && 'bg-muted/30 cursor-not-allowed',
                  !closed && isToday && 'bg-primary/[0.02]',
                  !closed && 'cursor-pointer',
                  draggingStaffId && !blocked && 'ring-1 ring-inset ring-emerald-400/20',
                  draggingStaffId && !blocked && isDragOver && 'ring-emerald-500/40 bg-emerald-50/10',
                  draggingStaffId && blocked && 'opacity-40',
                )}
                onClick={() => !closed && onCellClick(date)}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={() => {}}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Hour gridlines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/30"
                    style={{ top: `${(hour - HOUR_START) * HOUR_HEIGHT_PX}px` }}
                  />
                ))}

                {/* Half-hour gridlines */}
                {hours.map((hour) => (
                  <div
                    key={`${hour}-half`}
                    className="absolute left-0 right-0 border-t border-border/15"
                    style={{ top: `${(hour - HOUR_START) * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2}px` }}
                  />
                ))}

                {/* Shift blocks */}
                {dayShifts.map((shift) => (
                  <TimeBlock
                    key={shift.id}
                    shift={shift}
                    onClick={() => onShiftClick(shift, date)}
                    onDragStart={(e) => handleShiftDragStart(e, shift, date)}
                  />
                ))}

                {/* Now line (only on today) */}
                {isToday && <NowLine />}

                {/* Closed overlay */}
                {closed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wide -rotate-45">
                      Fermé
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
