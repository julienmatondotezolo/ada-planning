'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Building2, 
  Users, 
  Clock, 
  Bell, 
  Palette,
  Globe,
  Database,
  Save,
  AlertCircle
} from 'lucide-react';

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
}

interface SystemSettings {
  notification_enabled: boolean;
  email_notifications: boolean;
  auto_publish_schedules: boolean;
  default_shift_duration: number;
  break_duration: number;
  overtime_threshold: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('restaurant');
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: "L'Osteria Deerlijk",
    address: "Stationsstraat 232, 8540 Deerlijk",
    phone: "+32 (0) 56 25 63 83",
    email: "info@losteria.be",
    timezone: "Europe/Brussels",
    currency: "EUR"
  });
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    notification_enabled: true,
    email_notifications: true,
    auto_publish_schedules: false,
    default_shift_duration: 8,
    break_duration: 30,
    overtime_threshold: 40
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'restaurant', label: 'Restaurant', icon: Building2 },
    { id: 'scheduling', label: 'Planification', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'staff', label: 'Personnel', icon: Users },
    { id: 'system', label: 'Système', icon: Settings },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderRestaurantSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informations du Restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du restaurant
              </label>
              <input
                type="text"
                value={restaurantSettings.name}
                onChange={(e) => setRestaurantSettings({...restaurantSettings, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={restaurantSettings.phone}
                onChange={(e) => setRestaurantSettings({...restaurantSettings, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={restaurantSettings.address}
                onChange={(e) => setRestaurantSettings({...restaurantSettings, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={restaurantSettings.email}
                onChange={(e) => setRestaurantSettings({...restaurantSettings, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuseau horaire
              </label>
              <select
                value={restaurantSettings.timezone}
                onChange={(e) => setRestaurantSettings({...restaurantSettings, timezone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Europe/Brussels">Europe/Brussels</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSchedulingSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Paramètres de Planification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée de shift par défaut (heures)
              </label>
              <input
                type="number"
                value={systemSettings.default_shift_duration}
                onChange={(e) => setSystemSettings({...systemSettings, default_shift_duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée de pause (minutes)
              </label>
              <input
                type="number"
                value={systemSettings.break_duration}
                onChange={(e) => setSystemSettings({...systemSettings, break_duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="15"
                max="60"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil heures supplémentaires
              </label>
              <input
                type="number"
                value={systemSettings.overtime_threshold}
                onChange={(e) => setSystemSettings({...systemSettings, overtime_threshold: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="35"
                max="50"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={systemSettings.auto_publish_schedules}
                onChange={(e) => setSystemSettings({...systemSettings, auto_publish_schedules: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Publier automatiquement les plannings chaque vendredi
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Les plannings seront automatiquement envoyés au personnel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={systemSettings.notification_enabled}
                onChange={(e) => setSystemSettings({...systemSettings, notification_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Activer les notifications push
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={systemSettings.email_notifications}
                onChange={(e) => setSystemSettings({...systemSettings, email_notifications: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Notifications par email
              </span>
            </label>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Types de notifications envoyées
                </h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Nouveaux plannings publiés</li>
                  <li>• Changements de shifts</li>
                  <li>• Demandes de congés</li>
                  <li>• Rappels de shifts</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStaffSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Paramètres Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">
                  Gestion du Personnel
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Pour ajouter, modifier ou supprimer des membres du personnel, 
                  utilisez la page dédiée "Personnel".
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/staff'}
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Aller à la gestion du personnel</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Informations Système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Version:</span>
                <span>AdaPlanning v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">API Status:</span>
                <span className="text-green-600">✓ Connecté</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Dernière sauvegarde:</span>
                <span>{new Date().toLocaleDateString('fr-BE')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Base de données:</span>
                <span className="text-green-600">✓ Opérationnelle</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Personnel actif:</span>
                <span>4 membres</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Plannings:</span>
                <span>0 en cours</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Settings Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-600">Configuration du système</p>
          </div>
          
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl">
            {activeTab === 'restaurant' && renderRestaurantSettings()}
            {activeTab === 'scheduling' && renderSchedulingSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'staff' && renderStaffSettings()}
            {activeTab === 'system' && renderSystemSettings()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  {saved && (
                    <div className="flex items-center text-green-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Paramètres sauvegardés avec succès
                    </div>
                  )}
                </div>
                
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}