'use client';

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeNavigation(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 80,
): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // Only trigger if horizontal movement exceeds threshold and is more horizontal than vertical
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
