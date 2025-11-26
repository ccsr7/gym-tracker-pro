'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Workout } from '@/types';
import { Calendar, Clock, Dumbbell, TrendingUp, Trash2 } from 'lucide-react';
import { getExerciseById } from '@/data/exercises';

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = () => {
    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    setWorkouts(storedWorkouts.reverse()); // Most recent first
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.')) {
      return;
    }

    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const updatedWorkouts = storedWorkouts.filter((w: Workout) => w.id !== workoutId);
    localStorage.setItem('gym-tracker-workouts', JSON.stringify(updatedWorkouts));

    // Recargar la lista
    loadWorkouts();
  };

  if (workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <h1 className="text-3xl font-bold text-white mb-2">Historial de Entrenamientos</h1>
          <p className="text-slate-400 mb-8">Revisa tus entrenamientos pasados y tu progreso</p>

          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="w-24 h-24 text-slate-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Sin entrenamientos registrados</h3>
            <p className="text-slate-400 text-center max-w-md">
              Completa tu primer entrenamiento para ver tu historial aquí
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Historial de Entrenamientos</h1>
          <p className="text-slate-400 dark:text-slate-600">Revisa tus entrenamientos pasados y tu progreso</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Total</p>
            <p className="text-3xl font-bold text-white dark:text-slate-900">{workouts.length}</p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Este Mes</p>
            <p className="text-3xl font-bold text-emerald-500">
              {workouts.filter(w => {
                const date = new Date(w.date);
                const now = new Date();
                return date.getMonth() === now.getMonth();
              }).length}
            </p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Esta Semana</p>
            <p className="text-3xl font-bold text-blue-500">
              {workouts.filter(w => {
                const date = new Date(w.date);
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
              }).length}
            </p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Tiempo Total</p>
            <p className="text-3xl font-bold text-purple-500">
              {Math.round(workouts.reduce((acc, w) => acc + w.duration, 0) / 60)}h
            </p>
          </div>
        </div>

        {/* Workouts List */}
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 md:p-6 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg md:text-xl font-bold text-white dark:text-slate-900 flex-1 min-w-0 break-words">{workout.routineName}</h3>
                    {/* Botón de eliminar en móvil */}
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
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
                      {Math.floor(workout.duration / 60)}:{(workout.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {workout.exercises.length} ejercicios
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
                  {/* Botón de eliminar en desktop */}
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="hidden sm:block p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Eliminar sesión"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {workout.exercises.map((workoutEx, index) => {
                  const exercise = getExerciseById(workoutEx.exerciseId);
                  if (!exercise) return null;

                  const completedSets = workoutEx.sets.filter(s => s.completed);

                  return (
                    <div
                      key={index}
                      className="bg-slate-700/30 dark:bg-white border dark:border-slate-300 rounded-lg p-3 md:p-4"
                    >
                      <h4 className="text-sm md:text-base text-white dark:text-slate-900 font-medium mb-2 md:mb-3">{exercise.name}</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
                        {workoutEx.sets.map((set, setIdx) => (
                          <div
                            key={setIdx}
                            className={`text-center p-1.5 md:p-2 rounded text-xs md:text-sm ${
                              set.completed
                                ? 'bg-emerald-500/20 dark:bg-emerald-100 border border-emerald-500/50 dark:border-emerald-300'
                                : 'bg-slate-600/30 dark:bg-slate-100 border border-slate-500/30 dark:border-slate-300 opacity-50'
                            }`}
                          >
                            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-600">S{setIdx + 1}</p>
                            <p className="font-bold text-white dark:text-slate-900 text-xs md:text-sm">{set.weight}kg</p>
                            <p className="text-[10px] md:text-xs text-emerald-400 dark:text-emerald-600">×{set.reps}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] md:text-xs text-slate-400 dark:text-slate-600 flex flex-wrap gap-1">
                        <span>{completedSets.length}/{workoutEx.sets.length} series</span>
                        <span>•</span>
                        <span>{completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0)} kg</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {workout.notes && (
                <div className="mt-4 bg-slate-700/30 dark:bg-slate-200 border dark:border-slate-300 rounded-lg p-4">
                  <p className="text-xs text-slate-400 dark:text-slate-600 mb-1">Notas</p>
                  <p className="text-slate-300 dark:text-slate-900 text-sm">{workout.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
