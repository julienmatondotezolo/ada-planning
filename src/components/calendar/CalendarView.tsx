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
import { toast } from '@/hooks/useToast';
import { staffApi, shiftsApi, shiftPresetsApi, settingsApi, type Employee, type Shift, type ShiftPreset, type DaySchedule } from '@/lib/api';

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

// ─── Staff Color Assignment ──────────────────────────────────────────────────

const STAFF_COLORS = [
  '#ef4444', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

function employeeToStaffMember(emp: Employee, index: number): StaffMember {
  const initials = `${emp.first_name.charAt(0)}${emp.last_name.charAt(0)}`.toUpperCase();
  return {
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    color: STAFF_COLORS[index % STAFF_COLORS.length],
    position: emp.position || emp.role || '',
    initials,
  };
}

// Format time to hh:mm (strip seconds if present)
function fmtTime(t: string): string {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0]}:${parts[1]}`;
}

// Monday-first week
const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_NAMES_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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
      title={`${shift.name} • ${shift.position}\n${fmtTime(shift.startTime)} - ${fmtTime(shift.endTime)}`}
    >
      {!compact && (
        <GripVertical className="w-3 h-3 opacity-0 group-hover/pill:opacity-60 shrink-0 transition-opacity" />
      )}
      <span className="font-bold truncate hover:underline cursor-pointer">{shift.name}</span>
      <span className={cn("opacity-80 shrink-0", compact ? "text-[9px]" : "text-[10px] ml-auto")}>
        {fmtTime(shift.startTime)} - {fmtTime(shift.endTime)}
      </span>
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
        isClosed && isCurrentMonth && 'bg-muted/40 opacity-50 cursor-not-allowed',
        isClosed && !isCurrentMonth && 'bg-muted/50 opacity-30',
        !isClosed && isDragOver && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
        !isClosed && isToday && 'bg-primary/[0.03]',
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
  staff,
  servicePresets,
  defaultStaffId,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  shift: ShiftAssignment | null;
  staff: StaffMember[];
  servicePresets: ShiftPreset[];
  defaultStaffId?: string;
  onSave: (data: {
    staffId: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => void;
  onDelete?: () => void;
}) {
  const [selectedStaff, setSelectedStaff] = useState(shift?.staffId || defaultStaffId || '');
  const [selectedService, setSelectedService] = useState('');
  const [startTime, setStartTime] = useState(shift?.startTime || '17:00');
  const [endTime, setEndTime] = useState(shift?.endTime || '23:00');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setSelectedStaff(shift?.staffId || defaultStaffId || '');
      setStartTime(shift?.startTime || '17:00');
      setEndTime(shift?.endTime || '23:00');

      // Try to match existing shift times to a service preset
      if (shift) {
        const match = servicePresets.find((p) =>
          p.shifts.length === 1 &&
          p.shifts[0].start_time === shift.startTime &&
          p.shifts[0].end_time === shift.endTime
        );
        setSelectedService(match?.id || 'custom');
      } else {
        setSelectedService('');
      }
    }
  }, [open, shift, servicePresets]);

  const isEditing = !!shift;
  const selectedStaffMember = staff.find((s) => s.id === selectedStaff);

  const handleServiceChange = (presetId: string) => {
    setSelectedService(presetId);
    if (presetId === 'custom') return;

    const preset = servicePresets.find((p) => p.id === presetId);
    if (preset && preset.shifts.length > 0) {
      // Use first time range for start/end
      setStartTime(preset.shifts[0].start_time);
      setEndTime(preset.shifts[preset.shifts.length - 1].end_time);
    }
  };

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
            {isEditing ? 'Modifier le service' : 'Ajouter un service'}
          </DialogTitle>
          <DialogDescription>
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Staff Selection — Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Personnel</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un employé">
                  {selectedStaffMember && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: selectedStaffMember.color }}
                      >
                        {selectedStaffMember.initials}
                      </div>
                      <span>{selectedStaffMember.name}</span>
                      <span className="text-muted-foreground text-xs">— {selectedStaffMember.position}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.initials}
                      </div>
                      <span>{s.name}</span>
                      <span className="text-muted-foreground text-xs">— {s.position}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Preset Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Service</Label>
            <Select value={selectedService} onValueChange={handleServiceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un service">
                  {selectedService && selectedService !== 'custom' && (() => {
                    const preset = servicePresets.find((p) => p.id === selectedService);
                    if (!preset) return null;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {preset.shifts.map((s) => `${fmtTime(s.start_time)}–${fmtTime(s.end_time)}`).join(' • ')}
                        </span>
                      </div>
                    );
                  })()}
                  {selectedService === 'custom' && (
                    <span className="text-muted-foreground">Horaire personnalisé</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {servicePresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {preset.shifts.map((s) => `${fmtTime(s.start_time)}–${fmtTime(s.end_time)}`).join(' • ')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <span className="text-muted-foreground">Horaire personnalisé</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection — always visible, editable even after service selection */}
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
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setSelectedService('custom');
                  }}
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
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setSelectedService('custom');
                  }}
                  className="pl-10"
                />
              </div>
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
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
      {staff.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md cursor-grab active:cursor-grabbing hover:brightness-95 transition-all border-2"
          style={{
            borderColor: s.color,
            backgroundColor: `${s.color}20`,
          }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ staffId: s.id, isNew: true }));
            e.dataTransfer.effectAllowed = 'copy';
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-xs font-semibold" style={{ color: s.color }}>
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
  const [shifts, setShifts] = useState<Record<string, ShiftAssignment[]>>({});
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [servicePresets, setServicePresets] = useState<ShiftPreset[]>([]);
  const [openingHours, setOpeningHours] = useState<Record<string, DaySchedule>>({});
  const [isClient, setIsClient] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch real employees, shifts, service presets, and opening hours from API
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch employees
        const empRes = await staffApi.getAll({ active_only: true });
        let staffMembers: StaffMember[] = [];
        if (empRes.success && empRes.data && empRes.data.length > 0) {
          staffMembers = empRes.data.map((emp, i) => employeeToStaffMember(emp, i));
          setStaff(staffMembers);
        }

        // Fetch service presets
        const presetsRes = await shiftPresetsApi.getAll();
        if (presetsRes.success && presetsRes.data) {
          setServicePresets(presetsRes.data);
        }

        // Fetch opening hours from settings
        const settingsRes = await settingsApi.get();
        if (settingsRes.success && settingsRes.data?.opening_hours) {
          setOpeningHours(settingsRes.data.opening_hours);
        }

        // Fetch shifts for current month
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const shiftsRes = await shiftsApi.getAll({
          start_date: format(monthStart, 'yyyy-MM-dd'),
          end_date: format(monthEnd, 'yyyy-MM-dd'),
        });

        if (shiftsRes.success && shiftsRes.data && shiftsRes.data.length > 0) {
          // Convert API shifts to ShiftAssignment format grouped by date
          const shiftMap: Record<string, ShiftAssignment[]> = {};
          shiftsRes.data.forEach((apiShift) => {
            const dateKey = apiShift.date || apiShift.scheduled_date || '';
            if (!dateKey) return;
            
            // Find matching staff member for color/initials
            const staffMember = staffMembers.find((s) => s.id === apiShift.employee_id);
            const empName = apiShift.employee_name || staffMember?.name || 'Inconnu';
            const initials = staffMember?.initials || empName.split(' ').map((w: string) => w.charAt(0)).join('').toUpperCase().slice(0, 2);
            
            if (!shiftMap[dateKey]) shiftMap[dateKey] = [];
            shiftMap[dateKey].push({
              id: apiShift.id,
              staffId: apiShift.employee_id,
              name: empName,
              color: staffMember?.color || STAFF_COLORS[0],
              position: apiShift.position || staffMember?.position || '',
              initials,
              startTime: apiShift.start_time || '',
              endTime: apiShift.end_time || '',
            });
          });
          setShifts(shiftMap);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingData(false);
        setIsClient(true);
      }
    };

    fetchData();
  }, [currentDate]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date>(new Date());
  const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
  const [dialogDefaultStaffId, setDialogDefaultStaffId] = useState<string | undefined>();
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggedShift, setDraggedShift] = useState<{
    shift: ShiftAssignment;
    sourceDate: string;
  } | null>(null);

  // Generate calendar grid (Monday-first)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map JS getDay() (0=Sun) to French day keys for opening hours
  const JS_DAY_TO_FR_KEY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  const generateGrid = useCallback(() => {
    // getDay: 0=Sun, 1=Mon... We want Mon=0 col
    const jsDay = getDay(monthStart); // 0-6
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Tue=1, ..., Sun=6

    const prev: Date[] = [];
    for (let i = mondayOffset - 1; i >= 0; i--) {
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

  // Check if a day is closed based on opening hours from API
  const isClosedDay = useCallback((date: Date) => {
    const dayKey = JS_DAY_TO_FR_KEY[getDay(date)];
    const daySchedule = openingHours[dayKey];
    // If no opening hours data, fall back to open
    if (!daySchedule) return false;
    return !daySchedule.enabled;
  }, [openingHours]);

  // ── Handlers ──

  const handleCellClick = (date: Date) => {
    if (isClosedDay(date)) {
      const dayName = format(date, 'EEEE', { locale: fr });
      toast({
        title: 'Restaurant fermé',
        description: `Impossible d'ajouter un service le ${dayName} — le restaurant est fermé ce jour.`,
        variant: 'destructive',
      });
      return;
    }
    setEditingShift(null);
    setDialogDefaultStaffId(undefined);
    setDialogDate(date);
    setDialogOpen(true);
  };

  const handleShiftClick = (shift: ShiftAssignment, date: Date) => {
    setEditingShift(shift);
    setDialogDefaultStaffId(undefined);
    setDialogDate(date);
    setDialogOpen(true);
  };

  const handleSave = async (data: {
    staffId: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => {
    const staffMember = staff.find((s) => s.id === data.staffId);
    if (!staffMember) return;

    if (editingShift) {
      // Update existing shift via API
      const res = await shiftsApi.update(editingShift.id, {
        employee_id: data.staffId,
        scheduled_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        position: staffMember.position,
      });

      if (res.success) {
        setShifts((prev) => {
          const updated = { ...prev };
          // Remove from old date
          const oldDateKey = format(dialogDate, 'yyyy-MM-dd');
          const oldDayShifts = (updated[oldDateKey] || []).filter(
            (s) => s.id !== editingShift.id
          );
          if (oldDayShifts.length === 0) {
            delete updated[oldDateKey];
          } else {
            updated[oldDateKey] = oldDayShifts;
          }

          // Add to new date
          const newDayShifts = [...(updated[data.date] || [])];
          newDayShifts.push({
            id: res.data?.id || editingShift.id,
            staffId: data.staffId,
            name: staffMember.name,
            color: staffMember.color,
            position: staffMember.position,
            initials: staffMember.initials,
            startTime: data.startTime,
            endTime: data.endTime,
          });
          updated[data.date] = newDayShifts;
          return updated;
        });
      }
    } else {
      // Create new shift via API
      const res = await shiftsApi.create({
        employee_id: data.staffId,
        scheduled_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        position: staffMember.position,
      });

      if (res.success && res.data) {
        setShifts((prev) => {
          const updated = { ...prev };
          const dayShifts = [...(updated[data.date] || [])];
          dayShifts.push({
            id: res.data.id,
            staffId: data.staffId,
            name: staffMember.name,
            color: staffMember.color,
            position: staffMember.position,
            initials: staffMember.initials,
            startTime: data.startTime,
            endTime: data.endTime,
          });
          updated[data.date] = dayShifts;
          return updated;
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!editingShift) return;
    const dateKey = format(dialogDate, 'yyyy-MM-dd');

    const res = await shiftsApi.delete(editingShift.id);
    if (res.success) {
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
    }
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
    // effectAllowed is 'copy' from legend, 'move' from existing shifts
    e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move';
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

    // Block drops on closed days
    if (isClosedDay(targetDate)) {
      const dayName = format(targetDate, 'EEEE', { locale: fr });
      toast({
        title: 'Restaurant fermé',
        description: `Impossible d'ajouter un service le ${dayName} — le restaurant est fermé ce jour.`,
        variant: 'destructive',
      });
      return;
    }

    const targetDateKey = format(targetDate, 'yyyy-MM-dd');

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      // Handle drag from staff legend — open dialog with staff pre-selected
      if (data.isNew) {
        const staffMember = staff.find((s) => s.id === data.staffId);
        if (!staffMember) return;

        setEditingShift(null);
        setDialogDefaultStaffId(staffMember.id);
        setDialogDate(targetDate);
        setDialogOpen(true);
        return;
      }

      // Handle move from another cell
      const { shiftId, sourceDate } = data;
      if (sourceDate === targetDateKey) return; // Same cell, no-op

      // Find the shift being moved
      const sourceShifts = shifts[sourceDate] || [];
      const movedShift = sourceShifts.find((s) => s.id === shiftId);
      if (!movedShift) return;

      // Update via API
      shiftsApi.update(shiftId, {
        scheduled_date: targetDateKey,
      }).then((res) => {
        if (res.success) {
          setShifts((prev) => {
            const updated = { ...prev };

            // Remove from source
            const srcShifts = [...(updated[sourceDate] || [])];
            const idx = srcShifts.findIndex((s) => s.id === shiftId);
            if (idx < 0) return prev;

            const [removed] = srcShifts.splice(idx, 1);
            if (srcShifts.length === 0) {
              delete updated[sourceDate];
            } else {
              updated[sourceDate] = srcShifts;
            }

            // Add to target
            const targetShifts = [...(updated[targetDateKey] || [])];
            targetShifts.push({
              ...removed,
              id: res.data?.id || removed.id,
            });
            updated[targetDateKey] = targetShifts;

            return updated;
          });
        }
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
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b bg-background">
        {/* Left — Month Navigation */}
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
        </div>

        {/* Center — Today button */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => setCurrentDate(new Date())}
        >
          Aujourd'hui
        </Button>

        {/* Right — Today's date */}
        <div className="text-sm text-muted-foreground capitalize">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
      </div>

      {/* ── Staff Legend (drag source) ── */}
      <div className="px-4 md:px-6 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            Glisser pour planifier:
          </span>
          <StaffLegend staff={staff} />
        </div>
      </div>

      {/* ── Day Headers ── */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {DAY_NAMES_SHORT.map((day, i) => (
          <div
            key={day}
            className={cn(
              'px-2 py-2 text-center text-xs font-semibold border-r border-border/50 last:border-r-0',
              i >= 5 ? 'text-muted-foreground/50' : 'text-muted-foreground'
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
        staff={staff}
        servicePresets={servicePresets}
        defaultStaffId={dialogDefaultStaffId}
        onSave={handleSave}
        onDelete={editingShift ? handleDelete : undefined}
      />
    </div>
  );
}
