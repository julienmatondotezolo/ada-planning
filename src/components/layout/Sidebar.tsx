'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Clock,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Phone,
  UtensilsCrossed,
  Package,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaLogo } from 'ada-design-system';
import { useAuth } from '@/contexts/AuthContext';

const NAVIGATION_ITEMS = [
  {
    id: 'calendar',
    label: 'Calendrier',
    icon: Calendar,
    href: '/',
  },
  {
    id: 'staff',
    label: 'Personnel',
    icon: Users,
    href: '/staff',
  },
  {
    id: 'schedules',
    label: 'Horaires',
    icon: Clock,
    href: '/schedules',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    href: '/settings',
  },
];

const ADA_APPS = [
  { id: 'menu', label: 'AdaMenu', icon: UtensilsCrossed, href: 'https://ada.mindgen.app', color: '#ef4444' },
  { id: 'stock', label: 'AdaStock', icon: Package, href: 'https://adastock.mindgen.app', color: '#f59e0b' },
  { id: 'kds', label: 'AdaKDS', icon: Monitor, href: 'https://adakds.mindgen.app', color: '#10b981' },
  { id: 'phone', label: 'AdaPhone', icon: Phone, href: 'https://adaphone.mindgen.app', color: '#8b5cf6' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  // Auto-collapse on small tablets
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setCollapsed(true);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout failed:', e); }
  };

  return (
    <div
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center border-b border-gray-200 h-14 shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <AdaLogo size="sm" variant="primary" className="shrink-0" />
            <span className="font-semibold text-gray-900 text-sm truncate">AdaPlanning</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        >
          {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg transition-colors',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn('shrink-0', active ? 'text-blue-600' : 'text-gray-400', collapsed ? 'w-5 h-5' : 'w-5 h-5')} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className={cn('my-3 border-t border-gray-100', collapsed ? 'mx-2' : 'mx-1')} />

        {/* ADA Apps section */}
        {!collapsed && (
          <button
            onClick={() => setShowApps(!showApps)}
            className="flex items-center justify-between w-full px-3 py-1.5 mb-1"
          >
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ADA Apps</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', showApps && 'rotate-180')} />
          </button>
        )}

        {(showApps || collapsed) && (
          <ul className="space-y-1">
            {ADA_APPS.map((app) => (
              <li key={app.id}>
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  )}
                  title={collapsed ? app.label : undefined}
                >
                  <app.icon className="w-4.5 h-4.5 shrink-0" style={{ color: app.color }} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{app.label}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full',
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
          )}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}
