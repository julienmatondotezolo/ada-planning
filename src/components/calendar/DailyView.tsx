'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { format, isToday as isDateToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarOff, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, Badge } from 'ada-design-system';
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

// ─── Horizontal Time Block (shift rendered in a staff row) ──────────────────

const ROW_HEIGHT = 56; // px per staff row

function DayHorizontalBlock({
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
  const left = minutesToLeft(startMin);
  const width = Math.max(minutesToWidth(startMin, endMin), 40);

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
        'overflow-hidden px-2 py-1 z-10',
        'top-1 bottom-1',
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: shift.color,
      }}
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}`}
    >
      <div className="flex items-center gap-1.5 leading-tight h-full">
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

// ─── Daily View Component (rotated: employees on LEFT, hours on TOP) ────────

export function DailyView({
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
  const gridRef = useRef<HTMLDivElement>(null);

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayShifts = shifts[dateKey] || [];
  const closed = isClosedDay(currentDate);
  const closingPeriod = getClosingPeriod(currentDate);
  const isToday = isDateToday(currentDate);

  // Hours for the time axis (columns)
  const hours = useMemo(() => {
    return Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  }, []);

  const totalWidth = hours.length * HOUR_WIDTH_PX;

  // Group shifts by staff member — each staff member gets their own row
  const staffWithShifts = useMemo(() => {
    const staffIds = new Set(dayShifts.map((s) => s.staffId));
    return staff.map((s) => ({
      ...s,
      shifts: dayShifts.filter((ds) => ds.staffId === s.id),
      hasShift: staffIds.has(s.id),
    }));
  }, [staff, dayShifts]);

  // Show ALL employees — those with shifts first, then the rest
  const visibleStaff = useMemo(() => {
    const withShifts = staffWithShifts.filter((s) => s.hasShift);
    const without = staffWithShifts.filter((s) => !s.hasShift);
    return [...withShifts, ...without];
  }, [staffWithShifts]);

  // ── Drag handlers ──

  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  const [draggingStaffId, setDraggingStaffId] = useState<string | null>(null);

  const handleShiftDragStart = useCallback((e: React.DragEvent, shift: ShiftAssignment) => {
    setDraggingStaffId(shift.staffId);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      shiftId: shift.id,
      sourceDate: dateKey,
      staffId: shift.staffId,
      startTime: shift.startTime,
      endTime: shift.endTime,
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, [dateKey]);

  const handleDrop = useCallback((e: React.DragEvent, targetStaffId: string) => {
    e.preventDefault();
    setDragOverRow(null);
    setDraggingStaffId(null);

    if (closed) {
      toast({
        title: 'Restaurant fermé',
        description: 'Impossible d\'ajouter un service — le restaurant est fermé ce jour.',
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
        onDropNewStaff(data.staffId, currentDate);
        return;
      }

      // In daily view, same-date moves don't change date, so no-op
    } catch {
      // invalid data
    }
  }, [closed, staff, dateKey, currentDate, onDropNewStaff]);

  const handleDragEnd = useCallback(() => {
    setDraggingStaffId(null);
    setDragOverRow(null);
  }, []);

  // Closed state — full-page overlay
  if (closed) {
    const isClosingPeriod = !!closingPeriod;
    return (
      <div className={cn(
        'flex-1 flex flex-col items-center justify-center p-8',
        isClosingPeriod ? 'bg-red-50/40' : '',
      )}>
        {isClosingPeriod ? (
          <Lock className="w-16 h-16 mb-4 text-red-600/30" />
        ) : (
          <CalendarOff className="w-16 h-16 mb-4 text-muted-foreground/30" />
        )}
        <h3 className={cn(
          'text-lg font-semibold mb-1',
          isClosingPeriod ? 'text-red-700' : 'text-muted-foreground',
        )}>
          Restaurant fermé
        </h3>
        {isClosingPeriod && (
          <div className="flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full border border-red-700/40 bg-white">
            <span className="text-sm font-medium text-red-700">{closingPeriod!.name}</span>
            <Lock className="w-3.5 h-3.5 text-red-600" />
          </div>
        )}
        <p className={cn(
          'text-sm text-center',
          isClosingPeriod ? 'text-red-700/60' : 'text-muted-foreground',
        )}>
          {isClosingPeriod
            ? `${format(new Date(closingPeriod!.date_from + 'T00:00:00'), 'd MMM', { locale: fr })} au ${format(new Date(closingPeriod!.date_to + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`
            : `Le ${format(currentDate, 'EEEE', { locale: fr })} est un jour de fermeture habituel.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="flex flex-col" style={{ minWidth: `${totalWidth + 160}px` }}>
          {/* ── Hour header row ── */}
          <div className="flex border-b bg-muted/40 shrink-0 sticky top-0 z-30">
            {/* Staff label gutter — sticky left */}
            <div className="w-[160px] shrink-0 border-r border-border/50 bg-muted/40 sticky left-0 z-40" />

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

          {/* ── Staff rows ── */}
          {visibleStaff.map((s) => {
            const isDragOver = dragOverRow === s.id;

            return (
              <div
                key={s.id}
                className={cn(
                  'flex border-b border-border/50',
                  !s.hasShift && 'bg-muted/10',
                  'cursor-pointer',
                  draggingStaffId && draggingStaffId !== s.id && isDragOver && 'bg-emerald-50/10 ring-1 ring-inset ring-emerald-400/30',
                )}
                style={{ height: `${ROW_HEIGHT}px` }}
                onClick={() => {
                  if (!s.hasShift) {
                    onCellClick(currentDate);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverRow !== s.id) setDragOverRow(s.id);
                }}
                onDragLeave={() => {}}
                onDrop={(e) => handleDrop(e, s.id)}
              >
                {/* Staff label (left gutter) — sticky left */}
                <div className={cn(
                  'w-[160px] shrink-0 border-r border-border/50 px-3 py-2 flex items-center gap-2 sticky left-0 z-20 bg-background',
                  !s.hasShift && 'opacity-60',
                )}>
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback
                      className="text-[9px] font-bold text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{s.name}</div>
                    {s.position && (
                      <div className="text-[10px] text-muted-foreground truncate">{s.position}</div>
                    )}
                  </div>
                  {s.hasShift && (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0 ml-auto">
                      {s.shifts.length}
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

                  {/* Shift blocks for this staff member */}
                  {s.shifts.map((shift) => (
                    <DayHorizontalBlock
                      key={shift.id}
                      shift={shift}
                      onClick={() => onShiftClick(shift, currentDate)}
                      onDragStart={(e) => handleShiftDragStart(e, shift)}
                    />
                  ))}

                  {/* Vertical now line (only on today) */}
                  {isToday && <NowLineVertical />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
