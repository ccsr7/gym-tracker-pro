'use client';

import { memo } from 'react';
import { RestDay } from '@/types';
import { Coffee, Home, Activity, Bed, TrendingDown, HelpCircle, Edit2, Trash2 } from 'lucide-react';

interface RestDayCardProps {
  restDay: RestDay;
  onEdit: (restDay: RestDay) => void;
  onDelete: (restDayId: string) => void;
}

const reasonLabels: Record<string, string> = {
  'gym-closed': 'Gimnasio Cerrado',
  'active-rest': 'Descanso Activo',
  'injury': 'Lesión / Molestia',
  'personal': 'Motivos Personales',
  'deload': 'Semana de Descarga',
  'other': 'Otro Motivo'
};

const reasonIcons: Record<string, typeof Coffee> = {
  'gym-closed': Home,
  'active-rest': Activity,
  'injury': Bed,
  'personal': Coffee,
  'deload': TrendingDown,
  'other': HelpCircle
};

const reasonColors: Record<string, string> = {
  'gym-closed': 'text-orange-400 dark:text-orange-600 bg-orange-500/20 dark:bg-orange-100',
  'active-rest': 'text-blue-400 dark:text-blue-600 bg-blue-500/20 dark:bg-blue-100',
  'injury': 'text-red-400 dark:text-red-600 bg-red-500/20 dark:bg-red-100',
  'personal': 'text-purple-400 dark:text-purple-600 bg-purple-500/20 dark:bg-purple-100',
  'deload': 'text-yellow-400 dark:text-yellow-600 bg-yellow-500/20 dark:bg-yellow-100',
  'other': 'text-slate-400 dark:text-slate-600 bg-slate-500/20 dark:bg-slate-200'
};

function RestDayCard({ restDay, onEdit, onDelete }: RestDayCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const Icon = reasonIcons[restDay.reason] || Coffee;
  const colorClass = reasonColors[restDay.reason] || reasonColors.other;

  return (
    <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border-2 border-dashed border-blue-500/50 dark:border-blue-300 rounded-xl overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-1">
                Día de Descanso
              </h3>
              <p className="text-sm text-slate-300 dark:text-slate-700 mb-1">
                {formatDate(restDay.date)}
              </p>
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
                  {reasonLabels[restDay.reason] || 'Descanso'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(restDay)}
              className="p-2 text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 hover:bg-blue-500/20 dark:hover:bg-blue-100 rounded-lg transition-colors"
              title="Editar día de descanso"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => onDelete(restDay.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Eliminar día de descanso"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {restDay.notes && (
          <div className="bg-slate-700/30 dark:bg-white border dark:border-slate-300 rounded-lg p-3 mt-3">
            <p className="text-xs text-slate-400 dark:text-slate-600 mb-1">Notas</p>
            <p className="text-sm text-slate-300 dark:text-slate-900">{restDay.notes}</p>
          </div>
        )}

        {/* Info Badge */}
        <div className="mt-3 pt-3 border-t border-slate-700/50 dark:border-slate-300">
          <p className="text-xs text-slate-500 dark:text-slate-600 flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Este día no afecta tu racha de entrenamiento
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(RestDayCard);
