'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isAtTop() && !refreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && isAtTop()) {
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistance >= THRESHOLD) {
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing, isAtTop]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-opacity duration-200"
        style={{
          top: Math.max(pullDistance - 50, -50),
          opacity: progress,
        }}
      >
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2.5">
          <RefreshCw
            className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`}
            style={!refreshing ? { transform: `rotate(${rotation}deg)` } : undefined}
          />
        </div>
      </div>
      {children}
    </>
  );
}
