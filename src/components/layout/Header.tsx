'use client';

import { Bell, Settings, User, Calendar, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Header() {
  const currentDate = new Date();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Current date and navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-gray-900">
              AdaPlanning
            </span>
          </div>
          
          <div className="hidden md:block text-sm text-gray-500">
            {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Center section - Quick actions */}
        <div className="flex items-center space-x-2">
          <button className="ada-button-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filtrer</span>
          </button>
          
          <button className="ada-button-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Right section - User actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors touch-feedback">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors touch-feedback">
            <Settings className="w-5 h-5" />
          </button>

          {/* User profile */}
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                J
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-gray-900">Jessica Bombini</div>
                <div className="text-xs text-gray-500">L'Osteria Deerlijk</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile date display */}
      <div className="md:hidden mt-2 text-sm text-gray-500">
        {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
      </div>
    </header>
  );
}