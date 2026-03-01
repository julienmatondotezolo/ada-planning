'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { format, startOfWeek, addDays, isToday as isDateToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Lock } from 'lucide-react';
import { Badge } from 'ada-design-system';
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
} from './types';

// ─── Overlap layout: compute column index + total columns per shift group ────

interface LayoutedShift extends ShiftAssignment {
  colIndex: number;
  colTotal: number;
}

function layoutOverlappingShifts(shifts: ShiftAssignment[]): LayoutedShift[] {
  if (shifts.length === 0) return [];

  // Sort by start time, then by end time (longer first)
  const sorted = [...shifts].sort((a, b) => {
    const d = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    return d !== 0 ? d : timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  // Assign columns using a greedy algorithm
  const columns: { endMin: number; shift: ShiftAssignment }[][] = [];

  for (const shift of sorted) {
    const startMin = timeToMinutes(shift.startTime);
    let placed = false;

    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (lastInCol.endMin <= startMin) {
        columns[col].push({ endMin: timeToMinutes(shift.endTime), shift });
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([{ endMin: timeToMinutes(shift.endTime), shift }]);
    }
  }

  // Build result with column info
  const result: LayoutedShift[] = [];
  const totalCols = columns.length;

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const entry of columns[colIdx]) {
      result.push({
        ...entry.shift,
        colIndex: colIdx,
        colTotal: totalCols,
      });
    }
  }

  return result;
}

// ─── Time Block (shift rendered in the time grid) ────────────────────────────

function TimeBlock({
  shift,
  onClick,
  onDragStart,
}: {
  shift: LayoutedShift;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const startMin = timeToMinutes(shift.startTime);
  const endMin = timeToMinutes(shift.endTime);
  const top = minutesToTop(startMin);
  const height = Math.max(minutesToHeight(startMin, endMin), 24);

  // Multi-column layout: each shift gets a fraction of the column width
  const colWidth = 100 / shift.colTotal;
  const left = shift.colIndex * colWidth;
  // Slight overlap for visual grouping
  const width = shift.colTotal > 1 ? colWidth + 1 : 100;

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'absolute rounded-md text-white text-[11px] font-medium',
        'cursor-grab active:cursor-grabbing transition-shadow',
        'hover:brightness-110 hover:shadow-lg active:scale-[0.99]',
        'overflow-hidden px-1.5 py-1 z-10',
        shift.colTotal > 1 && 'border-r border-white/30',
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${left}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        backgroundColor: shift.color,
      }}
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}`}
    >
      <div className="flex items-center gap-1 leading-tight">
        {/* Avatar circle for multi-column mode */}
        {shift.colTotal > 1 && (
          <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-bold shrink-0">
            {shift.initials}
          </span>
        )}
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

  // Pre-compute layouted shifts per day
  const layoutedShifts = useMemo(() => {
    const result: Record<string, LayoutedShift[]> = {};
    for (const date of weekDays) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayShifts = shifts[dateKey] || [];
      result[dateKey] = layoutOverlappingShifts(dayShifts);
    }
    return result;
  }, [shifts, weekDays]);

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
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayShifts = shifts[dateKey] || [];

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'flex-1 px-2 py-2 text-center border-r border-border/50 last:border-r-0 min-w-0',
                closed && closingPeriod && 'bg-red-50/60',
                closed && !closingPeriod && 'opacity-50',
              )}
            >
              <div className={cn(
                'text-[11px] font-medium uppercase tracking-wide',
                closed && closingPeriod ? 'text-red-700/60' : 'text-muted-foreground',
              )}>
                {format(date, 'EEE', { locale: fr })}
              </div>
              <div
                className={cn(
                  'text-lg font-bold leading-tight mt-0.5',
                  // Closing period — red circle
                  closed && closingPeriod && 'text-red-700 w-8 h-8 rounded-full border-[1.5px] border-red-700 flex items-center justify-center mx-auto text-sm',
                  // Today (not closed)
                  isToday && !closed && 'bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm',
                  // Regular
                  !isToday && !closed && 'text-foreground',
                  // Regular closed
                  closed && !closingPeriod && 'text-muted-foreground',
                )}
              >
                {format(date, 'd')}
              </div>
              {closingPeriod && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-[9px] font-medium text-red-700 truncate max-w-[60px]">{closingPeriod.name}</span>
                  <Lock className="w-2.5 h-2.5 text-red-600 shrink-0" />
                </div>
              )}
              {!closed && dayShifts.length > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1">
                  {dayShifts.length} service{dayShifts.length > 1 ? 's' : ''}
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
            const dayLayouted = layoutedShifts[dateKey] || [];
            const closed = isClosedDay(date);
            const closingPeriod = getClosingPeriod(date);
            const isToday = isDateToday(date);
            const isDragOver = dragOverCol === dateKey;
            const blocked = closed || (draggingStaffId ? hasShiftOnDate(draggingStaffId, dateKey) : false);

            return (
              <div
                key={dateKey}
                className={cn(
                  'flex-1 relative border-r border-border/50 last:border-r-0 min-w-0',
                  closed && closingPeriod && 'bg-red-50/40',
                  closed && !closingPeriod && 'bg-muted/30 cursor-not-allowed',
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

                {/* Shift blocks — multi-column layout */}
                {dayLayouted.map((shift) => (
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
                {closed && !closingPeriod && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wide -rotate-45">
                      Fermé
                    </span>
                  </div>
                )}

                {/* Closing period overlay */}
                {closed && closingPeriod && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-1 opacity-20">
                      <Lock className="w-8 h-8 text-red-700" />
                      <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                        {closingPeriod.name}
                      </span>
                    </div>
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
