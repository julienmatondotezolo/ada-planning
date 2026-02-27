'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { staffApi, settingsApi, type Employee, type RestaurantSettings } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  Bell,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  User,
  Globe,
  Palette,
  Shield,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from 'ada-design-system';

type SettingsTab = 'restaurant' | 'staff' | 'schedule' | 'notifications' | 'account';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'restaurant', label: 'Restaurant', icon: Building },
  { id: 'staff', label: 'Personnel', icon: Users },
  { id: 'schedule', label: 'Horaires', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Mon compte', icon: User },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('restaurant');
  const { user } = useAuth();

  return (
    <AppShell>
      <Header />

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
          {/* Settings nav — horizontal on mobile, vertical on desktop */}
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
            {activeTab === 'staff' && <StaffSettings userRole={user?.role} />}
            {activeTab === 'schedule' && <ScheduleSettings userRole={user?.role} />}
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
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
  });
  const [infoChanged, setInfoChanged] = useState(false);

  useEffect(() => {
    settingsApi.get().then((res) => {
      if (res.success && res.data) {
        setSettings(res.data);
        const info = res.data.restaurant_info || {};
        setInfoForm({
          name: info.name || '',
          phone: info.phone || '',
          email: info.email || '',
          address: info.address || '',
          website: info.website || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSaveInfo = async () => {
    setSaving(true);
    const res = await settingsApi.update({ restaurant_info: infoForm });
    if (res.success) {
      setInfoChanged(false);
    }
    setSaving(false);
  };

  const updateInfoField = (field: string, value: string) => {
    setInfoForm((prev) => ({ ...prev, [field]: value }));
    setInfoChanged(true);
  };

  if (loading) {
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
              <Input value={infoForm.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('name', e.target.value)} disabled={isStaff} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={infoForm.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('phone', e.target.value)} disabled={isStaff} />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={infoForm.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('address', e.target.value)} disabled={isStaff} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={infoForm.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('email', e.target.value)} disabled={isStaff} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input value={infoForm.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInfoField('website', e.target.value)} disabled={isStaff} />
            </div>
          </div>
          {!isStaff && (
            <div className="flex justify-end">
              <Button onClick={handleSaveInfo} disabled={!infoChanged || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
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

// Generate time options in 30-min increments
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
  const [schedule, setSchedule] = useState<Record<string, DayScheduleLocal>>(() => {
    if (initialOpeningHours && Object.keys(initialOpeningHours).length > 0) {
      // Convert API data (no slot ids) to local format (with ids)
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
  const [saving, setSaving] = useState(false);

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
      // Smart default: if last slot ends before 17:00, suggest evening; otherwise suggest next block
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

  const handleSaveOpeningHours = async () => {
    setSaving(true);
    // Convert local format (with ids) to API format (without ids)
    const apiData: Record<string, { enabled: boolean; slots: { from: string; to: string }[] }> = {};
    for (const [dayKey, day] of Object.entries(schedule)) {
      apiData[dayKey] = {
        enabled: day.enabled,
        slots: day.slots.map((s) => ({ from: s.from, to: s.to })),
      };
    }
    const res = await settingsApi.update({ opening_hours: apiData });
    if (res.success) setHasChanges(false);
    setSaving(false);
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
                        {/* FROM */}
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

                        {/* TO */}
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

                        {/* Add / Remove buttons — hidden for staff */}
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
            <Button disabled={!hasChanges || saving} size="sm" onClick={handleSaveOpeningHours}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Staff Settings ---------- */
function StaffSettings({ userRole }: { userRole?: string }) {
  const isStaff = !userRole || userRole === 'staff';
  const [staff, setStaff] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi.getAll({ active_only: false }).then((res) => {
      if (res.success && res.data) setStaff(res.data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (isStaff) return;
    if (!confirm('Supprimer ce membre ?')) return;
    const res = await staffApi.delete(id);
    if (res.success) setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Vous avez un accès en lecture seule. Contactez un manager pour modifier le personnel.
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gestion du personnel</CardTitle>
              <CardDescription>{staff.length} membres</CardDescription>
            </div>
            {!isStaff && (
              <Button size="sm" asChild>
                <a href="/staff">
                  <Users className="w-4 h-4 mr-2" />
                  Gérer
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Statut</TableHead>
                  {!isStaff && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                    <TableCell><Badge variant="outline">{member.position}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={member.active ? 'default' : 'secondary'}>
                        {member.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    {!isStaff && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Schedule Settings ---------- */
function ScheduleSettings({ userRole }: { userRole?: string }) {
  const isStaff = !userRole || userRole === 'staff';
  const [rules, setRules] = useState({
    default_break_minutes: 30,
    max_hours_per_week: 38,
    min_staff_per_service: 2,
    min_rest_days_per_week: 2,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    settingsApi.get().then((res) => {
      if (res.success && res.data?.schedule_rules) {
        setRules(res.data.schedule_rules);
      }
      setLoading(false);
    });
  }, []);

  const updateRule = (field: string, value: number) => {
    setRules((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await settingsApi.update({ schedule_rules: rules });
    if (res.success) setHasChanges(false);
    setSaving(false);
  };

  if (loading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Vous avez un accès en lecture seule. Contactez un manager pour modifier les règles.
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Règles de planification</CardTitle>
          <CardDescription>Paramètres par défaut pour la création de shifts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Pause par défaut (min)</Label>
              <Input type="number" value={rules.default_break_minutes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule('default_break_minutes', Number(e.target.value))} disabled={isStaff} />
            </div>
            <div>
              <Label>Heures max/semaine</Label>
              <Input type="number" value={rules.max_hours_per_week} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule('max_hours_per_week', Number(e.target.value))} disabled={isStaff} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Personnel min. par service</Label>
              <Input type="number" value={rules.min_staff_per_service} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule('min_staff_per_service', Number(e.target.value))} disabled={isStaff} />
            </div>
            <div>
              <Label>Jours de repos min./semaine</Label>
              <Input type="number" value={rules.min_rest_days_per_week} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule('min_rest_days_per_week', Number(e.target.value))} disabled={isStaff} />
            </div>
          </div>
          {!isStaff && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
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
