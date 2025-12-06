'use client';

import { useState } from 'react';
import { X, Coffee, Home, Activity, Bed, TrendingDown, HelpCircle } from 'lucide-react';
import { RestDay, RestDayReason } from '@/types';
import { storageService, STORAGE_KEYS } from '@/lib/storage-service';

interface RestDayModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editingRestDay?: RestDay;
}

const reasonLabels: Record<RestDayReason, string> = {
  'gym-closed': 'Gimnasio Cerrado',
  'active-rest': 'Descanso Activo',
  'injury': 'Lesión / Molestia',
  'personal': 'Motivos Personales',
  'deload': 'Semana de Descarga',
  'other': 'Otro Motivo'
};

const reasonIcons: Record<RestDayReason, typeof Coffee> = {
  'gym-closed': Home,
  'active-rest': Activity,
  'injury': Bed,
  'personal': Coffee,
  'deload': TrendingDown,
  'other': HelpCircle
};

const reasonDescriptions: Record<RestDayReason, string> = {
  'gym-closed': 'Feriado, cierre por mantenimiento o clima',
  'active-rest': 'Día de descanso planificado en tu rutina',
  'injury': 'Lesión, dolor o prevención de lesiones',
  'personal': 'Compromisos, trabajo o situaciones personales',
  'deload': 'Semana de descarga o reducción de volumen',
  'other': 'Otra razón no especificada'
};

export default function RestDayModal({ onClose, onSuccess, editingRestDay }: RestDayModalProps) {
  const [date, setDate] = useState(
    editingRestDay?.date ? new Date(editingRestDay.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<RestDayReason>(editingRestDay?.reason || 'gym-closed');
  const [notes, setNotes] = useState(editingRestDay?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const restDays = storageService.get<RestDay[]>(STORAGE_KEYS.REST_DAYS, []);

    if (editingRestDay) {
      // Update existing
      const updatedRestDays = restDays.map(rd =>
        rd.id === editingRestDay.id
          ? { ...rd, date, reason, notes }
          : rd
      );
      storageService.set(STORAGE_KEYS.REST_DAYS, updatedRestDays);
    } else {
      // Create new
      const newRestDay: RestDay = {
        id: Date.now().toString(),
        date: new Date(date).toISOString(),
        reason,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      // Check if a rest day already exists for this date
      const existingIndex = restDays.findIndex(
        rd => new Date(rd.date).toDateString() === new Date(date).toDateString()
      );

      if (existingIndex !== -1) {
        // Replace existing
        restDays[existingIndex] = newRestDay;
      } else {
        // Add new
        restDays.push(newRestDay);
      }

      storageService.set(STORAGE_KEYS.REST_DAYS, restDays);
    }

    onSuccess();
    onClose();
  };

  const SelectedIcon = reasonIcons[reason];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 dark:bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 dark:border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 dark:bg-white border-b border-slate-700/50 dark:border-slate-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 dark:bg-blue-100 p-2 rounded-lg">
              <Coffee className="w-5 h-5 text-blue-400 dark:text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-slate-900">
                {editingRestDay ? 'Editar Día de Descanso' : 'Marcar Día de Descanso'}
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-600">
                Los días de descanso no afectan tus rachas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 dark:hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-50 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
              Selecciona el día que no entrenaste
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-3">
              Razón del Descanso
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(reasonLabels) as RestDayReason[]).map((reasonKey) => {
                const Icon = reasonIcons[reasonKey];
                const isSelected = reason === reasonKey;

                return (
                  <button
                    key={reasonKey}
                    type="button"
                    onClick={() => setReason(reasonKey)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 dark:bg-blue-50'
                        : 'border-slate-700 dark:border-slate-300 bg-slate-700/30 dark:bg-slate-50 hover:border-slate-600 dark:hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-blue-500/30 dark:bg-blue-100'
                          : 'bg-slate-600/30 dark:bg-slate-200'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isSelected
                            ? 'text-blue-400 dark:text-blue-600'
                            : 'text-slate-400 dark:text-slate-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          isSelected
                            ? 'text-blue-300 dark:text-blue-700'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}>
                          {reasonLabels[reasonKey]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-600 mt-0.5">
                          {reasonDescriptions[reasonKey]}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Feriado nacional, gimnasio cerrado por mantenimiento..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-50 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 dark:bg-blue-50 border border-blue-500/30 dark:border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <SelectedIcon className="w-5 h-5 text-blue-400 dark:text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300 dark:text-blue-700 mb-1">
                  ¿Cómo funciona?
                </p>
                <p className="text-xs text-blue-200 dark:text-blue-600">
                  Al marcar un día como descanso planificado, este día <strong>no romperá tu racha de entrenamiento</strong>.
                  Aparecerá en tu historial con un indicador especial y se excluirá de los cálculos de consistencia.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              {editingRestDay ? 'Guardar Cambios' : 'Marcar Descanso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
