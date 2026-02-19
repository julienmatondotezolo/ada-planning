'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Clock } from 'lucide-react';
import { usePlanningStore } from '@/stores/planning-store';
import { adaPlanningAPI } from '@/lib/api';
import { StaffMember } from '@/types/planning';
import { SimpleButton as Button } from '@/components/ui/simple-button';
import { SimpleCard as Card, SimpleCardContent as CardContent, SimpleCardHeader as CardHeader, SimpleCardTitle as CardTitle } from '@/components/ui/simple-card';

const StaffCard: React.FC<{ 
  staff: StaffMember; 
  onEdit: (staff: StaffMember) => void;
  onDelete: (id: string) => void;
}> = ({ staff, onEdit, onDelete }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
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
          <CardTitle className="text-lg">
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
          <span className="font-medium">{positionLabels[staff.position]}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Taux horaire:</span>
          <span className="font-medium">€{staff.hourly_rate.toFixed(2)}/h</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Heures/semaine:</span>
          <span className="font-medium">{staff.default_hours_per_week}h</span>
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
                        ? 'bg-green-100 text-green-800' 
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

export const StaffList: React.FC = () => {
  const { state, dispatch } = usePlanningStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
        // await adaPlanningAPI.deleteStaff(id);
        // dispatch({ type: 'DELETE_STAFF', payload: id });
        console.log('Delete staff member:', id);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la suppression' });
      }
    }
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Personnel</h1>
          <p className="text-gray-600">{activeCount} actifs sur {totalCount} membres</p>
        </div>
        <Button onClick={handleAddNew}>
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
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Staff Grid */}
      {state.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement...</div>
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
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter le premier membre
          </Button>
        </div>
      )}

      {/* Modal placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedStaff ? 'Modifier le membre' : 'Nouveau membre'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedStaff?.first_name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedStaff?.last_name || ''}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary">
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};