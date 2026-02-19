'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Clock, Save, X } from 'lucide-react';
import { usePlanningStore } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { StaffMember } from '@/types/planning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StaffCard: React.FC<{ 
  staff: StaffMember; 
  onEdit: (staff: StaffMember) => void;
  onDelete: (id: string) => void;
}> = ({ staff, onEdit, onDelete }) => {
  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
  };

  const positionLabels = {
    manager: 'Manager',
    server: 'Serveur',
    kitchen: 'Cuisine',
    bar: 'Bar',
    host: 'Accueil',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-black">
            {staff.first_name} {staff.last_name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[staff.status]}`}>
              {staff.status === 'active' ? 'Actif' : staff.status === 'inactive' ? 'Inactif' : 'Congé'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => onEdit(staff)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(staff.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Poste:</span>
          <span className="font-medium text-black">{positionLabels[staff.position]}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Taux horaire:</span>
          <span className="font-medium text-black">€{staff.hourly_rate.toFixed(2)}/h</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Heures/semaine:</span>
          <span className="font-medium text-black">{staff.default_hours_per_week}h</span>
        </div>
        
        {staff.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{staff.email}</span>
          </div>
        )}
        
        {staff.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{staff.phone}</span>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <div className="text-sm text-gray-600 mb-2">Disponibilités:</div>
          <div className="grid grid-cols-7 gap-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => {
              const availability = staff.availability?.find(a => a.day_of_week === index + 1);
              return (
                <div
                  key={index}
                  className={`text-xs p-1 text-center rounded ${
                    availability 
                      ? availability.availability_type === 'regular' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StaffModal: React.FC<{
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Partial<StaffMember>) => void;
  saving: boolean;
}> = ({ staff, isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: 'server' as StaffMember['position'],
    hourly_rate: 15.0,
    status: 'active' as StaffMember['status'],
    default_hours_per_week: 30,
    hire_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone: staff.phone || '',
        position: staff.position,
        hourly_rate: staff.hourly_rate,
        status: staff.status,
        default_hours_per_week: staff.default_hours_per_week,
        hire_date: staff.hire_date,
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: 'server',
        hourly_rate: 15.0,
        status: 'active',
        default_hours_per_week: 30,
        hire_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [staff, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-black">
            {staff ? 'Modifier le membre' : 'Nouveau membre du personnel'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={saving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Nom *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Poste *
              </label>
              <select
                required
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value as StaffMember['position']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              >
                <option value="server">Serveur</option>
                <option value="kitchen">Cuisine</option>
                <option value="bar">Bar</option>
                <option value="host">Accueil</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Taux horaire (€) *
              </label>
              <input
                type="number"
                step="0.50"
                min="10"
                max="50"
                required
                value={formData.hourly_rate}
                onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Heures par semaine *
              </label>
              <input
                type="number"
                min="10"
                max="50"
                required
                value={formData.default_hours_per_week}
                onChange={(e) => setFormData({...formData, default_hours_per_week: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Statut *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as StaffMember['status']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="on_leave">En congé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Date d'embauche *
              </label>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="text-black border-gray-300"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StaffList: React.FC = () => {
  const { state, dispatch } = usePlanningStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await adaPlanningAPI.getStaff();
      dispatch({ type: 'SET_STAFF', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement du personnel' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
      try {
        await adaPlanningAPI.deleteStaffMember(id);
        dispatch({ type: 'DELETE_STAFF', payload: id });
        await loadStaff(); // Refresh the list
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la suppression' });
      }
    }
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleSave = async (staffData: Partial<StaffMember>) => {
    try {
      setSaving(true);
      
      if (selectedStaff) {
        // Update existing staff member
        await adaPlanningAPI.updateStaffMember(selectedStaff.id, staffData);
      } else {
        // Create new staff member
        await adaPlanningAPI.createStaffMember(staffData);
      }
      
      setIsModalOpen(false);
      setSelectedStaff(null);
      await loadStaff(); // Refresh the list
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: selectedStaff ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création' 
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = state.staff.filter(staff => {
    if (filter === 'all') return true;
    return staff.status === filter;
  });

  const activeCount = state.staff.filter(s => s.status === 'active').length;
  const totalCount = state.staff.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Personnel</h1>
          <p className="text-gray-600">{activeCount} actifs sur {totalCount} membres</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'all', label: 'Tous', count: totalCount },
          { key: 'active', label: 'Actifs', count: activeCount },
          { key: 'inactive', label: 'Inactifs', count: totalCount - activeCount },
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(key as any)}
            className={filter === key ? 'bg-blue-600 text-white' : 'text-black border-gray-300'}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {state.error}
        </div>
      )}

      {/* Staff Grid */}
      {state.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-black">Chargement...</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {filteredStaff.length === 0 && !state.isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Aucun membre du personnel trouvé</div>
          <Button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter le premier membre
          </Button>
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        staff={selectedStaff}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};