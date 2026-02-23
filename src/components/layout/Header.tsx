'use client';

import { Bell, Settings, User, Calendar, Download, Filter, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { AdaLogo, Button, Avatar, AvatarFallback } from '@/components/ui';

export function Header() {
  const currentDate = new Date();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setShowUserMenu(false);
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const first = user.first_name || user.email?.charAt(0) || '';
    const last = user.last_name || '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    return user.email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Current date and navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <AdaLogo size="md" variant="primary" />
            <div>
              <span className="text-lg font-semibold text-foreground">AdaPlanning</span>
              <div className="text-xs text-muted-foreground">Staff Scheduling</div>
            </div>
          </div>
          
          <div className="hidden md:block text-sm text-muted-foreground">
            {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Center section - Quick actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Right section - User actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          {/* User profile */}
          <div ref={userMenuRef} className="relative flex items-center space-x-3 pl-3 border-l border-border">
            <button 
              className="flex items-center space-x-2 hover:bg-accent rounded-md p-1 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-foreground">{getUserDisplayName(user)}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role || 'Staff'} • L'Osteria Deerlijk</div>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-popover rounded-md shadow-lg border border-border z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <div className="text-sm font-medium text-popover-foreground">{getUserDisplayName(user)}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  
                  <div className="border-t border-border">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile date display */}
      <div className="md:hidden mt-2 text-sm text-muted-foreground">
        {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
      </div>
    </header>
  );
}