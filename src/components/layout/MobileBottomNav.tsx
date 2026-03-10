'use client';

import { usePathname } from 'next/navigation';
import { Calendar, Users, BarChart3, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const TABS = [
  { id: 'planning', label: 'Planning', icon: Calendar, href: '/', ownerOnly: false },
  { id: 'staff', label: 'Personnel', icon: Users, href: '/staff', ownerOnly: true },
  { id: 'analytics', label: 'Stats', icon: BarChart3, href: '/analytics', ownerOnly: true },
  { id: 'notifications', label: 'Notifs', icon: Bell, href: '/notifications', ownerOnly: false },
  { id: 'settings', label: 'Param.', icon: Settings, href: '/settings', ownerOnly: false },
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

  const visibleTabs = TABS.filter(
    (tab) => !tab.ownerOnly || user?.role === 'owner' || user?.role === 'admin',
  );

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-14">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <a
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {tab.id === 'notifications' && (unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
