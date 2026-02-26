'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday as isDateToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Edit3,
  X,
  GripVertical,
  User,
  CalendarDays,
} from 'lucide-react';
import {
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ada-design-system';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  color: string;
  position: string;
  initials: string;
}

interface ShiftAssignment {
  id: string;
  staffId: string;
  name: string;
  color: string;
  position: string;
  initials: string;
  startTime: string;
  endTime: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const STAFF: StaffMember[] = [
  { id: '1', name: 'José', color: '#ef4444', position: 'Serveur', initials: 'JO' },
  { id: '2', name: 'Angélys', color: '#8b5cf6', position: 'Serveuse', initials: 'AN' },
  { id: '3', name: 'Mélia', color: '#10b981', position: 'Cuisinière', initials: 'ME' },
  { id: '4', name: 'Lino', color: '#f59e0b', position: 'Aide Cuisinier', initials: 'LI' },
  { id: '5', name: 'Lucas', color: '#3b82f6', position: 'Serveur', initials: 'LU' },
];

const DAY_NAMES_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Generate mock shift data
function generateMockShifts(): Record<string, ShiftAssignment[]> {
  const shifts: Record<string, ShiftAssignment[]> = {};
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });

  days.forEach((day) => {
    const dayOfWeek = getDay(day);
    // L'Osteria closed Sunday (0) and Monday (1)
    if (dayOfWeek === 0 || dayOfWeek === 1) return;

    const dateKey = format(day, 'yyyy-MM-dd');
    const dayShifts: ShiftAssignment[] = [];
    
    // Randomly assign 2-4 staff per day
    const shuffled = [...STAFF].sort(() => Math.random() - 0.5);
    const count = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const s = shuffled[i];
      const isLunch = Math.random() > 0.5;
      dayShifts.push({
        id: `${dateKey}-${s.id}`,
        staffId: s.id,
        name: s.name,
        color: s.color,
        position: s.position,
        initials: s.initials,
        startTime: isLunch ? '11:00' : '17:00',
        endTime: isLunch ? '15:00' : '23:00',
      });
    }

    if (dayShifts.length > 0) {
      shifts[dateKey] = dayShifts;
    }
  });

  return shifts;
}

// ─── Shift Pill Component ────────────────────────────────────────────────────

function ShiftPill({
  shift,
  compact = false,
  draggable = true,
  onClick,
  onDragStart,
}: {
  shift: ShiftAssignment;
  compact?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'group/pill flex items-center gap-1.5 rounded-md text-white text-xs font-medium',
        'cursor-grab active:cursor-grabbing transition-all duration-150',
        'hover:brightness-110 hover:shadow-md active:scale-[0.97]',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1 w-full'
      )}
      style={{ backgroundColor: shift.color }}
      title={`${shift.name} • ${shift.position}\n${shift.startTime}–${shift.endTime}`}
    >
      {!compact && (
        <GripVertical className="w-3 h-3 opacity-0 group-hover/pill:opacity-60 shrink-0 transition-opacity" />
      )}
      <span className="truncate">{shift.name}</span>
      {!compact && (
        <span className="text-[10px] opacity-75 ml-auto shrink-0">
          {shift.startTime}
        </span>
      )}
    </button>
  );
}

// ─── Calendar Cell ───────────────────────────────────────────────────────────

