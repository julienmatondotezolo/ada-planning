'use client';

import React, { useState, useEffect } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shift, StaffMember } from '@/types/planning';

interface ShiftModalProps {
  isOpen: boolean;
  shift: Shift | null;
  date: Date | null;
  staff: StaffMember[];
  onClose: () => void;
  onSave: (shiftData: Partial<Shift>) => void;
  onDelete?: (shiftId: string) => void;
  saving?: boolean;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  shift,
  date,
  staff,
  onClose,
  onSave,
  onDelete,
  saving = false,
}) => {
  const [formData, setFormData] = useState({
    staff_member_id: '',
    start_time: '09:00',
    end_time: '17:00',
    position: 'server',
    break_duration: 30,
    notes: '',
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        staff_member_id: shift.staff_member_id || '',
        start_time: shift.start_time,
        end_time: shift.end_time,
        position: shift.position,
        break_duration: shift.break_duration || 30,
        notes: shift.notes || '',
      });
    } else {
      setFormData({
        staff_member_id: '',
        start_time: '09:00',
        end_time: '17:00',
        position: 'server',
        break_duration: 30,
        notes: '',
      });
    }
  }, [shift, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.staff_member_id || !date) {
      alert('Veuillez sélectionner un membre du personnel');
      return;
    }

    const shiftData = {
      ...formData,
      scheduled_date: date.toISOString().split('T')[0],
      status: 'scheduled' as const,
      calculated_hours: calculateHours(formData.start_time, formData.end_time, formData.break_duration),
      is_overtime: false,
    };

    onSave(shiftData);
  };

  const calculateHours = (startTime: string, endTime: string, breakMinutes: number = 0): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const workMinutes = endTotalMinutes - startTotalMinutes - breakMinutes;
    return Math.max(0, workMinutes / 60);
  };

  const handleDelete = () => {
    if (shift && onDelete && confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      onDelete(shift.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              {shift ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={saving}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Date Display */}
          {date && (
            <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-md">
              <strong>Date:</strong> {date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Personnel *
              </label>
              <select 
                value={formData.staff_member_id}
                onChange={(e) => setFormData({...formData, staff_member_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                required
              >
                <option value="">Sélectionner un membre</option>
                {staff.filter(s => s.status === 'active').map(staffMember => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.first_name} {staffMember.last_name} - {staffMember.position}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Heure de début *
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Heure de fin *
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  required
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Poste *
              </label>
              <select 
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                required
              >
                <option value="server">Serveur</option>
                <option value="kitchen">Cuisine</option>
                <option value="bar">Bar</option>
                <option value="host">Accueil</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Break Duration */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Pause (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                step="15"
                value={formData.break_duration}
                onChange={(e) => setFormData({...formData, break_duration: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                rows={2}
                placeholder="Notes optionnelles..."
              />
            </div>

            {/* Hours Calculation */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-600">
                <strong>Heures calculées:</strong> {calculateHours(formData.start_time, formData.end_time, formData.break_duration).toFixed(1)}h
                {formData.break_duration > 0 && (
                  <span className="text-xs ml-2">(pause: {formData.break_duration}min)</span>
                )}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              {shift && onDelete && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
              
              <div className="flex space-x-3 ml-auto">
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
                      {shift ? 'Mettre à jour' : 'Ajouter'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};