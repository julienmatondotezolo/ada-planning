/**
 * Haptic feedback helper — thin wrapper around `web-haptics`.
 *
 * Safe in SSR (no-ops on server) and silent on unsupported browsers.
 * The library falls back to Vibration API + optional audio cue when
 * available; on iOS PWAs installed to the home screen, the Vibration API
 * is supported on recent iOS versions.
 *
 * Usage:
 *   import { haptic } from '@/lib/haptics';
 *   haptic('light');     // tap feedback
 *   haptic('selection'); // subtle tick for nav / toggles
 *   haptic('success');   // action confirmed
 *   haptic('error');     // destructive or failed action
 */

import type { WebHaptics as WebHapticsType } from 'web-haptics';

export type HapticPreset =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'soft'
  | 'rigid'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'
  | 'nudge';

let instance: WebHapticsType | null = null;
let loading: Promise<WebHapticsType | null> | null = null;

function getInstance(): Promise<WebHapticsType | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (instance) return Promise.resolve(instance);
  if (loading) return loading;
  loading = import('web-haptics')
    .then(({ WebHaptics }) => {
      instance = new WebHaptics({ debug: false });
      return instance;
    })
    .catch(() => null);
  return loading;
}

/**
 * Trigger a haptic preset. Fire-and-forget — never throws, never blocks.
 * Safe to call from event handlers; failures are swallowed silently so
 * unsupported devices simply get nothing.
 */
export function haptic(preset: HapticPreset = 'light'): void {
  if (typeof window === 'undefined') return;
  void getInstance().then((h) => {
    if (!h) return;
    try {
      void h.trigger(preset);
    } catch {
      /* ignore */
    }
  });
}
