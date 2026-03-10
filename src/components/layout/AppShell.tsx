'use client';

import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Shared layout wrapper — Sidebar + main content area.
 * Use this on every page so the sidebar is always visible.
 */
export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {!isMobile && <Sidebar />}
      <main className={`flex-1 overflow-hidden flex flex-col ${isMobile ? 'pb-14' : ''}`}>
        {children}
      </main>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
