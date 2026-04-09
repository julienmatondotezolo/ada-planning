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

const MAX_DOTS = 4;

export function MobileMonthCell({
  date,
  shifts,
  isCurrentMonth,
  isToday,
  isClosed,
  isExclusiveOpening,
  onClick,
}: MobileMonthCellProps) {
  // Unique colors per staff (one dot per employee scheduled)
  const dotColors: string[] = [];
  const seen = new Set<string>();
  for (const s of shifts) {
    if (s.status === 'declined') continue;
    if (!seen.has(s.staffId)) {
      seen.add(s.staffId);
      dotColors.push(s.color);
    }
  }
  const overflow = Math.max(0, dotColors.length - MAX_DOTS);
  const visibleDots = dotColors.slice(0, MAX_DOTS);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-start min-h-[58px] py-1.5 border-r border-b border-border/30 transition-colors touch-feedback active:bg-muted/40',
        !isCurrentMonth && 'opacity-30',
        isClosed && 'bg-muted/30',
        isExclusiveOpening && !isClosed && 'bg-emerald-50/60',
      )}
    >
      <span
        className={cn(
          'text-[13px] font-semibold tabular-nums w-7 h-7 flex items-center justify-center rounded-full transition-colors',
          isToday && 'bg-primary text-primary-foreground font-bold shadow-sm',
          isClosed && !isToday && 'text-muted-foreground/50',
          !isToday && !isClosed && 'text-foreground',
        )}
      >
        {date.getDate()}
      </span>

      {visibleDots.length > 0 && (
        <div className="flex items-center gap-[2px] mt-1">
          {visibleDots.map((color, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full ring-[1px] ring-white"
              style={{ backgroundColor: color }}
            />
          ))}
          {overflow > 0 && (
            <span className="ml-0.5 text-[8px] font-bold text-muted-foreground tabular-nums leading-none">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {isExclusiveOpening && !isClosed && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
    </button>
  );
}
