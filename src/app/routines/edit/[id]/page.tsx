'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Routine, DayOfWeek } from '@/types';
import { exercisesDatabase } from '@/data/exercises';
import {
  Plus,
  X,
  Search,
  Check,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function EditRoutinePage() {
  const router = useRouter();
  const params = useParams();
  const routineId = params?.id as string;

  const [name, setName] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Lunes');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [multiSelectMode, setMultiSelectMode] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const categories = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  useEffect(() => {
    if (routineId) {
      const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
      const routine = routines.find((r: Routine) => r.id === routineId);

      if (routine) {
        setName(routine.name);
        setDay(routine.day);
        setSelectedExercises(routine.exercises.map((e: any) => e.exerciseId));
      } else {
        router.push('/routines');
      }
      setLoading(false);
    }
  }, [routineId, router]);

  const filteredExercises = exercisesDatabase.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleExercise = (exerciseId: string) => {
    if (multiSelectMode.includes(exerciseId)) {
      setMultiSelectMode(multiSelectMode.filter(id => id !== exerciseId));
    } else {
      setMultiSelectMode([...multiSelectMode, exerciseId]);
    }
  };

  const handleAddSelected = () => {
    const newExercises = [...selectedExercises];
    multiSelectMode.forEach(id => {
      if (!newExercises.includes(id)) {
        newExercises.push(id);
      }
    });
    setSelectedExercises(newExercises);
    setMultiSelectMode([]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExercises = [...selectedExercises];
    const draggedItem = newExercises[draggedIndex];
    newExercises.splice(draggedIndex, 1);
    newExercises.splice(index, 0, draggedItem);

    setSelectedExercises(newExercises);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExercises.length - 1)
    ) {
      return;
    }

    const newExercises = [...selectedExercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setSelectedExercises(newExercises);
  };

  const handleSave = () => {
    if (!name.trim() || selectedExercises.length === 0) {
      alert('Por favor ingresa un nombre y selecciona al menos un ejercicio');
      return;
    }

    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const routineIndex = routines.findIndex((r: Routine) => r.id === routineId);

    if (routineIndex === -1) {
      alert('Rutina no encontrada');
      return;
    }

    // Check if day changed and conflicts with another routine
    const oldDay = routines[routineIndex].day;
    if (day !== oldDay) {
      const conflictIndex = routines.findIndex(
        (r: Routine) => r.day === day && r.id !== routineId
      );
      if (conflictIndex !== -1) {
        if (!confirm(`Ya existe una rutina para ${day}. ¿Deseas reemplazarla?`)) {
          return;
        }
        routines.splice(conflictIndex, 1);
      }
    }

    const updatedRoutine: Routine = {
      id: routineId,
      name,
      day,
      exercises: selectedExercises.map(id => ({
        exerciseId: id,
        sets: routines[routineIndex].exercises.find((e: any) => e.exerciseId === id)?.sets || 4,
        reps: routines[routineIndex].exercises.find((e: any) => e.exerciseId === id)?.reps || 12,
      })),
      duration: selectedExercises.length * 5,
    };

    routines[routineIndex] = updatedRoutine;
    localStorage.setItem('gym-tracker-routines', JSON.stringify(routines));
    router.push('/routines');
  };

  const handleDelete = () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta rutina?')) {
      return;
    }

    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const updatedRoutines = routines.filter((r: Routine) => r.id !== routineId);
    localStorage.setItem('gym-tracker-routines', JSON.stringify(updatedRoutines));
    router.push('/routines');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Editar Rutina</h1>
          <p className="text-slate-400">Modifica tu rutina de entrenamiento</p>
        </div>

        {/* Routine Name */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre de la Rutina
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rutina de Pecho y Tríceps"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Day Selection */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Día de la Semana
          </label>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  day === d
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {d.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Exercises */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Ejercicios ({selectedExercises.length})
            </h3>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No hay ejercicios agregados</p>
              <button
                onClick={() => setShowExercisePicker(true)}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                Agregar ejercicios
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedExercises.map((exerciseId, index) => {
                const exercise = exercisesDatabase.find(ex => ex.id === exerciseId);
                if (!exercise) return null;

                return (
                  <div
                    key={exerciseId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-slate-700/30 rounded-lg p-4 flex items-center gap-3 cursor-move hover:bg-slate-700/50 transition-colors ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{exercise.name}</p>
                      <p className="text-slate-400 text-sm">
                        {exercise.category} • {exercise.muscleGroup}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === selectedExercises.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveExercise(exerciseId)}
                        className="p-2 text-red-400 hover:text-red-300 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => router.push('/routines')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Guardar Cambios
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar Rutina
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Seleccionar Ejercicios</h2>
                <button
                  onClick={() => {
                    setShowExercisePicker(false);
                    setMultiSelectMode([]);
                  }}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ejercicios..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredExercises.map((exercise) => {
                  const isSelected = multiSelectMode.includes(exercise.id);
                  const isAlreadyAdded = selectedExercises.includes(exercise.id);

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => !isAlreadyAdded && handleToggleExercise(exercise.id)}
                      disabled={isAlreadyAdded}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        isAlreadyAdded
                          ? 'bg-slate-700/20 border-slate-700/50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-slate-700/30 border-slate-700/50 hover:bg-slate-700/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium mb-1">{exercise.name}</p>
                          <p className="text-sm text-slate-400">
                            {exercise.category} • {exercise.muscleGroup}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{exercise.equipment}</p>
                        </div>
                        {isSelected && (
                          <div className="bg-emerald-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isAlreadyAdded && (
                          <div className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                            Agregado
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">
                  {multiSelectMode.length} ejercicio(s) seleccionado(s)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExercisePicker(false);
                      setMultiSelectMode([]);
                    }}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddSelected}
                    disabled={multiSelectMode.length === 0}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Agregar Seleccionados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
