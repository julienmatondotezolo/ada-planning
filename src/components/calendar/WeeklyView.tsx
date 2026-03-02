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
  HOUR_WIDTH_PX,
  timeToMinutes,
  minutesToLeft,
  minutesToWidth,
} from './types';

// ─── Overlap layout: compute row index + total rows per shift group ─────────

interface LayoutedShift extends ShiftAssignment {
  rowIndex: number;
  rowTotal: number;
}

function layoutOverlappingShifts(shifts: ShiftAssignment[]): LayoutedShift[] {
  if (shifts.length === 0) return [];

  // Sort by start time, then by end time (longer first)
  const sorted = [...shifts].sort((a, b) => {
    const d = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    return d !== 0 ? d : timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  // Assign rows using a greedy algorithm
  const rows: { endMin: number; shift: ShiftAssignment }[][] = [];

  for (const shift of sorted) {
    const startMin = timeToMinutes(shift.startTime);
    let placed = false;

    for (let row = 0; row < rows.length; row++) {
      const lastInRow = rows[row][rows[row].length - 1];
      if (lastInRow.endMin <= startMin) {
        rows[row].push({ endMin: timeToMinutes(shift.endTime), shift });
        placed = true;
        break;
      }
    }

    if (!placed) {
      rows.push([{ endMin: timeToMinutes(shift.endTime), shift }]);
    }
  }

  // Build result with row info
  const result: LayoutedShift[] = [];
  const totalRows = rows.length;

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    for (const entry of rows[rowIdx]) {
      result.push({
        ...entry.shift,
        rowIndex: rowIdx,
        rowTotal: totalRows,
      });
    }
  }

  return result;
}

// ─── Time Block (shift rendered horizontally) ────────────────────────────────

const ROW_HEIGHT = 64; // px per day row base height

function HorizontalTimeBlock({
  shift,
  rowHeight,
  onClick,
  onDragStart,
}: {
  shift: LayoutedShift;
  rowHeight: number;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const startMin = timeToMinutes(shift.startTime);
  const endMin = timeToMinutes(shift.endTime);
  const left = minutesToLeft(startMin);
  const width = Math.max(minutesToWidth(startMin, endMin), 40);

  // Multi-row layout within a day row
  const subRowHeight = rowHeight / shift.rowTotal;
  const top = shift.rowIndex * subRowHeight;
  const height = subRowHeight - 2; // 2px gap

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
        'overflow-hidden px-1.5 py-0.5 z-10',
        shift.rowTotal > 1 && 'border-b border-white/30',
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top + 1}px`,
        height: `${height}px`,
        backgroundColor: shift.color,
      }}
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}`}
    >
      <div className="flex items-center gap-1 leading-tight h-full">
        {shift.rowTotal > 1 && (
          <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-bold shrink-0">
            {shift.initials}
          </span>
        )}
        <span className="font-bold truncate">{shift.name}</span>
        <span className="text-[9px] opacity-80 shrink-0 ml-auto">
          {fmtTime(shift.startTime)}–{fmtTime(shift.endTime)}
        </span>
      </div>
    </button>
  );
}

// ─── Vertical "Now" line ─────────────────────────────────────────────────────

