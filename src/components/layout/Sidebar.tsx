'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaLogo, Avatar, AvatarFallback } from 'ada-design-system';
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout failed:', e); }
    setShowUserMenu(false);
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const first = user.first_name || user.email?.charAt(0) || '';
    const last = user.last_name || '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.email?.split('@')[0] || 'User';
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

      {/* User profile */}
      <div ref={userMenuRef} className={cn(
        'border-b border-gray-200 relative',
        collapsed ? 'px-2 py-3' : 'px-3 py-3'
      )}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn(
            'flex items-center rounded-lg hover:bg-gray-50 transition-colors w-full',
            collapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-1.5'
          )}
          title={collapsed ? getUserDisplayName(user) : undefined}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{getUserDisplayName(user)}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          )}
        </button>

        {/* User dropdown */}
        {showUserMenu && (
          <div className={cn(
            'absolute z-50 bg-white rounded-md shadow-lg border border-gray-200',
            collapsed ? 'left-full top-0 ml-2 w-48' : 'left-3 right-3 top-full mt-1'
          )}>
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className={cn('border-b border-gray-200', collapsed ? 'px-2 py-2' : 'px-2 py-2')}>
        <a
          href="/notifications"
          className={cn(
            'flex items-center rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors relative',
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          )}
          title={collapsed ? 'Notifications' : undefined}
        >
          <div className="relative shrink-0">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Notifications</span>}
        </a>
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
                  <item.icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-600' : 'text-gray-400')} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
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
