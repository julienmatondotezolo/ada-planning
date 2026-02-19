'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Settings as SettingsIcon,
  Building,
  Clock,
  Bell,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  hourly_rate: number;
  hire_date: string;
  status: 'active' | 'inactive';
  default_hours_per_week: number;
}

export default function SettingsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Fetch staff on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://ada.mindgen.app/api/v1/staff?active_only=false');
      const result = await response.json();
      
      if (result.success) {
        setStaff(result.data);
      } else {
        console.error('Failed to fetch staff:', result.message);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (staffData: Omit<Staff, 'id'>) => {
    try {
      const response = await fetch('https://ada.mindgen.app/api/v1/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      const result = await response.json();
      
      if (result.success) {
        setStaff([...staff, result.data]);
        setShowAddForm(false);
      } else {
        console.error('Failed to add staff:', result.message);
        alert('Erreur lors de l\'ajout du personnel');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Erreur lors de l\'ajout du personnel');
    }
  };

  const handleUpdateStaff = async (staffData: Staff) => {
    try {
      const response = await fetch(`https://ada.mindgen.app/api/v1/staff/${staffData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      const result = await response.json();
      
      if (result.success) {
        setStaff(staff.map(s => s.id === staffData.id ? result.data : s));
        setEditingStaff(null);
      } else {
        console.error('Failed to update staff:', result.message);
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
      return;
    }

    try {
      const response = await fetch(`https://ada.mindgen.app/api/v1/staff/${staffId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setStaff(staff.filter(s => s.id !== staffId));
      } else {
        console.error('Failed to delete staff:', result.message);
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-card border-r border-border">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Settings content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <SettingsIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  Paramètres
                </h1>
              </div>
              <p className="text-muted-foreground">
                Configuration du système et gestion du personnel
              </p>
            </div>

            {/* Settings Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <nav className="space-y-2">
                  <a
                    href="#staff"
                    className="flex items-center space-x-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Users className="w-5 h-5" />
                    <span>Personnel</span>
                  </a>
                  <a
                    href="#restaurant"
                    className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Building className="w-5 h-5" />
                    <span>Restaurant</span>
                  </a>
                  <a
                    href="#schedule"
                    className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Horaires</span>
                  </a>
                  <a
                    href="#notifications"
                    className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </a>
                </nav>
              </div>

              {/* Staff Management */}
              <div className="lg:col-span-3">
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Gestion du Personnel</h2>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter Personnel</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-muted-foreground">Chargement...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium">Nom</th>
                            <th className="text-left py-3 px-4 font-medium">Position</th>
                            <th className="text-left py-3 px-4 font-medium">Téléphone</th>
                            <th className="text-left py-3 px-4 font-medium">Taux Horaire</th>
                            <th className="text-left py-3 px-4 font-medium">Statut</th>
                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.map((member) => (
                            <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium">{member.first_name} {member.last_name}</div>
                                  <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                  {member.position}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">{member.phone}</td>
                              <td className="py-3 px-4 text-sm">€{member.hourly_rate}/h</td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  "inline-flex px-2 py-1 text-xs rounded-full",
                                  member.status === 'active' 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                )}>
                                  {member.status === 'active' ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingStaff(member)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(member.id)}
                                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}