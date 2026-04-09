'use client';

import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { haptic } from '@/lib/haptics';

interface LongPressOptions {
  /** Callback when long-press threshold is reached. */
  onLongPress: () => void;
  /** Callback when a short tap completes (fires on pointerup if long-press didn't trigger). */
  onTap?: () => void;
  /** Milliseconds before long-press fires. Default: 450ms. */
  delay?: number;
  /** Pixels of movement that cancels the press. Default: 10px. */
  moveThreshold?: number;
  /** Disable gesture handling. */
  disabled?: boolean;
}

interface LongPressHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  /** Prevents the browser's native context menu on long-press. */
  onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Tap vs long-press gesture detector with haptic feedback.
 *
 * - Short tap (< `delay` ms, no movement) → fires `onTap`.
 * - Hold (≥ `delay` ms, no movement) → fires `onLongPress` with a medium
 *   haptic pulse so the user knows the gesture was recognised.
 * - Movement beyond `moveThreshold` pixels cancels both.
 *
 * Uses the unified Pointer Events API so it works for touch, mouse, and
 * stylus without duplicate handlers.
 */
export function useLongPress({
  onLongPress,
  onTap,
  delay = 450,
  moveThreshold = 10,
  disabled = false,
}: LongPressOptions): LongPressHandlers {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled) return;
      // Only primary button / primary touch
      if (e.button !== undefined && e.button !== 0) return;
      triggeredRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clear();
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        haptic('medium');
        onLongPress();
      }, delay);
    },
    [disabled, delay, onLongPress, clear],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!startRef.current || timerRef.current === null) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (dx * dx + dy * dy > moveThreshold * moveThreshold) {
        clear();
        startRef.current = null;
      }
    },
    [clear, moveThreshold],
  );

  const onPointerUp = useCallback(
    (_e: ReactPointerEvent) => {
      clear();
      if (!triggeredRef.current && startRef.current && onTap) {
        onTap();
      }
      startRef.current = null;
      triggeredRef.current = false;
    },
    [clear, onTap],
  );

  const onPointerCancel = useCallback(() => {
    clear();
    startRef.current = null;
    triggeredRef.current = false;
  }, [clear]);

  const onPointerLeave = useCallback(() => {
    clear();
    startRef.current = null;
  }, [clear]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    // Suppress native long-press menu (images, links) so ours wins.
    if (triggeredRef.current) {
      e.preventDefault();
    }
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerCancel,
    onPointerLeave,
    onContextMenu,
  };
}
