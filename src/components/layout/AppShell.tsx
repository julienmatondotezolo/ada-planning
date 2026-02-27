'use client';

import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Shared layout wrapper — Sidebar + main content area.
 * Use this on every page so the sidebar is always visible.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
