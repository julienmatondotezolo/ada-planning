'use client';

import { cn } from '@/lib/utils';
import type { ShiftAssignment } from './types';

interface MobileMonthCellProps {
  date: Date;
  shifts: ShiftAssignment[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isClosed: boolean;
  isExclusiveOpening: boolean;
  onClick: () => void;
}

const MAX_DOTS = 5;

export function MobileMonthCell({
  date,
  shifts,
  isCurrentMonth,
  isToday,
  isClosed,
  isExclusiveOpening,
  onClick,
}: MobileMonthCellProps) {
  // Collect unique colors from shifts (one dot per staff color)
  const dotColors: string[] = [];
  const seen = new Set<string>();
  for (const s of shifts) {
    if (!seen.has(s.staffId)) {
      seen.add(s.staffId);
      dotColors.push(s.color);
      if (dotColors.length >= MAX_DOTS) break;
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-start min-h-[52px] py-1.5 border-r border-b border-border/30 transition-colors touch-feedback',
        !isCurrentMonth && 'opacity-30',
        isClosed && 'bg-muted/40',
        isExclusiveOpening && !isClosed && 'bg-green-50/50',
      )}
    >
      <span
        className={cn(
          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
          isToday && 'bg-primary text-primary-foreground font-bold',
          isClosed && !isToday && 'text-muted-foreground/50',
        )}
      >
        {date.getDate()}
      </span>

      {dotColors.length > 0 && (
        <div className="flex items-center gap-0.5 mt-1">
          {dotColors.map((color, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
