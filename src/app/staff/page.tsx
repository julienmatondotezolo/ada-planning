'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { staffApi, type Employee } from '@/lib/api';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  UserPlus,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from 'ada-design-system';

const POSITIONS = [
  'Serveur',
  'Serveuse',
  'Chef',
  'Sous-chef',
  'Commis',
  'Plongeur',
  'Barman',
  'Hôte/Hôtesse',
  'Manager',
];

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: 'Serveur',
  hourly_rate: 14,
  notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const res = await staffApi.getAll({ active_only: false });
    if (res.success && res.data) setEmployees(res.data);
    setLoading(false);
  };

  const filtered = employees.filter((e) => {
    const matchesSearch =
      !search ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = filterPosition === 'all' || e.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const activeCount = employees.filter((e) => e.active).length;

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position,
      hourly_rate: emp.hourly_rate,
      notes: emp.notes || '',
      emergency_contact_name: emp.emergency_contact?.name || '',
      emergency_contact_phone: emp.emergency_contact?.phone || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await staffApi.update(editingId, form);
        if (res.success && res.data) {
          setEmployees((prev) => prev.map((e) => (e.id === editingId ? res.data : e)));
        }
      } else {
        const res = await staffApi.create(form);
        if (res.success && res.data) {
          setEmployees((prev) => [...prev, res.data]);
        }
      }
      setShowDialog(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce membre du personnel ?')) return;
    const res = await staffApi.delete(id);
    if (res.success) setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const getInitials = (e: Employee) =>
    `${e.first_name.charAt(0)}${e.last_name.charAt(0)}`.toUpperCase();

  return (
    <AppShell>
      <Header />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Personnel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} actif{activeCount > 1 ? 's' : ''} · {employees.length} total
            </p>
          </div>

          <Button onClick={openAdd} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes positions</SelectItem>
              {POSITIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Aucun personnel trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Taux</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(emp)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{emp.position}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{emp.position}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-0.5 text-sm">
                          {emp.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[160px]">{emp.email}</span>
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {emp.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        €{emp.hourly_rate}/h
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.active ? 'default' : 'secondary'}>
                          {emp.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} un membre</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom</Label>
                <Input value={form.first_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={form.last_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position</Label>
                <Select value={form.position} onValueChange={(v: string) => setForm({ ...form, position: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taux horaire (€)</Label>
                <Input type="number" value={form.hourly_rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, notes: e.target.value })} placeholder="Allergies, préférences…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact urgence</Label>
                <Input value={form.emergency_contact_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Nom" />
              </div>
              <div>
                <Label>Tél. urgence</Label>
                <Input value={form.emergency_contact_phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="Numéro" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
