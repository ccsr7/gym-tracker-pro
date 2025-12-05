'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Workout } from '@/types';
import { Calendar, Clock, Dumbbell, TrendingUp, Trash2, Edit2, Save, X, Search, SlidersHorizontal } from 'lucide-react';
import { getExerciseById } from '@/data/exercises';
import { formatWorkoutDuration } from '@/lib/utils';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { SkeletonWorkoutCard } from '@/components/ui/Skeleton';
import WorkoutCard from '@/components/history/WorkoutCard';
import CompareWorkouts from '@/components/history/CompareWorkouts';

export default function HistoryPage() {
  const { confirm, confirmState } = useConfirm();
  const toast = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  // Comparación
  const [comparingWorkout1, setComparingWorkout1] = useState<Workout | null>(null);
  const [comparingWorkout2, setComparingWorkout2] = useState<Workout | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workouts, searchTerm, selectedRoutine, dateFilter]);

  const loadWorkouts = () => {
    setLoading(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
        setWorkouts(storedWorkouts.reverse());
      }
      setLoading(false);
    }, 300);
  };

  const applyFilters = () => {
    let filtered = [...workouts];

    if (searchTerm) {
      filtered = filtered.filter(workout => {
        const routineMatch = workout.routineName.toLowerCase().includes(searchTerm.toLowerCase());
        const notesMatch = workout.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const exerciseMatch = workout.exercises.some(ex => {
          const exercise = getExerciseById(ex.exerciseId);
          return exercise?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
        return routineMatch || notesMatch || exerciseMatch;
      });
    }

    if (selectedRoutine !== 'all') {
      filtered = filtered.filter(w => w.routineName === selectedRoutine);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const daysMap = { '7days': 7, '30days': 30, '90days': 90 };
      const days = daysMap[dateFilter];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(w => new Date(w.date) >= cutoffDate);
    }

    setFilteredWorkouts(filtered);
  };

  const uniqueRoutines = Array.from(new Set(workouts.map(w => w.routineName)));

  const handleDeleteWorkout = async (workoutId: string) => {
    const shouldDelete = await confirm({
      title: '¿Eliminar entrenamiento?',
      message: '¿Estás seguro de que deseas eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!shouldDelete) return;

    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const updatedWorkouts = storedWorkouts.filter((w: Workout) => w.id !== workoutId);
    localStorage.setItem('gym-tracker-workouts', JSON.stringify(updatedWorkouts));

    loadWorkouts();
    toast.success('Entrenamiento eliminado correctamente');
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setEditedWorkout(JSON.parse(JSON.stringify(workout)));
  };

  const handleCancelEdit = () => {
    setEditingWorkout(null);
    setEditedWorkout(null);
  };

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    if (!editedWorkout) return;

    const updated = { ...editedWorkout };
    updated.exercises[exerciseIdx].sets[setIdx][field] = value;

    const totalVolume = updated.exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((exTotal, set) => {
        return exTotal + (set.completed ? set.reps * set.weight : 0);
      }, 0);
    }, 0);
    updated.totalVolume = totalVolume;

    setEditedWorkout(updated);
  };

  const handleSaveEdit = () => {
    if (!editedWorkout) return;

    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const updatedWorkouts = storedWorkouts.map((w: Workout) =>
      w.id === editedWorkout.id ? editedWorkout : w
    );
    localStorage.setItem('gym-tracker-workouts', JSON.stringify(updatedWorkouts));

    loadWorkouts();
    handleCancelEdit();
    toast.success('Entrenamiento actualizado correctamente');
  };

  const handleCompareWorkout = (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setComparingWorkout1(workout);
      setComparingWorkout2(null);
    }
  };

  const handleSelectWorkout2 = (workoutId: string) => {
    if (!workoutId) {
      setComparingWorkout2(null);
      return;
    }
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setComparingWorkout2(workout);
    }
  };

  const handleCloseCompare = () => {
    setComparingWorkout1(null);
    setComparingWorkout2(null);
  };

  if (workouts.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
        <Navigation />

        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Historial de Entrenamientos</h1>
          <p className="text-slate-400 dark:text-slate-600 mb-8">Revisa tus entrenamientos pasados y tu progreso</p>

          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="w-24 h-24 text-slate-600 mb-6" />
            <h3 className="text-2xl font-bold text-white dark:text-slate-900 mb-2">Sin entrenamientos registrados</h3>
            <p className="text-slate-400 dark:text-slate-600 text-center max-w-md">
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

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600" />
            <input
              type="text"
              placeholder="Buscar por rutina, ejercicio o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/40 dark:bg-white border border-slate-700/50 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              showFilters
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 border border-slate-700/50 dark:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filtros {(selectedRoutine !== 'all' || dateFilter !== 'all') && '(activos)'}
          </button>

          {showFilters && (
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 dark:text-slate-600 mb-2">Período</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Todos', value: 'all' as const },
                    { label: 'Últimos 7 días', value: '7days' as const },
                    { label: 'Últimos 30 días', value: '30days' as const },
                    { label: 'Últimos 90 días', value: '90days' as const }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateFilter === option.value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/50 dark:bg-white text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {uniqueRoutines.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 dark:text-slate-600 mb-2">Rutina</label>
                  <select
                    value={selectedRoutine}
                    onChange={(e) => setSelectedRoutine(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Todas las rutinas</option>
                    {uniqueRoutines.map((routine) => (
                      <option key={routine} value={routine}>
                        {routine}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedRoutine !== 'all' || dateFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedRoutine('all');
                    setDateFilter('all');
                    setSearchTerm('');
                  }}
                  className="w-full py-2 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-400 dark:text-slate-600">
              {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'resultado' : 'resultados'}
              {filteredWorkouts.length !== workouts.length && (
                <span className="ml-1">de {workouts.length} totales</span>
              )}
            </p>
          </div>
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
              {formatWorkoutDuration(workouts.reduce((acc, w) => acc + w.duration, 0))}
            </p>
          </div>
        </div>

        {/* Workouts List */}
        <div className="space-y-4">
          {loading ? (
            <>
              <SkeletonWorkoutCard />
              <SkeletonWorkoutCard />
              <SkeletonWorkoutCard />
            </>
          ) : filteredWorkouts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl">
              <Search className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-2">No se encontraron entrenamientos</h3>
              <p className="text-slate-400 dark:text-slate-600">
                {searchTerm || selectedRoutine !== 'all' || dateFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'Completa tu primer entrenamiento para ver tu historial aquí'}
              </p>
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={handleEditWorkout}
                onDelete={handleDeleteWorkout}
                onCompare={handleCompareWorkout}
              />
            ))
          )}
        </div>

        {/* Modal de Edición */}
        {editingWorkout && editedWorkout && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-800 dark:bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
              <div className="p-6 border-b border-slate-700 dark:border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white dark:text-slate-900">Editar Entrenamiento</h3>
                    <p className="text-slate-400 dark:text-slate-600 text-sm">{editedWorkout.routineName}</p>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {editedWorkout.exercises.map((workoutEx, exerciseIdx) => {
                    const exercise = getExerciseById(workoutEx.exerciseId);
                    if (!exercise) return null;

                    return (
                      <div
                        key={exerciseIdx}
                        className="bg-slate-700/30 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg p-4"
                      >
                        <h4 className="text-lg text-white dark:text-slate-900 font-bold mb-4">{exercise.name}</h4>

                        <div className="space-y-3">
                          {workoutEx.sets.map((set, setIdx) => (
                            <div
                              key={setIdx}
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                set.completed
                                  ? 'bg-slate-600/50 dark:bg-white'
                                  : 'bg-slate-600/30 dark:bg-slate-50 opacity-60'
                              }`}
                            >
                              <div className="flex-shrink-0 w-16">
                                <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">
                                  Serie {setIdx + 1}
                                </p>
                              </div>

                              <div className="flex-1 flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs text-slate-400 dark:text-slate-600 mb-1">Peso (kg)</label>
                                  <input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-slate-700 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 text-center font-bold"
                                    disabled={!set.completed}
                                    step="0.5"
                                  />
                                </div>

                                <div className="flex-1">
                                  <label className="block text-xs text-slate-400 dark:text-slate-600 mb-1">Reps</label>
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-slate-700 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 text-center font-bold"
                                    disabled={!set.completed}
                                  />
                                </div>

                                <div className="flex-shrink-0 w-20">
                                  <p className="text-xs text-slate-400 dark:text-slate-600 mb-1">Volumen</p>
                                  <p className="text-emerald-400 dark:text-emerald-600 font-bold text-sm">
                                    {set.completed ? set.weight * set.reps : 0}kg
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-600 dark:border-slate-300">
                          <p className="text-sm text-slate-400 dark:text-slate-600">
                            Volumen total: <span className="text-emerald-400 dark:text-emerald-600 font-bold">
                              {workoutEx.sets
                                .filter(s => s.completed)
                                .reduce((sum, s) => sum + (s.weight * s.reps), 0)}kg
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-slate-700 dark:border-slate-200">
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 bg-slate-700 dark:bg-slate-200 hover:bg-slate-600 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmState} />

      {/* Compare Modal */}
      {comparingWorkout1 && (
        <CompareWorkouts
          workout1={comparingWorkout1}
          workout2={comparingWorkout2}
          onClose={handleCloseCompare}
          availableWorkouts={workouts}
          onSelectWorkout2={handleSelectWorkout2}
        />
      )}
    </div>
  );
}
