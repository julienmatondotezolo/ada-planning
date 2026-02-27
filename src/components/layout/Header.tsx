'use client';

import { Bell, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Button, Avatar, AvatarFallback } from 'ada-design-system';

export function Header() {
  const currentDate = new Date();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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
    <header className="bg-background border-b border-border px-4 py-2 shrink-0">
      <div className="flex items-center justify-between h-10">
        {/* Left — date */}
        <div className="text-sm text-muted-foreground capitalize">
          {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>

        {/* Right — notifications + user */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
          </Button>

          <div ref={userMenuRef} className="relative">
            <button 
              className="flex items-center gap-2 hover:bg-accent rounded-md p-1 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-foreground">
                {getUserDisplayName(user)}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-popover rounded-md shadow-lg border border-border z-50">
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-sm font-medium text-popover-foreground">{getUserDisplayName(user)}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
