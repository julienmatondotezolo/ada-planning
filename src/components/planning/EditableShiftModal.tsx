'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, X, Check, Trash2 } from 'lucide-react';
import { Shift, StaffMember } from '@/types/planning';
import { SimpleButton as Button } from '@/components/ui/simple-button';
import { SimpleCard as Card } from '@/components/ui/simple-card';
import { adaPlanningAPI } from '@/lib/api';

interface EditableShiftModalProps {
  shift: Shift | null;
  selectedDate: Date | null;
  staff: StaffMember[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
}

export const EditableShiftModal: React.FC<EditableShiftModalProps> = ({
  shift,
  selectedDate,
  staff,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    staff_member_id: '',
    start_time: '09:00',
    end_time: '17:00',
    position: 'server',
    scheduled_date: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const isEditMode = !!shift;

  // Initialize form data
  useEffect(() => {
    if (shift) {
      setFormData({
        staff_member_id: shift.staff_member_id || '',
        start_time: shift.start_time,
        end_time: shift.end_time,
        position: shift.position,
        scheduled_date: shift.scheduled_date,
      });
      setHasChanges(false);
    } else if (selectedDate) {
      setFormData({
        staff_member_id: '',
        start_time: '09:00',
        end_time: '17:00',
        position: 'server',
        scheduled_date: selectedDate.toISOString().split('T')[0],
      });
      setHasChanges(false);
    }
  }, [shift, selectedDate]);

  // Calculate hours
  const calculateHours = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1); // Next day
    }
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const calculatedHours = calculateHours(formData.start_time, formData.end_time);

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setError(null);
  };

  // Quick time presets
  const timePresets = [
    { label: 'Matin', start: '08:00', end: '16:00' },
    { label: 'Après-midi', start: '12:00', end: '20:00' },
    { label: 'Soirée', start: '16:00', end: '00:00' },
    { label: 'Journée', start: '09:00', end: '17:00' },
  ];

  const applyPreset = (start: string, end: string) => {
    handleChange('start_time', start);
    handleChange('end_time', end);
  };

  // Validation
  const validateForm = (): string | null => {
    if (!formData.staff_member_id) {
      return 'Veuillez sélectionner un membre du personnel';
    }
    if (!formData.start_time || !formData.end_time) {
      return 'Veuillez saisir les heures de début et de fin';
    }
    if (calculatedHours <= 0 || calculatedHours > 24) {
      return 'Horaires invalides';
    }
    return null;
  };

  // Save shift
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const shiftData = {
        ...formData,
        calculated_hours: calculatedHours,
      };

      let savedShift: Shift;
      
      if (isEditMode && shift) {
        // Update existing shift
        savedShift = await adaPlanningAPI.updateShift(shift.id, shiftData);
      } else {
        // Create new shift
        savedShift = await adaPlanningAPI.createShift(shiftData);
      }

      onSave(savedShift);
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
      console.error('Error saving shift:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete shift
  const handleDelete = async () => {
    if (!shift || !onDelete) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce poste ?')) return;

    setIsLoading(true);
    try {
      await adaPlanningAPI.deleteShift(shift.id);
      onDelete(shift.id);
      onClose();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error('Error deleting shift:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save when times change (after a delay)
  useEffect(() => {
    if (!hasChanges || !isEditMode) return;
    
    const timeoutId = setTimeout(() => {
      if (formData.start_time && formData.end_time && calculatedHours > 0) {
        handleSave();
      }
    }, 1500); // Auto-save after 1.5 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData.start_time, formData.end_time, hasChanges]);

  const selectedStaff = staff.find(s => s.id === formData.staff_member_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">
                {isEditMode ? 'Modifier le poste' : 'Nouveau poste'}
              </h3>
              {(selectedDate || shift) && (
                <div className="text-sm text-gray-600 mt-1">
                  {selectedDate?.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) || new Date(shift?.scheduled_date || '').toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Staff Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Personnel
            </label>
            <select 
              value={formData.staff_member_id}
              onChange={(e) => handleChange('staff_member_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner un membre</option>
              {staff.map(member => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name} - {member.position}
                </option>
              ))}
            </select>
          </div>

          {/* Time Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horaires prédéfinis
            </label>
            <div className="flex flex-wrap gap-2">
              {timePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.start, preset.end)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Début
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Hours Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Durée: <span className="font-medium text-gray-900">{calculatedHours}h</span>
            </div>
            {selectedStaff && (
              <div className="text-sm text-gray-600 mt-1">
                Salaire estimé: <span className="font-medium text-gray-900">
                  {(calculatedHours * (selectedStaff.hourly_rate || 12)).toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          {/* Position Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Poste
            </label>
            <select
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="server">Serveur</option>
              <option value="kitchen">Cuisine</option>
              <option value="bar">Bar</option>
              <option value="host">Accueil</option>
              <option value="manager">Manager</option>
              <option value="cleaning">Nettoyage</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {isEditMode && onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button 
                variant="primary"
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  'Enregistrement...'
                ) : isEditMode ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Mettre à jour
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>

          {/* Auto-save indicator */}
          {isEditMode && hasChanges && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Sauvegarde automatique dans 1.5s...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};