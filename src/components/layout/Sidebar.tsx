'use client';

import { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Plus, 
  Clock,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, AdaLogo } from 'ada-design-system';

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: BarChart3,
    href: '/',
  },
  {
    id: 'calendar',
    label: 'Calendrier',
    icon: Calendar,
    href: '/calendar',
    active: true,
  },
  {
    id: 'staff',
    label: 'Personnel',
    icon: Users,
    href: '/staff',
    children: [
      { id: 'all-staff', label: 'Tout le Personnel', href: '/staff' },
      { id: 'add-staff', label: 'Ajouter Personnel', href: '/staff/add' },
      { id: 'positions', label: 'Postes', href: '/staff/positions' },
    ],
  },
  {
    id: 'schedules',
    label: 'Horaires',
    icon: Clock,
    href: '/schedules',
    children: [
      { id: 'current', label: 'Planning Actuel', href: '/schedules/current' },
      { id: 'templates', label: 'Modèles', href: '/schedules/templates' },
      { id: 'history', label: 'Historique', href: '/schedules/history' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    href: '/settings',
  },
];

// Mock staff data for quick actions
const STAFF_QUICK_ACCESS = [
  { id: '1', name: 'José', color: '#ef4444', position: 'Serveur Principal' },
  { id: '2', name: 'Angélys', color: '#8b5cf6', position: 'Serveuse' },
  { id: '3', name: 'Mélia', color: '#10b981', position: 'Cuisinière' },
  { id: '4', name: 'Lino', color: '#f59e0b', position: 'Aide Cuisinier' },
  { id: '5', name: 'Lucas', color: '#3b82f6', position: 'Serveur (Étudiant)' },
];

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['staff', 'schedules']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <AdaLogo size="lg" variant="primary" />
          <div>
            <div className="font-semibold text-gray-900">AdaPlanning</div>
            <div className="text-xs text-gray-500">Staff Scheduling</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-2 px-4">
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item.id}>
              {/* Main navigation item */}
              <div className="flex items-center">
                <a
                  href={item.href}
                  className={cn(
                    'flex-1 flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    {
                      'bg-blue-600 text-white': item.active,
                      'text-gray-700 hover:bg-gray-100': !item.active,
                    }
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
                
                {/* Expand/collapse button for items with children */}
                {item.children && (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedItems.includes(item.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub-navigation items */}
              {item.children && expandedItems.includes(item.id) && (
                <ul className="mt-2 ml-8 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <a
                        href={child.href}
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Staff Quick Access */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Personnel Actif</h3>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {STAFF_QUICK_ACCESS.slice(0, 4).map((staff) => (
            <div
              key={staff.id}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: staff.color }}
              >
                {staff.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {staff.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {staff.position}
                </div>
              </div>
            </div>
          ))}
          
          {STAFF_QUICK_ACCESS.length > 4 && (
            <button className="w-full text-left px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              +{STAFF_QUICK_ACCESS.length - 4} autres...
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <Button className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Affectation
        </Button>
        
        <Button variant="outline" className="w-full" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Voir Planning
        </Button>
      </div>
    </div>
  );
}