function NowLineVertical() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < HOUR_START * 60 || minutes > HOUR_END * 60) return null;
  const left = minutesToLeft(minutes);

  return (
    <div
      className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
      style={{ left: `${left}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-destructive -mt-1 shrink-0" />
      <div className="flex-1 border-l-2 border-destructive" />
    </div>
  );
}

// ─── Weekly View Component (rotated: dates on LEFT, hours on TOP) ────────────

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
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  const [draggingStaffId, setDraggingStaffId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Week days (Mon–Sun)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart.getTime()]);

  // Hours for the time axis (columns)
  const hours = useMemo(() => {
    return Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  }, []);

  const totalWidth = hours.length * HOUR_WIDTH_PX;

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

  // Compute row heights based on overlap count
  const rowHeights = useMemo(() => {
    const result: Record<string, number> = {};
    for (const date of weekDays) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const layouted = layoutedShifts[dateKey] || [];
      const maxRows = layouted.length > 0 ? Math.max(...layouted.map((s) => s.rowTotal)) : 1;
      result[dateKey] = Math.max(ROW_HEIGHT, maxRows * 32);
    }
    return result;
  }, [layoutedShifts, weekDays]);

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
    if (dragOverRow !== dateKey) setDragOverRow(dateKey);
  }, [dragOverRow]);

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverRow(null);
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
        onDropNewStaff(data.staffId, targetDate);
        return;
      }

      // Move existing shift
      const { shiftId, sourceDate } = data;
      if (sourceDate === targetDateKey) return;

      onDragShift(shiftId, targetDateKey);
    } catch {
      // invalid data
    }
  }, [isClosedDay, staff, onDragShift, onDropNewStaff]);

  const handleDragEnd = useCallback(() => {
    setDraggingStaffId(null);
    setDragOverRow(null);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="flex flex-col" style={{ minWidth: `${totalWidth + 140}px` }}>
          {/* ── Hour header row ── */}
          <div className="flex border-b bg-muted/40 shrink-0 sticky top-0 z-30">
            {/* Day label gutter — sticky left */}
            <div className="w-[140px] shrink-0 border-r border-border/50 bg-muted/40 sticky left-0 z-40" />

            {/* Hour columns */}
            <div className="relative flex-1" style={{ minWidth: `${totalWidth}px`, height: '36px' }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 flex items-center justify-center border-l border-border/50"
                  style={{
                    left: `${(hour - HOUR_START) * HOUR_WIDTH_PX}px`,
                    width: `${HOUR_WIDTH_PX}px`,
                  }}
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Day rows ── */}
          {weekDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayLayouted = layoutedShifts[dateKey] || [];
            const dayShifts = shifts[dateKey] || [];
            const closed = isClosedDay(date);
            const closingPeriod = getClosingPeriod(date);
            const isToday = isDateToday(date);
            const isDragOver = dragOverRow === dateKey;
            const blocked = closed;
            const rowH = rowHeights[dateKey] || ROW_HEIGHT;

            return (
              <div
                key={dateKey}
                className={cn(
                  'flex border-b border-border/50',
                  closed && closingPeriod && 'bg-red-50/40',
                  closed && !closingPeriod && 'bg-muted/30 cursor-not-allowed',
                  !closed && isToday && 'bg-primary/[0.02]',
                  !closed && 'cursor-pointer',
                  draggingStaffId && !blocked && 'ring-1 ring-inset ring-emerald-400/20',
                  draggingStaffId && !blocked && isDragOver && 'ring-emerald-500/40 bg-emerald-50/10',
                  draggingStaffId && blocked && 'opacity-40',
                )}
                style={{ height: `${rowH}px` }}
                onClick={() => !closed && onCellClick(date)}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={() => {}}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Day label (left gutter) — sticky left */}
                <div className={cn(
                  'w-[140px] shrink-0 border-r border-border/50 px-3 py-2 flex flex-col justify-center sticky left-0 z-20',
                  closed && closingPeriod ? 'bg-red-50/60' : 'bg-background',
                  closed && !closingPeriod && 'opacity-50',
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      closed && closingPeriod ? 'text-red-700/60' : 'text-muted-foreground',
                    )}>
                      {format(date, 'EEE', { locale: fr })}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold leading-tight',
                        closed && closingPeriod && 'text-red-700 w-7 h-7 rounded-full border-[1.5px] border-red-700 flex items-center justify-center text-xs',
                        isToday && !closed && 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-xs',
                        !isToday && !closed && 'text-foreground',
                        closed && !closingPeriod && 'text-muted-foreground',
                      )}
                    >
                      {format(date, 'd')}
                    </span>
                    <span className={cn(
                      'text-[10px]',
                      closed && closingPeriod ? 'text-red-700/50' : 'text-muted-foreground/60',
                    )}>
                      {format(date, 'MMM', { locale: fr })}
                    </span>
                  </div>
                  {closingPeriod && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] font-medium text-red-700 truncate">{closingPeriod.name}</span>
                      <Lock className="w-2.5 h-2.5 text-red-600 shrink-0" />
                    </div>
                  )}
                  {!closed && dayShifts.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1 w-fit">
                      {dayShifts.length} service{dayShifts.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Time grid area (horizontal) */}
                <div className="relative flex-1" style={{ minWidth: `${totalWidth}px` }}>
                  {/* Hour gridlines (vertical) */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-l border-border/30"
                      style={{ left: `${(hour - HOUR_START) * HOUR_WIDTH_PX}px` }}
                    />
                  ))}

                  {/* Half-hour gridlines */}
                  {hours.map((hour) => (
                    <div
                      key={`${hour}-half`}
                      className="absolute top-0 bottom-0 border-l border-border/15"
                      style={{ left: `${(hour - HOUR_START) * HOUR_WIDTH_PX + HOUR_WIDTH_PX / 2}px` }}
                    />
                  ))}

                  {/* Shift blocks — positioned horizontally */}
                  {dayLayouted.map((shift) => (
                    <HorizontalTimeBlock
                      key={shift.id}
                      shift={shift}
                      rowHeight={rowH}
                      onClick={() => onShiftClick(shift, date)}
                      onDragStart={(e) => handleShiftDragStart(e, shift, date)}
                    />
                  ))}

                  {/* Vertical now line (only on today) */}
                  {isToday && <NowLineVertical />}

                  {/* Closed overlay */}
                  {closed && !closingPeriod && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wide">
                        Fermé
                      </span>
                    </div>
                  )}

                  {/* Closing period overlay */}
                  {closed && closingPeriod && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-2 opacity-20">
                        <Lock className="w-6 h-6 text-red-700" />
                        <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          {closingPeriod.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
