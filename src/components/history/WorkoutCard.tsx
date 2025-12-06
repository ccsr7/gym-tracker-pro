'use client';

import { useState, memo } from 'react';
import { Workout } from '@/types';
import {
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Target,
  Activity,
  BarChart2
} from 'lucide-react';
import { getExerciseById } from '@/data/exercises';
import { formatWorkoutDuration } from '@/lib/utils';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
  onCompare?: (workoutId: string) => void;
}

function WorkoutCard({ workout, onEdit, onDelete, onCompare }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const calculateExerciseStats = () => {
    return workout.exercises.map(workoutEx => {
      const exercise = getExerciseById(workoutEx.exerciseId);
      const completedSets = workoutEx.sets.filter(s => s.completed);
      const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      const maxWeight = completedSets.length > 0 ? Math.max(...completedSets.map(s => s.weight)) : 0;
      const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
      const avgWeight = completedSets.length > 0 ? totalVolume / totalReps : 0;

      return {
        exercise,
        workoutEx,
        completedSets,
        totalVolume,
        maxWeight,
        totalReps,
        avgWeight
      };
    });
  };

  const exerciseStats = calculateExerciseStats();
  const totalSetsCompleted = exerciseStats.reduce((sum, stat) => sum + stat.completedSets.length, 0);
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all">
      {/* Header */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-lg md:text-xl font-bold text-white dark:text-slate-900 flex-1 min-w-0 break-words">
                {workout.routineName}
              </h3>
              {/* Botón de eliminar en móvil */}
              <button
                onClick={() => onDelete(workout.id)}
                className="sm:hidden p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                title="Eliminar sesión"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
              <p className="text-sm text-slate-300 dark:text-slate-700">{formatDate(workout.date)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-400 dark:text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatWorkoutDuration(workout.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                {workout.exercises.length} ejercicios
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {totalSetsCompleted}/{totalSets} series
              </span>
              {workout.totalVolume && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {workout.totalVolume} kg
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            {workout.rpe && (
              <div className="text-center bg-orange-500/20 dark:bg-orange-100 rounded-lg px-3 py-2">
                <p className="text-xs text-orange-400 dark:text-orange-600">RPE</p>
                <p className="text-xl md:text-2xl font-bold text-orange-500">{workout.rpe}/10</p>
              </div>
            )}
            {/* Botón de comparar */}
            {onCompare && (
              <button
                onClick={() => onCompare(workout.id)}
                className="p-2 text-purple-400 dark:text-purple-600 hover:text-purple-300 dark:hover:text-purple-700 hover:bg-purple-500/20 dark:hover:bg-purple-100 rounded-lg transition-colors"
                title="Comparar sesión"
              >
                <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            {/* Botón de editar */}
            <button
              onClick={() => onEdit(workout)}
              className="p-2 text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 hover:bg-blue-500/20 dark:hover:bg-blue-100 rounded-lg transition-colors"
              title="Editar sesión"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* Botón de eliminar en desktop */}
            <button
              onClick={() => onDelete(workout.id)}
              className="hidden sm:block p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Eliminar sesión"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick summary - Always visible */}
        <div className="space-y-2">
          {exerciseStats.slice(0, isExpanded ? exerciseStats.length : 3).map((stat, index) => {
            if (!stat.exercise) return null;

            return (
              <div
                key={index}
                className="bg-slate-700/30 dark:bg-white border dark:border-slate-300 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm md:text-base text-white dark:text-slate-900 font-medium">
                    {stat.exercise.name}
                  </h4>
                  <span className="text-xs text-emerald-400 dark:text-emerald-600 font-medium">
                    {stat.totalVolume} kg
                  </span>
                </div>

                {!isExpanded ? (
                  // Vista compacta
                  <div className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-2">
                    <span>{stat.completedSets.length} series</span>
                    <span>•</span>
                    <span>Máx: {stat.maxWeight}kg</span>
                  </div>
                ) : (
                  // Vista expandida
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 mb-2">
                      {stat.workoutEx.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`text-center p-1.5 rounded text-xs ${
                            set.completed
                              ? 'bg-emerald-500/20 dark:bg-emerald-100 border border-emerald-500/50 dark:border-emerald-300'
                              : 'bg-slate-600/30 dark:bg-slate-100 border border-slate-500/30 dark:border-slate-300 opacity-50'
                          }`}
                        >
                          <p className="text-[10px] text-slate-400 dark:text-slate-600">S{setIdx + 1}</p>
                          <p className="font-bold text-white dark:text-slate-900 text-xs">{set.weight}kg</p>
                          <p className="text-[10px] text-emerald-400 dark:text-emerald-600">×{set.reps}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-600/30 dark:border-slate-300">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">Peso Máx</p>
                        <p className="text-xs font-bold text-blue-400 dark:text-blue-600">{stat.maxWeight}kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">Peso Prom</p>
                        <p className="text-xs font-bold text-purple-400 dark:text-purple-600">
                          {stat.avgWeight.toFixed(1)}kg
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">Total Reps</p>
                        <p className="text-xs font-bold text-orange-400 dark:text-orange-600">{stat.totalReps}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Show more exercises indicator */}
        {!isExpanded && exerciseStats.length > 3 && (
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-600 text-center">
            +{exerciseStats.length - 3} ejercicio{exerciseStats.length - 3 > 1 ? 's' : ''} más
          </div>
        )}

        {/* Notes */}
        {isExpanded && workout.notes && (
          <div className="mt-4 bg-slate-700/30 dark:bg-slate-200 border dark:border-slate-300 rounded-lg p-4">
            <p className="text-xs text-slate-400 dark:text-slate-600 mb-1">Notas</p>
            <p className="text-slate-300 dark:text-slate-900 text-sm">{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Expand/Collapse button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-3 px-4 bg-slate-700/30 dark:bg-slate-200 hover:bg-slate-700/50 dark:hover:bg-slate-300 text-slate-300 dark:text-slate-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-t border-slate-700/50 dark:border-slate-200"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Ver menos
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Ver detalles completos
          </>
        )}
      </button>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(WorkoutCard);
