'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { TrendingUp, Calendar, Award, Dumbbell, ChevronDown, BarChart3 } from 'lucide-react';
import { getWeeklyVolumeStats } from '@/lib/volume-stats';

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    setWorkouts(storedWorkouts);

    // Obtener todos los ejercicios únicos de los workouts
    const exerciseIds = new Set<string>();
    storedWorkouts.forEach((w: Workout) => {
      w.exercises.forEach(ex => {
        exerciseIds.add(ex.exerciseId);
      });
    });

    const options = Array.from(exerciseIds)
      .map(id => {
        const exercise = getExerciseById(id);
        return exercise ? { id, name: exercise.name } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;

    setExerciseOptions(options.sort((a, b) => a.name.localeCompare(b.name)));
    if (options.length > 0) {
      setSelectedExerciseId(options[0].id);
    }
  };

  const getExerciseProgress = (exerciseId: string) => {
    const progressData = workouts
      .filter(w => w.exercises.some(ex => ex.exerciseId === exerciseId))
      .map(w => {
        const exercise = w.exercises.find(ex => ex.exerciseId === exerciseId);
        if (!exercise) return null;

        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return null;

        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        const avgWeight = completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length;
        const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
        const volume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

        return {
          date: new Date(w.date),
          maxWeight,
          avgWeight,
          totalReps,
          volume,
          sets: completedSets.length
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime()) as Array<{
        date: Date;
        maxWeight: number;
        avgWeight: number;
        totalReps: number;
        volume: number;
        sets: number;
      }>;

    return progressData;
  };

  const selectedExercise = selectedExerciseId ? getExerciseById(selectedExerciseId) : null;
  const progressData = selectedExerciseId ? getExerciseProgress(selectedExerciseId) : [];

  const maxWeightOverall = progressData.length > 0 ? Math.max(...progressData.map(d => d.maxWeight)) : 0;
  const maxVolumeOverall = progressData.length > 0 ? Math.max(...progressData.map(d => d.volume)) : 0;

  const stats = progressData.length > 0 ? {
    currentPR: Math.max(...progressData.map(d => d.maxWeight)),
    firstWeight: progressData[0].maxWeight,
    totalSessions: progressData.length,
    totalVolume: progressData.reduce((sum, d) => sum + d.volume, 0)
  } : null;

  if (exerciseOptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
        <Navigation />

        <div className="container mx-auto px-4 py-8 pb-24">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Progreso por Ejercicio</h1>
          <p className="text-slate-400 dark:text-slate-600 mb-8">Visualiza tu evolución</p>

          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp className="w-24 h-24 text-slate-600 mb-6" />
            <h3 className="text-2xl font-bold text-white dark:text-slate-900 mb-2">Sin datos de progreso</h3>
            <p className="text-slate-400 dark:text-slate-600 text-center max-w-md">
              Completa algunos entrenamientos para ver tus gráficos de progreso
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Progreso por Ejercicio</h1>
          <p className="text-slate-400 dark:text-slate-600">Visualiza tu evolución y récords personales</p>
        </div>

        {/* Weekly Volume Chart */}
        {(() => {
          const weeklyData = getWeeklyVolumeStats(workouts, 8);
          const maxVolume = Math.max(...weeklyData.map(w => w.totalVolume), 1);

          return (
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-white dark:text-slate-900">Volumen Semanal (últimas 8 semanas)</h3>
              </div>

              <div className="flex items-end justify-between gap-2 h-48">
                {weeklyData.map((week, index) => {
                  const height = (week.totalVolume / maxVolume) * 100;
                  const isCurrentWeek = index === weeklyData.length - 1;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        {week.totalVolume > 0 && (
                          <div className="text-center mb-1">
                            <p className="text-xs font-bold text-emerald-400 dark:text-emerald-600">
                              {Math.round(week.totalVolume / 1000)}k
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-600">
                              {week.workoutCount} 🏋️
                            </p>
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            isCurrentWeek
                              ? 'bg-emerald-500'
                              : week.totalVolume > 0
                              ? 'bg-blue-500'
                              : 'bg-slate-700/30 dark:bg-slate-300'
                          }`}
                          style={{ height: `${height || 5}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                        {week.week}
                      </p>
                    </div>
                  );
                })}
              </div>

              {weeklyData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 dark:border-slate-300 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-400 dark:text-slate-600">Promedio semanal</p>
                    <p className="text-white dark:text-slate-900 font-bold">
                      {Math.round(weeklyData.reduce((sum, w) => sum + w.totalVolume, 0) / weeklyData.length / 1000)}k kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 dark:text-slate-600">Total (8 semanas)</p>
                    <p className="text-white dark:text-slate-900 font-bold">
                      {Math.round(weeklyData.reduce((sum, w) => sum + w.totalVolume, 0) / 1000)}k kg
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Exercise Selector */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 mb-6">
          <label className="block text-sm text-slate-400 dark:text-slate-600 mb-2">Seleccionar Ejercicio</label>
          <div className="relative">
            <select
              value={selectedExerciseId || ''}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 font-medium appearance-none cursor-pointer"
            >
              {exerciseOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 pointer-events-none" />
          </div>
        </div>

        {selectedExercise && stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-100 dark:to-emerald-50 border border-emerald-500/30 dark:border-emerald-200 rounded-xl p-4">
                <Award className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-white dark:text-emerald-600">{stats.currentPR} kg</p>
                <p className="text-emerald-300 dark:text-emerald-600 text-xs">PR Actual</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-100 dark:to-blue-50 border border-blue-500/30 dark:border-blue-200 rounded-xl p-4">
                <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-white dark:text-blue-600">+{stats.currentPR - stats.firstWeight} kg</p>
                <p className="text-blue-300 dark:text-blue-600 text-xs">Progreso</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-100 dark:to-purple-50 border border-purple-500/30 dark:border-purple-200 rounded-xl p-4">
                <Calendar className="w-8 h-8 text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-white dark:text-purple-600">{stats.totalSessions}</p>
                <p className="text-purple-300 dark:text-purple-600 text-xs">Sesiones</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-100 dark:to-orange-50 border border-orange-500/30 dark:border-orange-200 rounded-xl p-4">
                <Dumbbell className="w-8 h-8 text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-white dark:text-orange-600">{Math.round(stats.totalVolume)}</p>
                <p className="text-orange-300 dark:text-orange-600 text-xs">Volumen Total (kg)</p>
              </div>
            </div>

            {/* Weight Progress Chart */}
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">Peso Máximo por Sesión</h3>
              <div className="space-y-3">
                {progressData.map((data, index) => {
                  const barWidth = (data.maxWeight / maxWeightOverall) * 100;
                  const isNewPR = index === progressData.length - 1 && data.maxWeight === stats.currentPR;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 dark:text-slate-600">
                          {data.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="font-bold text-white dark:text-slate-900">
                          {data.maxWeight} kg
                          {isNewPR && <span className="ml-2 text-xs text-emerald-500">PR!</span>}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/30 dark:bg-slate-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            isNewPR
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-600">
                        <span>{data.sets} series</span>
                        <span>•</span>
                        <span>{data.totalReps} reps totales</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">Volumen Total por Sesión</h3>
              <div className="space-y-3">
                {progressData.map((data, index) => {
                  const barWidth = (data.volume / maxVolumeOverall) * 100;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 dark:text-slate-600">
                          {data.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="font-bold text-white dark:text-slate-900">
                          {Math.round(data.volume)} kg
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/30 dark:bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-purple-500 h-3 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-600">
                        Peso promedio: {data.avgWeight.toFixed(1)} kg
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
