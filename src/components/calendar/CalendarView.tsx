'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
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
  GripVertical,
  User,
  Users,
  CalendarDays,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
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
import { useEmployees, useShifts, shiftKeys } from '@/hooks/useStaff';
import { useShiftPresets } from '@/hooks/useShiftPresets';
import { useRestaurantSettings } from '@/hooks/useSettings';
import { useClosingPeriods } from '@/hooks/useClosingPeriods';
import { shiftsApi, type Employee, type Shift, type ShiftPreset, type DaySchedule, type ClosingPeriod } from '@/lib/api';

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

let shiftIdCounter = 0;

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
  onDragEnd,
}: {
  shift: ShiftAssignment;
  compact?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
  closedLabel,
  isDragOver,
  isDropBlocked,
  isDragging,
  onCellClick,
  onShiftClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  date: Date;
  shifts: ShiftAssignment[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isClosed: boolean;
  closedLabel?: string;
  isDragOver: boolean;
  isDropBlocked: boolean;
  isDragging: boolean;
  onCellClick: () => void;
  onShiftClick: (shift: ShiftAssignment) => void;
  onDragStart: (e: React.DragEvent, shift: ShiftAssignment) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const dayNum = format(date, 'd');
  const maxVisible = 3;
  const overflow = shifts.length - maxVisible;

  // During drag: blocked cells get dimmed, valid cells stay bright
  const blocked = isClosed || isDropBlocked;

  return (
    <div
      className={cn(
        'relative flex flex-col border-b border-r border-border/50 min-h-[100px] md:min-h-[120px] transition-colors',
        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
        // Closed days
        isClosed && isCurrentMonth && 'bg-muted/40 opacity-50 cursor-not-allowed',
        isClosed && !isCurrentMonth && 'bg-muted/50 opacity-30',
        // During drag: valid cells get green border
        isDragging && !blocked && isCurrentMonth && 'ring-2 ring-inset ring-emerald-400/20',
        isDragging && !blocked && isCurrentMonth && isDragOver && 'ring-emerald-500/40 bg-emerald-50/15',
        // During drag: blocked cells dim
        isDragging && blocked && isCurrentMonth && 'opacity-40 cursor-not-allowed',
        isDragging && blocked && isCurrentMonth && isDragOver && 'opacity-60 bg-destructive/5',
        // Normal state
        !isDragging && !isClosed && isToday && 'bg-primary/[0.03]',
        !isDragging && !isClosed && isCurrentMonth && 'cursor-pointer hover:bg-muted/20',
      )}
      onClick={() => !isClosed && isCurrentMonth && onCellClick()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag overlay: blocked = grey cross + text, valid = green hint */}
      {isDragging && isCurrentMonth && blocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          {/* X cross */}
          <svg className="w-10 h-10 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
          <span className="text-[9px] font-semibold text-muted-foreground/60 mt-0.5 uppercase tracking-wide">
            Indisponible
          </span>
        </div>
      )}
      {isDragging && isCurrentMonth && !blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-white/80 bg-emerald-500/25 px-2.5 py-1 rounded-md uppercase tracking-wide">
            Déposer ici
          </span>
        </div>
      )}

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
          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wide truncate max-w-[60px]" title={closedLabel || 'Fermé'}>
            {closedLabel || 'Fermé'}
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
            onDragEnd={onDragEnd}
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
  existingShifts,
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
  existingShifts: ShiftAssignment[];
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

  // Filter out employees already assigned on this day (allow current employee when editing)
  const availableStaff = staff.filter((s) => {
    if (isEditing && s.id === shift.staffId) return true; // keep current assignment
    return !existingShifts.some((es) => es.staffId === s.id);
  });

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
                {availableStaff.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    Tous les employés sont déjà planifiés ce jour
                  </div>
                )}
                {availableStaff.map((s) => (
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

// ─── Day Overview Dialog ─────────────────────────────────────────────────────

function DayOverviewDialog({
  open,
  onOpenChange,
  date,
  shifts,
  staff,
  onAddShift,
  onEditShift,
  onDeleteShift,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  shifts: ShiftAssignment[];
  staff: StaffMember[];
  onAddShift: () => void;
  onEditShift: (shift: ShiftAssignment) => void;
  onDeleteShift: (shift: ShiftAssignment) => void;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sort shifts by start time
  const sorted = [...shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDeleteId(null); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="capitalize">{format(date, 'EEEE d MMMM yyyy', { locale: fr })}</span>
          </DialogTitle>
          <DialogDescription>
            {sorted.length} service{sorted.length !== 1 ? 's' : ''} planifié{sorted.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-2 py-2">
            {sorted.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun service planifié</p>
              </div>
            )}

            {sorted.map((shift) => {
              const staffMember = staff.find((s) => s.id === shift.staffId);
              const isConfirming = confirmDeleteId === shift.id;

              return (
                <div
                  key={shift.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors group"
                >
                  {/* Avatar */}
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ backgroundColor: shift.color }}
                    >
                      {shift.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{shift.name}</span>
                      {shift.position && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {shift.position}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{fmtTime(shift.startTime)} — {fmtTime(shift.endTime)}</span>
                    </div>
                  </div>

                  {/* Actions — always visible (touch-friendly) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isConfirming ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            onDeleteShift(shift);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEditShift(shift)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDeleteId(shift.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Add button */}
        <div className="border-t pt-3 -mx-6 px-6">
          <Button
            className="w-full"
            size="sm"
            onClick={onAddShift}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter un service
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Legend Bar ─────────────────────────────────────────────────────────

function StaffLegend({ staff, onDragStart, onDragEnd }: { staff: StaffMember[]; onDragStart: (staffId: string) => void; onDragEnd: () => void }) {
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
            onDragStart(s.id);
            e.dataTransfer.setData('text/plain', JSON.stringify({ staffId: s.id, isNew: true }));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onDragEnd={onDragEnd}
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

  // ── TanStack Query: cached, stale-while-revalidate ──
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: employeesRaw } = useEmployees({ active_only: true });
  const { data: presetsRaw } = useShiftPresets();
  const { data: settingsData } = useRestaurantSettings();
  const { data: closingPeriodsRaw } = useClosingPeriods();
  const { data: shiftsRaw } = useShifts({
    start_date: format(monthStart, 'yyyy-MM-dd'),
    end_date: format(monthEnd, 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();
  const shiftQueryKey = shiftKeys.list({
    start_date: format(monthStart, 'yyyy-MM-dd'),
    end_date: format(monthEnd, 'yyyy-MM-dd'),
  });

  // Derived state: employees → StaffMember[]
  const staff = useMemo<StaffMember[]>(() => {
    if (!employeesRaw?.length) return [];
    return employeesRaw.map((emp, i) => employeeToStaffMember(emp, i));
  }, [employeesRaw]);

  // Derived state: presets
  const servicePresets = useMemo<ShiftPreset[]>(() => presetsRaw ?? [], [presetsRaw]);

  // Derived state: opening hours
  const openingHours = useMemo<Record<string, DaySchedule>>(() => {
    return settingsData?.opening_hours ?? {};
  }, [settingsData]);

  // Derived state: shifts grouped by date
  const shifts = useMemo<Record<string, ShiftAssignment[]>>(() => {
    if (!shiftsRaw?.length) return {};
    const shiftMap: Record<string, ShiftAssignment[]> = {};
    shiftsRaw.forEach((apiShift) => {
      const dateKey = apiShift.date || apiShift.scheduled_date || '';
      if (!dateKey) return;
      const staffMember = staff.find((s) => s.id === apiShift.employee_id);
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
    return shiftMap;
  }, [shiftsRaw, staff]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date>(new Date());
  const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
  const [dialogDefaultStaffId, setDialogDefaultStaffId] = useState<string | undefined>();
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingStaffId, setDraggingStaffId] = useState<string | null>(null);

  // Check if a specific employee already has a shift on a given date
  const hasShiftOnDate = useCallback((staffId: string, dateKey: string) => {
    return (shifts[dateKey] || []).some((s) => s.staffId === staffId);
  }, [shifts]);

  // Generate calendar grid (Monday-first)
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

  // Closing periods lookup
  const closingPeriods = useMemo<ClosingPeriod[]>(() => closingPeriodsRaw ?? [], [closingPeriodsRaw]);

  // Check if a date falls within a closing period
  const getClosingPeriod = useCallback((date: Date): ClosingPeriod | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return closingPeriods.find((p) => dateStr >= p.date_from && dateStr <= p.date_to) || null;
  }, [closingPeriods]);

  // Check if a day is closed based on opening hours OR closing periods
  const isClosedDay = useCallback((date: Date) => {
    // Check closing periods first
    if (getClosingPeriod(date)) return true;
    // Then check regular weekly schedule
    const dayKey = JS_DAY_TO_FR_KEY[getDay(date)];
    const daySchedule = openingHours[dayKey];
    if (!daySchedule) return false;
    return !daySchedule.enabled;
  }, [openingHours, getClosingPeriod]);

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
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayShifts = shifts[dateKey] || [];
    setDialogDate(date);

    if (dayShifts.length > 0) {
      // Has shifts → open day overview
      setOverviewOpen(true);
    } else {
      // Empty day → open add dialog directly
      setEditingShift(null);
      setDialogDefaultStaffId(undefined);
      setDialogOpen(true);
    }
  };

  const handleShiftClick = (shift: ShiftAssignment, date: Date) => {
    setEditingShift(shift);
    setDialogDefaultStaffId(undefined);
    setDialogDate(date);
    setDialogOpen(true);
  };

  // Overview → Add new shift
  const handleOverviewAdd = () => {
    setOverviewOpen(false);
    setEditingShift(null);
    setDialogDefaultStaffId(undefined);
    setDialogOpen(true);
  };

  // Overview → Edit existing shift
  const handleOverviewEdit = (shift: ShiftAssignment) => {
    setOverviewOpen(false);
    setEditingShift(shift);
    setDialogDefaultStaffId(undefined);
    setDialogOpen(true);
  };

  // Overview → Delete shift
  const handleOverviewDelete = async (shift: ShiftAssignment) => {
    const snapshot = optimisticUpdate((old) => old.filter((s) => s.id !== shift.id));
    const res = await shiftsApi.delete(shift.id);
    if (!res.success) {
      queryClient.setQueryData<Shift[]>(shiftQueryKey, snapshot);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le service.', variant: 'destructive' });
    }
  };

  // Helper: optimistic update on the raw shift cache
  const optimisticUpdate = (updater: (old: Shift[]) => Shift[]) => {
    const prev = queryClient.getQueryData<Shift[]>(shiftQueryKey) ?? [];
    queryClient.setQueryData<Shift[]>(shiftQueryKey, updater(prev));
    return prev; // snapshot for rollback
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
      // ── Optimistic update ──
      const snapshot = optimisticUpdate((old) =>
        old.map((s) =>
          s.id === editingShift.id
            ? { ...s, employee_id: data.staffId, date: data.date, start_time: data.startTime, end_time: data.endTime, position: staffMember.position }
            : s
        )
      );

      const res = await shiftsApi.update(editingShift.id, {
        employee_id: data.staffId,
        scheduled_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        position: staffMember.position,
      });

      if (!res.success) {
        queryClient.setQueryData<Shift[]>(shiftQueryKey, snapshot);
        toast({ title: 'Erreur', description: 'Impossible de modifier le service.', variant: 'destructive' });
      }
    } else {
      // ── Optimistic create ──
      const tempId = `temp-${++shiftIdCounter}-${Date.now()}`;
      const snapshot = optimisticUpdate((old) => [
        ...old,
        {
          id: tempId,
          employee_id: data.staffId,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          position: staffMember.position,
        } as Shift,
      ]);

      const res = await shiftsApi.create({
        employee_id: data.staffId,
        scheduled_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        position: staffMember.position,
      });

      if (res.success && res.data) {
        // Replace temp ID with real ID
        queryClient.setQueryData<Shift[]>(shiftQueryKey, (old) =>
          (old ?? []).map((s) => (s.id === tempId ? { ...s, id: res.data.id } : s))
        );
      } else {
        queryClient.setQueryData<Shift[]>(shiftQueryKey, snapshot);
        toast({ title: 'Erreur', description: 'Impossible de créer le service.', variant: 'destructive' });
      }
    }
  };

  const handleDelete = async () => {
    if (!editingShift) return;

    // ── Optimistic delete ──
    const snapshot = optimisticUpdate((old) => old.filter((s) => s.id !== editingShift.id));
    setDialogOpen(false);

    const res = await shiftsApi.delete(editingShift.id);
    if (!res.success) {
      queryClient.setQueryData<Shift[]>(shiftQueryKey, snapshot);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le service.', variant: 'destructive' });
    }
  };

  // ── Drag & Drop ──

  const handleDragStart = (
    e: React.DragEvent,
    shift: ShiftAssignment,
    date: Date
  ) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDraggingStaffId(shift.staffId);
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ shiftId: shift.id, sourceDate: dateKey, staffId: shift.staffId })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const blocked = isClosedDay(date) || (draggingStaffId ? hasShiftOnDate(draggingStaffId, dateKey) : false);

    // Always preventDefault so the drop event fires (needed for toast feedback on blocked drops)
    e.preventDefault();
    if (!blocked) {
      e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move';
    }

    if (dragOverDate !== dateKey) {
      setDragOverDate(dateKey);
    }
  };

  // handleDragLeave is a no-op per cell — dragOver on the next cell
  // updates dragOverDate, and handleDragEnd clears everything.
  // We clear dragOverDate only when leaving the entire grid (below).
  const handleDragLeave = () => {};

  const handleDragEnd = () => {
    setDraggingStaffId(null);
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    setDraggingStaffId(null);

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

        // Block if this employee already has a shift on this day
        if (hasShiftOnDate(data.staffId, targetDateKey)) {
          toast({
            title: 'Déjà planifié',
            description: `${staffMember.name} a déjà un service ce jour.`,
            variant: 'destructive',
          });
          return;
        }

        setEditingShift(null);
        setDialogDefaultStaffId(staffMember.id);
        setDialogDate(targetDate);
        setDialogOpen(true);
        return;
      }

      // Handle move from another cell
      const { shiftId, sourceDate, staffId: draggedStaffId } = data;
      if (sourceDate === targetDateKey) return; // Same cell, no-op

      // Block if this employee already has a shift on the target day
      if (draggedStaffId && hasShiftOnDate(draggedStaffId, targetDateKey)) {
        const staffMember = staff.find((s) => s.id === draggedStaffId);
        toast({
          title: 'Déjà planifié',
          description: `${staffMember?.name || 'Cet employé'} a déjà un service ce jour.`,
          variant: 'destructive',
        });
        return;
      }

      // ── Optimistic move ──
      const snapshot = optimisticUpdate((old) =>
        old.map((s) => (s.id === shiftId ? { ...s, date: targetDateKey } : s))
      );

      // Fire API — revert on error
      shiftsApi.update(shiftId, { scheduled_date: targetDateKey }).then((res) => {
        if (!res.success) {
          queryClient.setQueryData<Shift[]>(shiftQueryKey, snapshot);
          toast({ title: 'Erreur', description: 'Impossible de déplacer le service.', variant: 'destructive' });
        }
      });
    } catch {
      // Invalid data, ignore
    }

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
          <StaffLegend
            staff={staff}
            onDragStart={(staffId) => setDraggingStaffId(staffId)}
            onDragEnd={handleDragEnd}
          />
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
      <div
        className="flex-1 overflow-auto"
        onDragLeave={(e) => {
          // Clear dragOverDate only when mouse truly leaves the grid
          const related = e.relatedTarget as Node | null;
          if (!related || !e.currentTarget.contains(related)) {
            setDragOverDate(null);
          }
        }}
      >
        <div className="grid grid-cols-7 min-h-full">
          {calendarDays.map((date, index) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(date, currentDate);
            const dayShifts = shifts[dateKey] || [];

            const closed = isClosedDay(date);
            const closingPeriod = getClosingPeriod(date);
            const dropBlocked = !closed && !!draggingStaffId && hasShiftOnDate(draggingStaffId, dateKey);

            return (
              <CalendarDayCell
                key={index}
                date={date}
                shifts={dayShifts}
                isCurrentMonth={isCurrentMonth}
                isToday={isDateToday(date)}
                isClosed={closed}
                closedLabel={closingPeriod?.name}
                isDragOver={dragOverDate === dateKey}
                isDropBlocked={dropBlocked}
                isDragging={!!draggingStaffId}
                onCellClick={() => handleCellClick(date)}
                onShiftClick={(shift) => handleShiftClick(shift, date)}
                onDragStart={(e, shift) => handleDragStart(e, shift, date)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Shift Dialog ── */}
      {/* Day Overview Dialog */}
      <DayOverviewDialog
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
        date={dialogDate}
        shifts={shifts[format(dialogDate, 'yyyy-MM-dd')] || []}
        staff={staff}
        onAddShift={handleOverviewAdd}
        onEditShift={handleOverviewEdit}
        onDeleteShift={handleOverviewDelete}
      />

      {/* Add/Edit Shift Dialog */}
      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={dialogDate}
        shift={editingShift}
        staff={staff}
        servicePresets={servicePresets}
        defaultStaffId={dialogDefaultStaffId}
        existingShifts={shifts[format(dialogDate, 'yyyy-MM-dd')] || []}
        onSave={handleSave}
        onDelete={editingShift ? handleDelete : undefined}
      />
    </div>
  );
}