function CalendarDayCell({
  date,
  shifts,
  isCurrentMonth,
  isToday,
  isClosed,
  isDragOver,
  onCellClick,
  onShiftClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  date: Date;
  shifts: ShiftAssignment[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isClosed: boolean;
  isDragOver: boolean;
  onCellClick: () => void;
  onShiftClick: (shift: ShiftAssignment) => void;
  onDragStart: (e: React.DragEvent, shift: ShiftAssignment) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const dayNum = format(date, 'd');
  const maxVisible = 3;
  const overflow = shifts.length - maxVisible;

  return (
    <div
      className={cn(
        'relative flex flex-col border-b border-r border-border/50 min-h-[100px] md:min-h-[120px] transition-colors',
        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
        isDragOver && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
        isClosed && isCurrentMonth && 'bg-muted/20',
        isToday && 'bg-primary/[0.03]',
        !isClosed && isCurrentMonth && 'cursor-pointer hover:bg-muted/20',
      )}
      onClick={() => !isClosed && isCurrentMonth && onCellClick()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Day number */}
      <div className="flex items-center justify-between px-2 pt-1.5">
        <span
          className={cn(
            'text-xs font-semibold leading-none',
            !isCurrentMonth && 'text-muted-foreground/40',
            isCurrentMonth && !isToday && 'text-foreground',
            isToday &&
              'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[11px]',
          )}
        >
          {dayNum}
        </span>

        {isClosed && isCurrentMonth && (
          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wide">
            Fermé
          </span>
        )}

        {!isClosed && isCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCellClick();
            }}
            className="opacity-0 group-hover:opacity-100 hover:!opacity-100 p-0.5 rounded hover:bg-primary/10 transition-all"
          >
            <Plus className="w-3 h-3 text-primary" />
          </button>
        )}
      </div>

      {/* Shifts */}
      <div className="flex-1 px-1.5 pb-1 pt-1 space-y-0.5 overflow-hidden group">
        {shifts.slice(0, maxVisible).map((shift) => (
          <ShiftPill
            key={shift.id}
            shift={shift}
            onClick={() => onShiftClick(shift)}
            onDragStart={(e) => onDragStart(e, shift)}
          />
        ))}

        {overflow > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCellClick();
            }}
            className="w-full text-[10px] text-muted-foreground hover:text-foreground font-medium py-0.5 transition-colors"
          >
            +{overflow} autre{overflow > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add/Edit Shift Dialog ───────────────────────────────────────────────────

function ShiftDialog({
  open,
  onOpenChange,
  date,
  shift,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  shift: ShiftAssignment | null;
  onSave: (data: {
    staffId: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => void;
  onDelete?: () => void;
}) {
  const [selectedStaff, setSelectedStaff] = useState(shift?.staffId || '');
  const [startTime, setStartTime] = useState(shift?.startTime || '17:00');
  const [endTime, setEndTime] = useState(shift?.endTime || '23:00');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setSelectedStaff(shift?.staffId || '');
      setStartTime(shift?.startTime || '17:00');
      setEndTime(shift?.endTime || '23:00');
    }
  }, [open, shift]);

  const isEditing = !!shift;
  const selectedStaffMember = STAFF.find((s) => s.id === selectedStaff);

  const handleSave = () => {
    if (!selectedStaff) return;
    onSave({
      staffId: selectedStaff,
      startTime,
      endTime,
      date: format(date, 'yyyy-MM-dd'),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {isEditing ? 'Modifier le Shift' : 'Ajouter un Shift'}
          </DialogTitle>
          <DialogDescription>
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Personnel</Label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(s.id)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left',
                    selectedStaff === s.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.position}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-sm font-medium">
                Début
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time" className="text-sm font-medium">
                Fin
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Quick Time Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Raccourcis</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Midi', start: '11:00', end: '15:00' },
                { label: 'Soir', start: '17:00', end: '23:00' },
                { label: 'Journée', start: '10:00', end: '23:00' },
                { label: 'Coupure', start: '11:00', end: '14:00' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setStartTime(preset.start);
                    setEndTime(preset.end);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                    startTime === preset.start && endTime === preset.end
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  {preset.label}
                  <span className="ml-1 opacity-60">
                    {preset.start}–{preset.end}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {isEditing && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedStaff}
            >
              {isEditing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Legend Bar ─────────────────────────────────────────────────────────

function StaffLegend({ staff }: { staff: StaffMember[] }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto py-1 px-1 scrollbar-none">
      {staff.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-1.5 shrink-0"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ staffId: s.id, isNew: true }));
            e.dataTransfer.effectAllowed = 'copy';
          }}
        >
          <div
            className="w-3 h-3 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-xs text-muted-foreground font-medium cursor-grab active:cursor-grabbing">
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Summary ───────────────────────────────────────────────────────────

function MonthStats({ shifts }: { shifts: Record<string, ShiftAssignment[]> }) {
  const totalShifts = Object.values(shifts).reduce((sum, s) => sum + s.length, 0);
  const activeDays = Object.keys(shifts).length;
  
  // Count shifts per staff member
  const staffCounts: Record<string, number> = {};
  Object.values(shifts).forEach((dayShifts) => {
    dayShifts.forEach((s) => {
      staffCounts[s.staffId] = (staffCounts[s.staffId] || 0) + 1;
    });
  });

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" />
        <strong className="text-foreground">{activeDays}</strong> jours
      </span>
      <span className="flex items-center gap-1">
        <User className="w-3.5 h-3.5" />
        <strong className="text-foreground">{totalShifts}</strong> shifts
      </span>
    </div>
  );
}

// ─── Main Calendar View ──────────────────────────────────────────────────────

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ShiftAssignment[]>>(() =>
    generateMockShifts()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date>(new Date());
  const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggedShift, setDraggedShift] = useState<{
    shift: ShiftAssignment;
    sourceDate: string;
  } | null>(null);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const generateGrid = useCallback(() => {
    const firstDayOfWeek = getDay(monthStart);
    const prev: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - (i + 1));
      prev.push(d);
    }

    const next: Date[] = [];
    const total = prev.length + days.length;
    const rows = Math.ceil(total / 7);
    const remaining = rows * 7 - total;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(monthEnd);
      d.setDate(monthEnd.getDate() + i);
      next.push(d);
    }

    return [...prev, ...days, ...next];
  }, [monthStart, monthEnd, days]);

  const calendarDays = generateGrid();

  // Check if a day is a closed day (Sunday=0, Monday=1 for L'Osteria)
  const isClosedDay = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 1;
  };

  // ── Handlers ──

  const handleCellClick = (date: Date) => {
    setEditingShift(null);
    setDialogDate(date);
    setDialogOpen(true);
  };

  const handleShiftClick = (shift: ShiftAssignment, date: Date) => {
    setEditingShift(shift);
    setDialogDate(date);
    setDialogOpen(true);
  };

  const handleSave = (data: {
    staffId: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => {
    const staff = STAFF.find((s) => s.id === data.staffId);
    if (!staff) return;

    setShifts((prev) => {
      const updated = { ...prev };
      const dayShifts = [...(updated[data.date] || [])];

      if (editingShift) {
        // Update existing
        const idx = dayShifts.findIndex((s) => s.id === editingShift.id);
        if (idx >= 0) {
          dayShifts[idx] = {
            ...dayShifts[idx],
            staffId: data.staffId,
            name: staff.name,
            color: staff.color,
            position: staff.position,
            initials: staff.initials,
            startTime: data.startTime,
            endTime: data.endTime,
          };
        }
      } else {
        // Add new
        dayShifts.push({
          id: `${data.date}-${data.staffId}-${Date.now()}`,
          staffId: data.staffId,
          name: staff.name,
          color: staff.color,
          position: staff.position,
          initials: staff.initials,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }

      updated[data.date] = dayShifts;
      return updated;
    });
  };

  const handleDelete = () => {
    if (!editingShift) return;
    const dateKey = format(dialogDate, 'yyyy-MM-dd');
    setShifts((prev) => {
      const updated = { ...prev };
      const dayShifts = (updated[dateKey] || []).filter(
        (s) => s.id !== editingShift.id
      );
      if (dayShifts.length === 0) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = dayShifts;
      }
      return updated;
    });
  };

  // ── Drag & Drop ──

  const handleDragStart = (
    e: React.DragEvent,
    shift: ShiftAssignment,
    date: Date
  ) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDraggedShift({ shift, sourceDate: dateKey });
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ shiftId: shift.id, sourceDate: dateKey, staffId: shift.staffId })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dateKey = format(date, 'yyyy-MM-dd');
    if (dragOverDate !== dateKey) {
      setDragOverDate(dateKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);

    const targetDateKey = format(targetDate, 'yyyy-MM-dd');

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      // Handle drag from staff legend (create new shift)
      if (data.isNew) {
        const staff = STAFF.find((s) => s.id === data.staffId);
        if (!staff) return;

        setShifts((prev) => {
          const updated = { ...prev };
          const dayShifts = [...(updated[targetDateKey] || [])];
          dayShifts.push({
            id: `${targetDateKey}-${staff.id}-${Date.now()}`,
            staffId: staff.id,
            name: staff.name,
            color: staff.color,
            position: staff.position,
            initials: staff.initials,
            startTime: '17:00',
            endTime: '23:00',
          });
          updated[targetDateKey] = dayShifts;
          return updated;
        });
        return;
      }

      // Handle move from another cell
      const { shiftId, sourceDate } = data;
      if (sourceDate === targetDateKey) return; // Same cell, no-op

      setShifts((prev) => {
        const updated = { ...prev };

        // Remove from source
        const sourceShifts = [...(updated[sourceDate] || [])];
        const shiftIdx = sourceShifts.findIndex((s) => s.id === shiftId);
        if (shiftIdx < 0) return prev;

        const [movedShift] = sourceShifts.splice(shiftIdx, 1);
        if (sourceShifts.length === 0) {
          delete updated[sourceDate];
        } else {
          updated[sourceDate] = sourceShifts;
        }

        // Add to target
        const targetShifts = [...(updated[targetDateKey] || [])];
        targetShifts.push({
          ...movedShift,
          id: `${targetDateKey}-${movedShift.staffId}-${Date.now()}`,
        });
        updated[targetDateKey] = targetShifts;

        return updated;
      });
    } catch {
      // Invalid data, ignore
    }

    setDraggedShift(null);
  };

  // ── Render ──

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="ml-2 text-xs h-7"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4">
          <MonthStats shifts={shifts} />
        </div>
      </div>

      {/* ── Staff Legend (drag source) ── */}
      <div className="px-4 md:px-6 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            Glisser pour planifier:
          </span>
          <StaffLegend staff={STAFF} />
        </div>
      </div>

      {/* ── Day Headers ── */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {DAY_NAMES_SHORT.map((day, i) => (
          <div
            key={day}
            className={cn(
              'px-2 py-2 text-center text-xs font-semibold border-r border-border/50 last:border-r-0',
              (i === 0 || i === 1) ? 'text-muted-foreground/50' : 'text-muted-foreground'
            )}
          >
            <span className="hidden md:inline">{DAY_NAMES_FULL[i]}</span>
            <span className="md:hidden">{day}</span>
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-h-full">
          {calendarDays.map((date, index) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(date, currentDate);
            const dayShifts = shifts[dateKey] || [];

            return (
              <CalendarDayCell
                key={index}
                date={date}
                shifts={dayShifts}
                isCurrentMonth={isCurrentMonth}
                isToday={isDateToday(date)}
                isClosed={isClosedDay(date)}
                isDragOver={dragOverDate === dateKey}
                onCellClick={() => handleCellClick(date)}
                onShiftClick={(shift) => handleShiftClick(shift, date)}
                onDragStart={(e, shift) => handleDragStart(e, shift, date)}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Shift Dialog ── */}
      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={dialogDate}
        shift={editingShift}
        onSave={handleSave}
        onDelete={editingShift ? handleDelete : undefined}
      />
    </div>
  );
}
