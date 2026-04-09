'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, BarChart3, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type Role = 'admin' | 'owner' | 'manager' | 'staff';

interface Tab {
  id: string;
  label: string;
  icon: typeof Calendar;
  href: string;
  /** Roles allowed to see this tab. */
  roles: Role[];
}

const ALL_ROLES: Role[] = ['admin', 'owner', 'manager', 'staff'];
const MANAGE_ROLES: Role[] = ['admin', 'owner', 'manager'];
const OWNER_ROLES: Role[] = ['admin', 'owner'];

const TABS: Tab[] = [
  { id: 'planning',      label: 'Planning',  icon: Calendar,   href: '/',              roles: ALL_ROLES },
  { id: 'staff',         label: 'Personnel', icon: Users,      href: '/staff',         roles: MANAGE_ROLES },
  { id: 'analytics',     label: 'Stats',     icon: BarChart3,  href: '/analytics',     roles: OWNER_ROLES },
  { id: 'notifications', label: 'Notifs',    icon: Bell,       href: '/notifications', roles: ALL_ROLES },
  { id: 'settings',      label: 'Réglages',  icon: Settings,   href: '/settings',      roles: ALL_ROLES },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: unreadCount } = useQuery<number>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const res = await apiFetch<{ unread_count: number; count?: number }>('notifications/unread-count');
      return res.success ? (res.data.unread_count ?? res.data.count ?? 0) : 0;
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const role = user?.role as Role | undefined;
  const visibleTabs = TABS.filter((tab) => role && tab.roles.includes(role));

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-white/90 backdrop-blur-xl pb-safe shadow-[0_-1px_12px_rgba(15,23,42,0.04)]"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch justify-around h-[60px] px-1">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          const showBadge = tab.id === 'notifications' && (unreadCount ?? 0) > 0;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className={cn(
                'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1.5 transition-all duration-200 touch-feedback active:scale-95',
                active && 'bg-primary/8',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-6 h-6 transition-transform duration-200',
                  active && 'scale-110',
                )}
              >
                <tab.icon
                  className={cn(
                    'w-[22px] h-[22px] transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground/70',
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white tabular-nums">
                    {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-tight transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground/70',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
