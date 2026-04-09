'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, isSameDay, addDays, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from 'ada-design-system';
import { cn } from '@/lib/utils';
import { fmtTime, timeToMinutes } from './types';
import type { ShiftAssignment } from './types';
import { haptic } from '@/lib/haptics';

interface NextServiceHeroProps {
  shifts: Record<string, ShiftAssignment[]>;
  /** Fired when the user taps the hero card (e.g. jump to that day). */
  onOpen: (date: Date, shift: ShiftAssignment) => void;
}

interface NextMatch {
  shift: ShiftAssignment;
  date: Date;
  startMinutes: number;
  dayOffset: number; // 0 = today, 1 = tomorrow, etc.
  inProgress: boolean;
  startsInMinutes: number;
}

/** Find the next active or upcoming service within the next 7 days. */
function findNextService(
  shifts: Record<string, ShiftAssignment[]>,
  now: Date,
): NextMatch | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(now, offset);
    const key = format(date, 'yyyy-MM-dd');
    const dayShifts = (shifts[key] || [])
      .filter((s) => s.status !== 'declined')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const shift of dayShifts) {
      const start = timeToMinutes(shift.startTime);
      let end = timeToMinutes(shift.endTime);
      if (end <= start) end += 24 * 60;

      if (offset === 0) {
        // Still in progress
        if (nowMin >= start && nowMin < end) {
          return {
            shift,
            date,
            startMinutes: start,
            dayOffset: 0,
            inProgress: true,
            startsInMinutes: 0,
          };
        }
        // Upcoming today
        if (start > nowMin) {
          return {
            shift,
            date,
            startMinutes: start,
            dayOffset: 0,
            inProgress: false,
            startsInMinutes: start - nowMin,
          };
        }
      } else {
        // First shift on a future day
        return {
          shift,
          date,
          startMinutes: start,
          dayOffset: offset,
          inProgress: false,
          startsInMinutes: offset * 24 * 60 + start - nowMin,
        };
      }
    }
  }

  return null;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'maintenant';
  if (minutes < 60) return `dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) {
    return rest === 0 ? `dans ${hours} h` : `dans ${hours} h ${rest}`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'demain' : `dans ${days} jours`;
}

export function NextServiceHero({ shifts, onOpen }: NextServiceHeroProps) {
  // Live clock — re-evaluates the "next" match every minute
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const next = useMemo(() => findNextService(shifts, now), [shifts, now]);

  if (!next) {
    return (
      <div className="mx-3 mt-3 mb-1 rounded-2xl border border-dashed border-border/70 bg-white/60 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-muted-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            Prochain service
          </p>
          <p className="text-sm font-semibold text-foreground/80">Aucun à venir cette semaine</p>
        </div>
      </div>
    );
  }

  const { shift, date, inProgress, startsInMinutes, dayOffset } = next;
  const isToday = dayOffset === 0;
  const isTomorrow = dayOffset === 1;

  // Progress bar for in-progress shifts
  const progressPct = (() => {
    if (!inProgress) return 0;
    const start = timeToMinutes(shift.startTime);
    let end = timeToMinutes(shift.endTime);
    if (end <= start) end += 24 * 60;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100));
  })();

  const dayLabel = isToday
    ? "Aujourd'hui"
    : isTomorrow
      ? 'Demain'
      : format(date, 'EEE d MMM', { locale: fr });

  return (
    <button
      onClick={() => {
        haptic('light');
        onOpen(date, shift);
      }}
      className={cn(
        'mx-3 mt-3 mb-1 rounded-2xl overflow-hidden relative block w-[calc(100%-1.5rem)] text-left touch-feedback active:scale-[0.985] transition-transform',
        'bg-gradient-to-br from-primary to-primary/80 shadow-[0_8px_24px_-8px_rgba(77,106,255,0.5)]',
      )}
    >
      {/* Decorative gloss */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-16 -right-8 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative px-4 py-3.5 text-white">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/80 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {inProgress ? 'Service en cours' : 'Prochain service'}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-white/90 tabular-nums">
            {dayLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-white/50 shadow-lg shrink-0">
            <AvatarFallback
              className="text-sm font-bold text-white"
              style={{ backgroundColor: shift.color }}
            >
              {shift.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate leading-tight">{shift.name}</p>
            <p className="text-[12px] text-white/80 tabular-nums mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
              {shift.position && (
                <>
                  <span className="text-white/50">·</span>
                  <span className="font-medium">{shift.position}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">
              {inProgress ? 'En cours' : 'Démarre'}
            </span>
            <span className="text-xs font-bold text-white tabular-nums">
              {inProgress ? `${Math.round(progressPct)}%` : formatCountdown(startsInMinutes)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-white/70 mt-0.5" />
          </div>
        </div>

        {/* In-progress progress bar */}
        {inProgress && (
          <div className="mt-3 h-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
}
