'use client';

import { Workout } from '@/types';
import { X, Calendar, Clock, TrendingUp, Dumbbell, ArrowUp, ArrowDown, Minus, Target } from 'lucide-react';
import { getExerciseById } from '@/data/exercises';
import { formatWorkoutDuration } from '@/lib/utils';

interface CompareWorkoutsProps {
  workout1: Workout;
  workout2: Workout | null;
  onClose: () => void;
  availableWorkouts: Workout[];
  onSelectWorkout2: (workoutId: string) => void;
}

export default function CompareWorkouts({
  workout1,
  workout2,
  onClose,
  availableWorkouts,
  onSelectWorkout2
}: CompareWorkoutsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderDifference = (value1: number, value2: number, unit: string = '') => {
    const diff = value2 - value1;
    const percentChange = value1 > 0 ? ((diff / value1) * 100).toFixed(1) : 0;

    if (diff === 0) {
      return (
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-600">
          <Minus className="w-3 h-3" />
          <span className="text-xs">Sin cambio</span>
        </div>
      );
    }

    const isPositive = diff > 0;
    const color = isPositive ? 'text-emerald-400 dark:text-emerald-600' : 'text-red-400 dark:text-red-600';
    const Icon = isPositive ? ArrowUp : ArrowDown;

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">
          {Math.abs(diff)}{unit} ({percentChange}%)
        </span>
      </div>
    );
  };

  const renderExerciseComparison = () => {
    if (!workout2) return null;

    // Encontrar ejercicios comunes
    const commonExercises = workout1.exercises.filter(ex1 =>
      workout2.exercises.some(ex2 => ex2.exerciseId === ex1.exerciseId)
    );

    if (commonExercises.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
          No hay ejercicios en común entre estas sesiones
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {commonExercises.map(ex1 => {
          const ex2 = workout2.exercises.find(e => e.exerciseId === ex1.exerciseId);
          if (!ex2) return null;

          const exercise = getExerciseById(ex1.exerciseId);
          if (!exercise) return null;

          // Calcular estadísticas
          const sets1 = ex1.sets.filter(s => s.completed);
          const sets2 = ex2.sets.filter(s => s.completed);

          const volume1 = sets1.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          const volume2 = sets2.reduce((sum, s) => sum + (s.weight * s.reps), 0);

          const maxWeight1 = sets1.length > 0 ? Math.max(...sets1.map(s => s.weight)) : 0;
          const maxWeight2 = sets2.length > 0 ? Math.max(...sets2.map(s => s.weight)) : 0;

          const totalReps1 = sets1.reduce((sum, s) => sum + s.reps, 0);
          const totalReps2 = sets2.reduce((sum, s) => sum + s.reps, 0);

          return (
            <div
              key={ex1.exerciseId}
              className="bg-slate-700/30 dark:bg-white border dark:border-slate-300 rounded-lg p-4"
            >
              <h4 className="text-sm font-bold text-white dark:text-slate-900 mb-3">{exercise.name}</h4>

              <div className="grid grid-cols-3 gap-4">
                {/* Volumen Total */}
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-1">Volumen</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 dark:text-slate-700">{volume1} kg</p>
                    <p className="text-xs text-white dark:text-slate-900 font-bold">{volume2} kg</p>
                    {renderDifference(volume1, volume2, 'kg')}
                  </div>
                </div>

                {/* Peso Máximo */}
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-1">Peso Máx</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 dark:text-slate-700">{maxWeight1} kg</p>
                    <p className="text-xs text-white dark:text-slate-900 font-bold">{maxWeight2} kg</p>
                    {renderDifference(maxWeight1, maxWeight2, 'kg')}
                  </div>
                </div>

                {/* Total Reps */}
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-1">Total Reps</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 dark:text-slate-700">{totalReps1}</p>
                    <p className="text-xs text-white dark:text-slate-900 font-bold">{totalReps2}</p>
                    {renderDifference(totalReps1, totalReps2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Filtrar workouts disponibles (misma rutina, excluyendo el workout1)
  const compatibleWorkouts = availableWorkouts.filter(
    w => w.routineName === workout1.routineName && w.id !== workout1.id
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 dark:bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 dark:border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white dark:text-slate-900">Comparar Entrenamientos</h3>
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                {workout1.routineName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Workout Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Workout 1 (Fixed) */}
            <div className="bg-slate-700/30 dark:bg-slate-100 border-2 border-emerald-500/50 dark:border-emerald-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-emerald-400 dark:text-emerald-600">Sesión Base</p>
                <div className="px-2 py-1 bg-emerald-500/20 dark:bg-emerald-100 rounded text-xs text-emerald-400 dark:text-emerald-600 font-medium">
                  Sesión 1
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                  <Calendar className="w-3 h-3" />
                  {formatDate(workout1.date)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                  <Clock className="w-3 h-3" />
                  {formatWorkoutDuration(workout1.duration)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                  <TrendingUp className="w-3 h-3" />
                  {workout1.totalVolume || 0} kg
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                  <Target className="w-3 h-3" />
                  {workout1.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)} series
                </div>
              </div>
            </div>

            {/* Workout 2 (Selectable) */}
            <div className="bg-slate-700/30 dark:bg-slate-100 border-2 border-blue-500/50 dark:border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-blue-400 dark:text-blue-600">Sesión a Comparar</p>
                <div className="px-2 py-1 bg-blue-500/20 dark:bg-blue-100 rounded text-xs text-blue-400 dark:text-blue-600 font-medium">
                  Sesión 2
                </div>
              </div>

              {!workout2 ? (
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-600 mb-2">
                    Selecciona una sesión
                  </label>
                  <select
                    onChange={(e) => onSelectWorkout2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {compatibleWorkouts.length > 0 ? 'Selecciona...' : 'No hay sesiones disponibles'}
                    </option>
                    {compatibleWorkouts.map(w => (
                      <option key={w.id} value={w.id}>
                        {formatDate(w.date)} - {w.totalVolume || 0} kg
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                    <Calendar className="w-3 h-3" />
                    {formatDate(workout2.date)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                    <Clock className="w-3 h-3" />
                    {formatWorkoutDuration(workout2.duration)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                    <TrendingUp className="w-3 h-3" />
                    {workout2.totalVolume || 0} kg
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                    <Target className="w-3 h-3" />
                    {workout2.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)} series
                  </div>
                  <button
                    onClick={() => onSelectWorkout2('')}
                    className="w-full mt-2 py-1.5 text-xs text-blue-400 dark:text-blue-600 hover:bg-blue-500/10 dark:hover:bg-blue-100 rounded transition-colors"
                  >
                    Cambiar sesión
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Overall Comparison */}
          {workout2 && (
            <>
              <div className="bg-slate-700/20 dark:bg-slate-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-white dark:text-slate-900 mb-4">Comparación General</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">Volumen Total</p>
                    {renderDifference(workout1.totalVolume || 0, workout2.totalVolume || 0, 'kg')}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">Duración</p>
                    {renderDifference(workout1.duration, workout2.duration, ' min')}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">Ejercicios</p>
                    {renderDifference(workout1.exercises.length, workout2.exercises.length)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">Series Completadas</p>
                    {renderDifference(
                      workout1.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0),
                      workout2.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Exercise by Exercise Comparison */}
              <div>
                <h4 className="text-sm font-bold text-white dark:text-slate-900 mb-4">Comparación por Ejercicio</h4>
                {renderExerciseComparison()}
              </div>
            </>
          )}

          {!workout2 && compatibleWorkouts.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 dark:text-slate-600">
                No hay otras sesiones de <span className="font-medium">{workout1.routineName}</span> para comparar
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 dark:border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-700 dark:bg-slate-200 hover:bg-slate-600 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
