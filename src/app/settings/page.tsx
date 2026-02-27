'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings, useMyRestaurant, useUpdateSettings } from '@/hooks/useSettings';
import { useShiftPresets, useCreateShiftPreset, useUpdateShiftPreset, useDeleteShiftPreset } from '@/hooks/useShiftPresets';
import type { RestaurantSettings, ShiftPreset, ShiftTimeRange } from '@/lib/api';
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  Bell,
  Plus,
  Trash2,
  Save,
  User,
  Shield,
  Pencil,
  X,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarFallback,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ada-design-system';

type SettingsTab = 'restaurant' | 'shifts' | 'notifications' | 'account';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'restaurant', label: 'Restaurant', icon: Building },
  { id: 'shifts', label: 'Services', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Mon compte', icon: User },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('restaurant');
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Paramètres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configuration du système et préférences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings nav */}
          <nav className="lg:w-[200px] shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'restaurant' && <RestaurantSettings userRole={user?.role} />}
            {activeTab === 'shifts' && <ShiftPresetsSettings userRole={user?.role} />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'account' && <AccountSettings user={user} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Restaurant Settings ---------- */
function RestaurantSettings({ userRole }: { userRole?: string }) {
  const isStaff = !userRole || userRole === 'staff';

  const { data: settings, isLoading: settingsLoading } = useRestaurantSettings();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const updateSettings = useUpdateSettings();

  const isLoading = settingsLoading || restaurantLoading;

  const initialInfo = useMemo(() => {
    const saved: Record<string, string> = settings?.restaurant_info || {};
    return {
      name: saved.name || restaurant?.name || '',
      phone: saved.phone || restaurant?.phone || '',
      email: saved.email || restaurant?.email || '',
      address: saved.address || restaurant?.address || '',
      website: saved.website || restaurant?.website || '',
    };
  }, [settings, restaurant]);

  const [infoForm, setInfoForm] = useState<Record<string, string>>({});
  const [infoChanged, setInfoChanged] = useState(false);

  // Merge initial values once loaded (only set if empty)
  const displayInfo = { ...initialInfo, ...infoForm };

  const updateInfoField = (field: string, value: string) => {
    setInfoForm((prev) => ({ ...prev, [field]: value }));
    setInfoChanged(true);
  };

  const handleSaveInfo = () => {
    updateSettings.mutate(
      { restaurant_info: displayInfo },
      { onSuccess: () => setInfoChanged(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isStaff && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Vous avez un accès en lecture seule. Contactez un manager pour modifier les paramètres.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations du restaurant</CardTitle>
          <CardDescription>Détails de votre établissement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={displayInfo.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('name', e.target.value)} disabled={isStaff} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={displayInfo.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('phone', e.target.value)} disabled={isStaff} />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={displayInfo.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('address', e.target.value)} disabled={isStaff} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={displayInfo.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('email', e.target.value)} disabled={isStaff} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input value={displayInfo.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('website', e.target.value)} disabled={isStaff} />
            </div>
          </div>
          {!isStaff && (
            <div className="flex justify-end">
              <Button onClick={handleSaveInfo} disabled={!infoChanged || updateSettings.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <OpeningHoursCard
        initialOpeningHours={settings?.opening_hours}
        isStaff={isStaff}
      />
    </div>
  );
}

/* ---------- Opening Hours Editor ---------- */

interface TimeSlotLocal {
  id: string;
  from: string;
  to: string;
}

interface DayScheduleLocal {
  enabled: boolean;
  slots: TimeSlotLocal[];
}

const DAYS_OF_WEEK = [
  { key: 'lundi', label: 'Lundi', short: 'Lun' },
  { key: 'mardi', label: 'Mardi', short: 'Mar' },
  { key: 'mercredi', label: 'Mercredi', short: 'Mer' },
  { key: 'jeudi', label: 'Jeudi', short: 'Jeu' },
  { key: 'vendredi', label: 'Vendredi', short: 'Ven' },
  { key: 'samedi', label: 'Samedi', short: 'Sam' },
  { key: 'dimanche', label: 'Dimanche', short: 'Dim' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

const DEFAULT_SCHEDULE: Record<string, DayScheduleLocal> = {
  lundi: { enabled: false, slots: [] },
  mardi: { enabled: true, slots: [
    { id: 'mar-1', from: '12:00', to: '14:00' },
    { id: 'mar-2', from: '18:30', to: '21:30' },
  ]},
  mercredi: { enabled: true, slots: [
    { id: 'mer-1', from: '12:00', to: '14:00' },
    { id: 'mer-2', from: '18:30', to: '21:30' },
  ]},
  jeudi: { enabled: true, slots: [
    { id: 'jeu-1', from: '12:00', to: '14:00' },
    { id: 'jeu-2', from: '18:30', to: '21:30' },
  ]},
  vendredi: { enabled: true, slots: [
    { id: 'ven-1', from: '12:00', to: '14:00' },
    { id: 'ven-2', from: '18:30', to: '21:30' },
  ]},
  samedi: { enabled: true, slots: [
    { id: 'sam-1', from: '12:00', to: '14:00' },
    { id: 'sam-2', from: '18:30', to: '21:30' },
  ]},
  dimanche: { enabled: false, slots: [] },
};

function OpeningHoursCard({ initialOpeningHours, isStaff }: { initialOpeningHours?: Record<string, any>; isStaff: boolean }) {
  const updateSettings = useUpdateSettings();

  const [schedule, setSchedule] = useState<Record<string, DayScheduleLocal>>(() => {
    if (initialOpeningHours && Object.keys(initialOpeningHours).length > 0) {
      const converted: Record<string, DayScheduleLocal> = {};
      for (const day of DAYS_OF_WEEK) {
        const apiDay = initialOpeningHours[day.key];
        if (apiDay) {
          converted[day.key] = {
            enabled: apiDay.enabled,
            slots: (apiDay.slots || []).map((s: any, i: number) => ({
              id: `${day.key}-${i}-${Date.now()}`,
              from: s.from,
              to: s.to,
            })),
          };
        } else {
          converted[day.key] = DEFAULT_SCHEDULE[day.key];
        }
      }
      return converted;
    }
    return DEFAULT_SCHEDULE;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const toggleDay = (dayKey: string) => {
    if (isStaff) return;
    setSchedule((prev) => {
      const day = prev[dayKey];
      const newEnabled = !day.enabled;
      return {
        ...prev,
        [dayKey]: {
          enabled: newEnabled,
          slots: newEnabled && day.slots.length === 0
            ? [{ id: `${dayKey}-${Date.now()}`, from: '12:00', to: '14:00' }]
            : day.slots,
        },
      };
    });
    setHasChanges(true);
  };

  const addSlot = (dayKey: string) => {
    if (isStaff) return;
    setSchedule((prev) => {
      const day = prev[dayKey];
      const lastSlot = day.slots[day.slots.length - 1];
      const newFrom = lastSlot && lastSlot.to <= '17:00' ? '18:30' : '12:00';
      const newTo = newFrom === '18:30' ? '21:30' : '14:00';
      return {
        ...prev,
        [dayKey]: {
          ...day,
          slots: [...day.slots, { id: `${dayKey}-${Date.now()}`, from: newFrom, to: newTo }],
        },
      };
    });
    setHasChanges(true);
  };

  const removeSlot = (dayKey: string, slotId: string) => {
    if (isStaff) return;
    setSchedule((prev) => {
      const day = prev[dayKey];
      const newSlots = day.slots.filter((s) => s.id !== slotId);
      return {
        ...prev,
        [dayKey]: {
          ...day,
          enabled: newSlots.length > 0 ? day.enabled : false,
          slots: newSlots,
        },
      };
    });
    setHasChanges(true);
  };

  const updateSlotTime = (dayKey: string, slotId: string, field: 'from' | 'to', value: string) => {
    if (isStaff) return;
    setSchedule((prev) => {
      const day = prev[dayKey];
      return {
        ...prev,
        [dayKey]: {
          ...day,
          slots: day.slots.map((s) => s.id === slotId ? { ...s, [field]: value } : s),
        },
      };
    });
    setHasChanges(true);
  };

  const copyToAll = (sourceDayKey: string) => {
    if (isStaff) return;
    const sourceDay = schedule[sourceDayKey];
    if (!sourceDay.enabled || sourceDay.slots.length === 0) return;

    setSchedule((prev) => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach(({ key }) => {
        if (key !== sourceDayKey && updated[key].enabled) {
          updated[key] = {
            enabled: true,
            slots: sourceDay.slots.map((s, i) => ({
              id: `${key}-copy-${Date.now()}-${i}`,
              from: s.from,
              to: s.to,
            })),
          };
        }
      });
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const apiData: Record<string, { enabled: boolean; slots: { from: string; to: string }[] }> = {};
    for (const [dayKey, day] of Object.entries(schedule)) {
      apiData[dayKey] = {
        enabled: day.enabled,
        slots: day.slots.map((s) => ({ from: s.from, to: s.to })),
      };
    }
    updateSettings.mutate(
      { opening_hours: apiData },
      { onSuccess: () => setHasChanges(false) }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Heures d&apos;ouverture
            </CardTitle>
            <CardDescription>
              Sélectionnez les heures d&apos;ouverture et de fermeture durant lesquelles vous proposez des services.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 p-0 sm:px-6 sm:pb-6">
        {DAYS_OF_WEEK.map(({ key, label, short }) => {
          const day = schedule[key];
          return (
            <div
              key={key}
              className={cn(
                'flex items-start gap-3 sm:gap-4 py-3 px-4 sm:px-0 border-b border-border/50 last:border-0 transition-colors',
                !day.enabled && 'opacity-50',
              )}
            >
              {/* Day toggle */}
              <button
                onClick={() => toggleDay(key)}
                disabled={isStaff}
                className={cn(
                  'shrink-0 w-[88px] sm:w-[100px] py-1.5 rounded-lg text-sm font-semibold text-center transition-all border',
                  day.enabled
                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
                  isStaff && 'cursor-not-allowed'
                )}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>

              {/* Time slots */}
              <div className="flex-1 min-w-0 space-y-2">
                {day.enabled ? (
                  <>
                    {day.slots.map((slot, slotIdx) => (
                      <div key={slot.id} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0 w-8">De</span>
                          <Select value={slot.from} onValueChange={(v: string) => updateSlotTime(key, slot.id, 'from', v)} disabled={isStaff}>
                            <SelectTrigger className="h-9 text-sm flex-1 min-w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0 w-5">à</span>
                          <Select value={slot.to} onValueChange={(v: string) => updateSlotTime(key, slot.id, 'to', v)} disabled={isStaff}>
                            <SelectTrigger className={cn(
                              'h-9 text-sm flex-1 min-w-[100px]',
                              slot.from >= slot.to && slot.to !== '00:00' && 'border-destructive text-destructive'
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {!isStaff && (
                          slotIdx === 0 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => addSlot(key)}
                              title="Ajouter un créneau"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeSlot(key, slot.id)}
                              title="Supprimer ce créneau"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center h-9 text-sm text-muted-foreground italic">
                    Fermé
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Actions bar */}
        {!isStaff && (
          <div className="flex items-center justify-between pt-4 px-4 sm:px-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Copier les horaires :</span>
              {DAYS_OF_WEEK.filter(({ key }) => schedule[key].enabled && schedule[key].slots.length > 0).slice(0, 3).map(({ key, short }) => (
                <button
                  key={key}
                  onClick={() => copyToAll(key)}
                  className="text-xs px-2 py-1 rounded border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                  title={`Copier les horaires de ${short} vers tous les jours ouverts`}
                >
                  {short} → tous
                </button>
              ))}
            </div>
            <Button disabled={!hasChanges || updateSettings.isPending} size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Shift Presets Settings ---------- */

const PRESET_COLORS = [
  { value: '#22c55e', label: 'Vert', class: 'bg-green-500' },
  { value: '#6366f1', label: 'Indigo', class: 'bg-indigo-500' },
  { value: '#f59e0b', label: 'Ambre', class: 'bg-amber-500' },
  { value: '#ef4444', label: 'Rouge', class: 'bg-red-500' },
  { value: '#3b82f6', label: 'Bleu', class: 'bg-blue-500' },
  { value: '#8b5cf6', label: 'Violet', class: 'bg-violet-500' },
  { value: '#ec4899', label: 'Rose', class: 'bg-pink-500' },
  { value: '#14b8a6', label: 'Teal', class: 'bg-teal-500' },
  { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#64748b', label: 'Gris', class: 'bg-slate-500' },
];

const SHIFT_TIME_OPTIONS: string[] = [];
for (let h = 6; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    SHIFT_TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

function ShiftPresetsSettings({ userRole }: { userRole?: string }) {
  const isStaff = !userRole || userRole === 'staff';
  const { data: presets, isLoading } = useShiftPresets();
  const createPreset = useCreateShiftPreset();
  const updatePreset = useUpdateShiftPreset();
  const deletePreset = useDeleteShiftPreset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ShiftPreset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formShifts, setFormShifts] = useState<ShiftTimeRange[]>([{ start_time: '12:00', end_time: '14:00' }]);

  const openCreateDialog = () => {
    setEditingPreset(null);
    setFormName('');
    setFormColor('#6366f1');
    setFormShifts([{ start_time: '12:00', end_time: '14:00' }]);
    setDialogOpen(true);
  };

  const openEditDialog = (preset: ShiftPreset) => {
    setEditingPreset(preset);
    setFormName(preset.name);
    setFormColor(preset.color);
    setFormShifts(preset.shifts.length > 0 ? [...preset.shifts] : [{ start_time: '12:00', end_time: '14:00' }]);
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setFormShifts((prev) => [...prev, { start_time: '18:30', end_time: '21:30' }]);
  };

  const removeTimeRange = (index: number) => {
    setFormShifts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTimeRange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setFormShifts((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    if (!formName.trim() || formShifts.length === 0) return;

    const data = {
      name: formName.trim(),
      color: formColor,
      shifts: formShifts,
    };

    if (editingPreset) {
      updatePreset.mutate(
        { id: editingPreset.id, data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createPreset.mutate(
        { ...data, sort_order: (presets?.length || 0) },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const handleDelete = (id: string) => {
    deletePreset.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const formatTimeRanges = (shifts: ShiftTimeRange[]) => {
    return shifts.map((s) => `${s.start_time} – ${s.end_time}`).join('  •  ');
  };

  const computeHours = (shifts: ShiftTimeRange[]) => {
    let total = 0;
    for (const s of shifts) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      total += (eh * 60 + em) - (sh * 60 + sm);
    }
    const hrs = Math.floor(total / 60);
    const mins = total % 60;
    return mins > 0 ? `${hrs}h${mins.toString().padStart(2, '0')}` : `${hrs}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Vous avez un accès en lecture seule. Contactez un manager pour modifier les services.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Modèles de services
              </CardTitle>
              <CardDescription>
                Créez des modèles de services réutilisables pour la planification (ex: Midi, Soir, Journée)
              </CardDescription>
            </div>
            {!isStaff && (
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!presets || presets.length === 0 ? (
            <div className="px-6 pb-6 text-center py-8">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Aucun modèle de service créé</p>
              {!isStaff && (
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un service
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors group"
                >
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />

                  {/* Name + time ranges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{preset.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {computeHours(preset.shifts)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeRanges(preset.shifts)}
                    </p>
                  </div>

                  {/* Actions */}
                  {!isStaff && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEditDialog(preset)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      {deleteConfirmId === preset.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleDelete(preset.id)}
                            disabled={deletePreset.isPending}
                          >
                            {deletePreset.isPending ? '...' : 'Supprimer'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(preset.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingPreset ? 'Modifier le service' : 'Nouveau modèle de service'}</DialogTitle>
            <DialogDescription>
              {editingPreset
                ? 'Modifiez le nom, la couleur et les créneaux horaires.'
                : 'Définissez un service réutilisable avec un ou plusieurs créneaux horaires.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Name */}
            <div>
              <Label>Nom du service</Label>
              <Input
                placeholder="ex: Midi, Soir, Coupure..."
                value={formName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Color */}
            <div>
              <Label className="mb-2 block">Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFormColor(c.value)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all border-2',
                      formColor === c.value
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Time ranges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Créneaux horaires</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addTimeRange}>
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formShifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={shift.start_time} onValueChange={(v: string) => updateTimeRange(idx, 'start_time', v)}>
                      <SelectTrigger className="h-9 text-sm flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {SHIFT_TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-xs text-muted-foreground shrink-0">à</span>

                    <Select value={shift.end_time} onValueChange={(v: string) => updateTimeRange(idx, 'end_time', v)}>
                      <SelectTrigger className={cn(
                        'h-9 text-sm flex-1',
                        shift.start_time >= shift.end_time && 'border-destructive'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {SHIFT_TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formShifts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTimeRange(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Aperçu</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: formColor }} />
                <span className="font-medium text-sm">{formName || 'Sans nom'}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal ml-auto">
                  {computeHours(formShifts)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                {formatTimeRanges(formShifts)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !formName.trim() ||
                  formShifts.length === 0 ||
                  createPreset.isPending ||
                  updatePreset.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {(createPreset.isPending || updatePreset.isPending) ? 'Enregistrement...' : editingPreset ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Notification Settings ---------- */
function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Préférences de notification</CardTitle>
        <CardDescription>Choisissez quand vous êtes notifié</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { label: 'Nouveau shift assigné', desc: 'Quand un shift vous est attribué', defaultOn: true },
          { label: 'Shift modifié', desc: 'Quand un de vos shifts change', defaultOn: true },
          { label: 'Rappel shift', desc: '1h avant le début de votre shift', defaultOn: true },
          { label: 'Demande de remplacement', desc: 'Quand un collègue cherche un remplaçant', defaultOn: false },
          { label: 'Planning publié', desc: 'Quand le planning de la semaine est publié', defaultOn: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
            <Switch defaultChecked={item.defaultOn} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------- Account Settings ---------- */
function AccountSettings({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mon profil</CardTitle>
          <CardDescription>Vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {user ? `${(user.first_name || user.email || 'U').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">{user?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
              <Badge variant="outline" className="mt-1">{user?.role || 'staff'}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input defaultValue={user?.first_name || ''} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input defaultValue={user?.last_name || ''} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={user?.email || ''} disabled />
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Mettre à jour
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Changer le mot de passe</div>
              <div className="text-xs text-muted-foreground">Dernière modification : inconnue</div>
            </div>
            <Button variant="outline" size="sm">Modifier</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Sessions actives</div>
              <div className="text-xs text-muted-foreground">1 session active</div>
            </div>
            <Button variant="outline" size="sm">Gérer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
