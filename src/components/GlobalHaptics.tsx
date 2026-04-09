'use client';

import { useEffect } from 'react';
import { haptic, type HapticPreset } from '@/lib/haptics';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * Mount once (at the root) to give every interactive element a subtle
 * haptic tick on press. Only active on mobile — desktop users don't need
 * (and can't feel) it.
 *
 * Per-element overrides: add `data-haptic="success"` (or any preset name)
 * on a button/link to change the tick, or `data-haptic="off"` to disable.
 * Destructive buttons (`data-variant="destructive"`) automatically get a
 * stronger `medium` tick.
 *
 * Uses a capture-phase pointerdown listener so it fires before the
 * element's own handler — feedback feels instant.
 */
export function GlobalHaptics() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const hit = target.closest<HTMLElement>(
        'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], input[type="checkbox"], input[type="radio"], label[for]',
      );
      if (!hit) return;
      if (hit.hasAttribute('disabled') || hit.getAttribute('aria-disabled') === 'true') return;

      const override = hit.dataset.haptic as HapticPreset | 'off' | undefined;
      if (override === 'off') return;

      if (override) {
        haptic(override);
        return;
      }

      // Destructive buttons get a stronger press
      if (
        hit.dataset.variant === 'destructive' ||
        hit.getAttribute('data-destructive') === 'true' ||
        hit.classList.contains('text-destructive')
      ) {
        haptic('medium');
        return;
      }

      // Default: subtle tick
      haptic('selection');
    };

    document.addEventListener('pointerdown', handler, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', handler, { capture: true } as EventListenerOptions);
    };
  }, [isMobile]);

  return null;
}
