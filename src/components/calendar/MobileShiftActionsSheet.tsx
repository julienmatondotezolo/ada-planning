'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Copy, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback } from 'ada-design-system';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { fmtTime } from './types';
import type { ShiftAssignment } from './types';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface MobileShiftActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftAssignment | null;
  date: Date;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  tone?: 'default' | 'destructive';
}

function ActionRow({ icon, label, sublabel, onClick, tone = 'default' }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 w-full px-5 py-4 text-left touch-feedback active:bg-muted/60 transition-colors',
        tone === 'destructive' && 'text-rose-600',
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
          tone === 'destructive' ? 'bg-rose-50' : 'bg-primary/10',
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-tight">{label}</p>
        {sublabel && (
          <p
            className={cn(
              'text-[11px] mt-0.5',
              tone === 'destructive' ? 'text-rose-400' : 'text-muted-foreground',
            )}
          >
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

export function MobileShiftActionsSheet({
  open,
  onOpenChange,
  shift,
  date,
  onEdit,
  onDuplicate,
  onDelete,
}: MobileShiftActionsSheetProps) {
  if (!shift) return null;

  const handleEdit = () => {
    haptic('light');
    onOpenChange(false);
    onEdit();
  };

  const handleDuplicate = () => {
    haptic('success');
    onOpenChange(false);
    onDuplicate();
  };

  const handleDelete = () => {
    haptic('error');
    onOpenChange(false);
    onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-h-[80vh]">
        {/* Visually hidden title for a11y */}
        <DialogTitle className="sr-only">Actions pour le service</DialogTitle>
        <DialogDescription className="sr-only">
          Modifier, dupliquer ou supprimer ce service
        </DialogDescription>

        {/* Shift summary header */}
        <div className="flex items-center gap-3 px-5 pt-2 pb-4 border-b border-border/60">
          <Avatar className="w-12 h-12 shrink-0 ring-2 ring-white shadow-sm">
            <AvatarFallback
              className="text-sm font-bold text-white"
              style={{ backgroundColor: shift.color }}
            >
              {shift.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate leading-tight">
              {shift.name}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize tabular-nums mt-0.5">
              {format(date, 'EEEE d MMMM', { locale: fr })}
              <span className="mx-1 text-border">·</span>
              {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
            </p>
            {shift.position && (
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80 mt-0.5">
                {shift.position}
              </p>
            )}
          </div>
        </div>

        {/* Action rows */}
        <div className="py-1">
          <ActionRow
            icon={<Pencil className="w-5 h-5 text-primary" />}
            label="Modifier"
            sublabel="Horaires, employé, position"
            onClick={handleEdit}
          />
          <ActionRow
            icon={<Copy className="w-5 h-5 text-primary" />}
            label="Dupliquer au jour suivant"
            sublabel="Même employé, même horaires"
            onClick={handleDuplicate}
          />
          <div className="h-px bg-border/60 mx-5 my-1" />
          <ActionRow
            icon={<Trash2 className="w-5 h-5 text-rose-600" />}
            label="Supprimer"
            sublabel="Cette action est immédiate"
            onClick={handleDelete}
            tone="destructive"
          />
        </div>

        {/* Cancel */}
        <div className="px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <button
            onClick={() => {
              haptic('selection');
              onOpenChange(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-muted/70 text-foreground font-semibold text-sm touch-feedback active:scale-[0.98] transition-transform"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
