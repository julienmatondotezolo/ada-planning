'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StaffMember } from './types';

interface MobileStaffChipsProps {
  staff: StaffMember[];
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
}

export function MobileStaffChips({ staff, selectedStaffId, onSelect }: MobileStaffChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1">
      {staff.map((s) => {
        const isSelected = selectedStaffId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(isSelected ? null : s.id)}
            className={cn(
              'flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full transition-all border-2 touch-feedback',
              isSelected
                ? 'text-white shadow-md'
                : 'bg-white',
            )}
            style={{
              borderColor: s.color,
              backgroundColor: isSelected ? s.color : `${s.color}15`,
            }}
          >
            {isSelected && <Check className="w-3 h-3" />}
            <div
              className={cn('w-2.5 h-2.5 rounded-full shrink-0', isSelected && 'hidden')}
              style={{ backgroundColor: s.color }}
            />
            <span
              className="text-xs font-semibold whitespace-nowrap"
              style={{ color: isSelected ? 'white' : s.color }}
            >
              {s.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
