'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { format, isToday as isDateToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarOff } from 'lucide-react';
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
} from './types';

// ─── Time Block (shift rendered in a staff column) ──────────────────────────

function DayTimeBlock({
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
  const height = Math.max(minutesToHeight(startMin, endMin), 28);

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
        'overflow-hidden px-2 py-1.5 z-10',
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: shift.color,
      }}
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}`}
    >
      <div className="flex items-center gap-1.5 leading-tight">
        <span className="font-bold truncate">{shift.name}</span>
      </div>
      {height >= 44 && (
        <div className="text-[10px] opacity-80 mt-0.5">
          {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
        </div>
      )}
      {height >= 60 && shift.position && (
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

// ─── Daily View Component ────────────────────────────────────────────────────

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

  // Hours for the time axis
  const hours = useMemo(() => {
    return Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  }, []);

  const totalHeight = hours.length * HOUR_HEIGHT_PX;

  // Group shifts by staff member — each staff member gets their own column
  const staffWithShifts = useMemo(() => {
    // Get all staff who have shifts today
    const staffIds = new Set(dayShifts.map((s) => s.staffId));
    // Also include all staff for drop targets
    return staff.map((s) => ({
      ...s,
      shifts: dayShifts.filter((ds) => ds.staffId === s.id),
      hasShift: staffIds.has(s.id),
    }));
  }, [staff, dayShifts]);

  // Only show staff with shifts + a few unassigned for empty columns
  const visibleStaff = useMemo(() => {
    const withShifts = staffWithShifts.filter((s) => s.hasShift);
    const without = staffWithShifts.filter((s) => !s.hasShift);
    // Show all staff with shifts, then up to 4 empty columns for unassigned staff
    return [...withShifts, ...without.slice(0, Math.max(4, 7 - withShifts.length))];
  }, [staffWithShifts]);

  // ── Drag handlers ──

  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
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
    setDragOverCol(null);
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

        if (hasShiftOnDate(data.staffId, dateKey)) {
          toast({
            title: 'Déjà planifié',
            description: `${staffMember.name} a déjà un service ce jour.`,
            variant: 'destructive',
          });
          return;
        }

        onDropNewStaff(data.staffId, currentDate);
        return;
      }

      // In daily view, same-date moves don't change date, so no-op for now
      // (could support time-based drag in the future)
    } catch {
      // invalid data
    }
  }, [closed, hasShiftOnDate, staff, dateKey, currentDate, onDropNewStaff]);

  const handleDragEnd = useCallback(() => {
    setDraggingStaffId(null);
    setDragOverCol(null);
  }, []);

  // Closed state
  if (closed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <CalendarOff className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-lg font-semibold mb-1">Restaurant fermé</h3>
        <p className="text-sm text-center">
          {closingPeriod
            ? `${closingPeriod.name} — ${format(new Date(closingPeriod.date_from + 'T00:00:00'), 'd MMM', { locale: fr })} au ${format(new Date(closingPeriod.date_to + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`
            : `Le ${format(currentDate, 'EEEE', { locale: fr })} est un jour de fermeture habituel.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Staff column headers ── */}
      <div className="flex border-b bg-muted/40 shrink-0">
        {/* Time gutter spacer */}
        <div className="w-16 shrink-0 border-r border-border/50" />

        {visibleStaff.map((s) => (
          <div
            key={s.id}
            className={cn(
              'flex-1 px-2 py-2.5 text-center border-r border-border/50 last:border-r-0 min-w-[100px]',
              !s.hasShift && 'opacity-60',
            )}
          >
            <Avatar className="w-8 h-8 mx-auto mb-1">
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs font-semibold truncate">{s.name}</div>
            {s.position && (
              <div className="text-[10px] text-muted-foreground truncate">{s.position}</div>
            )}
            {s.hasShift && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1">
                {s.shifts.length} service{s.shifts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* ── Time grid ── */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="flex" style={{ minHeight: `${totalHeight}px` }}>
          {/* Time gutter */}
          <div className="w-16 shrink-0 border-r border-border/50 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start justify-end pr-2 -translate-y-1/2"
                style={{ top: `${(hour - HOUR_START) * HOUR_HEIGHT_PX}px` }}
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Staff columns */}
          {visibleStaff.map((s) => {
            const isDragOver = dragOverCol === s.id;

            return (
              <div
                key={s.id}
                className={cn(
                  'flex-1 relative border-r border-border/50 last:border-r-0 min-w-[100px]',
                  !s.hasShift && 'bg-muted/10',
                  'cursor-pointer',
                  draggingStaffId && draggingStaffId !== s.id && isDragOver && 'bg-emerald-50/10 ring-1 ring-inset ring-emerald-400/30',
                )}
                onClick={() => {
                  if (!s.hasShift) {
                    // Click empty column — open add dialog for this staff member
                    onCellClick(currentDate);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverCol !== s.id) setDragOverCol(s.id);
                }}
                onDragLeave={() => {}}
                onDrop={(e) => handleDrop(e, s.id)}
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

                {/* Shift blocks for this staff member */}
                {s.shifts.map((shift) => (
                  <DayTimeBlock
                    key={shift.id}
                    shift={shift}
                    onClick={() => onShiftClick(shift, currentDate)}
                    onDragStart={(e) => handleShiftDragStart(e, shift)}
                  />
                ))}

                {/* Now line (only on today) */}
                {isToday && <NowLine />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
