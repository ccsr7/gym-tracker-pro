'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Routine, DayOfWeek, RoutineExercise } from '@/types';
import { exercisesDatabase } from '@/data/exercises';
import {
  Plus,
  X,
  Search,
  Check,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2
} from 'lucide-react';

export default function CreateRoutinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDay = searchParams?.get('day') as DayOfWeek | null;

  const [name, setName] = useState('');
  const [day, setDay] = useState<DayOfWeek>(preselectedDay || 'Lunes');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [multiSelectMode, setMultiSelectMode] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [supersetSelection, setSupersetSelection] = useState<number | null>(null);
  const [isRestDay, setIsRestDay] = useState(false);

  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const categories = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

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
      if (!newExercises.find(ex => ex.exerciseId === id)) {
        newExercises.push({
          exerciseId: id,
          sets: 4,
          reps: 12,
        });
      }
    });
    setSelectedExercises(newExercises);
    setMultiSelectMode([]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    const exercise = selectedExercises[index];
    const newExercises = selectedExercises.filter((_, i) => i !== index);

    // Remove superset links
    newExercises.forEach(ex => {
      if (ex.isSupersetWith === exercise.exerciseId) {
        delete ex.isSupersetWith;
      }
    });

    setSelectedExercises(newExercises);
    if (supersetSelection === index) {
      setSupersetSelection(null);
    }
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

  const toggleSuperset = (index: number) => {
    if (supersetSelection === null) {
      setSupersetSelection(index);
    } else if (supersetSelection === index) {
      setSupersetSelection(null);
    } else {
      // Create superset link
      const newExercises = [...selectedExercises];
      const exercise1 = newExercises[supersetSelection];
      const exercise2 = newExercises[index];

      // Remove any existing superset links
      delete exercise1.isSupersetWith;
      delete exercise2.isSupersetWith;

      // Create new superset link
      exercise1.isSupersetWith = exercise2.exerciseId;
      exercise2.isSupersetWith = exercise1.exerciseId;

      setSelectedExercises(newExercises);
      setSupersetSelection(null);
    }
  };

  const removeSuperset = (index: number) => {
    const newExercises = [...selectedExercises];
    const exercise = newExercises[index];

    if (exercise.isSupersetWith) {
      const partnerExercise = newExercises.find(ex => ex.exerciseId === exercise.isSupersetWith);
      if (partnerExercise) {
        delete partnerExercise.isSupersetWith;
      }
      delete exercise.isSupersetWith;
    }

    setSelectedExercises(newExercises);
  };

  const updateExercise = (index: number, field: 'sets' | 'reps', value: number) => {
    const newExercises = [...selectedExercises];
    newExercises[index][field] = value;
    setSelectedExercises(newExercises);
  };

  const handleSave = () => {
    // Validar según si es día de descanso o no
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el día');
      return;
    }

    if (!isRestDay && selectedExercises.length === 0) {
      alert('Por favor selecciona al menos un ejercicio o marca como día de descanso');
      return;
    }

    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');

    // Check if there's already a routine for this day
    const existingIndex = routines.findIndex((r: Routine) => r.day === day);
    if (existingIndex !== -1) {
      if (!confirm(`Ya existe una rutina para ${day}. ¿Deseas reemplazarla?`)) {
        return;
      }
      routines.splice(existingIndex, 1);
    }

    const newRoutine: Routine = {
      id: Date.now().toString(),
      name,
      day,
      exercises: isRestDay ? [] : selectedExercises,
      duration: isRestDay ? 0 : selectedExercises.length * 5,
      isRestDay,
    };

    routines.push(newRoutine);
    localStorage.setItem('gym-tracker-routines', JSON.stringify(routines));
    router.push('/routines');
  };

  const isInSuperset = (index: number) => {
    return selectedExercises[index].isSupersetWith !== undefined;
  };

  const getSupersetPartnerIndex = (index: number) => {
    const exercise = selectedExercises[index];
    if (!exercise.isSupersetWith) return null;
    return selectedExercises.findIndex(ex => ex.exerciseId === exercise.isSupersetWith);
  };

  // Define color palette for supersets
  const supersetColors = [
    { bg: 'bg-purple-500/20', border: 'border-purple-500/50', badge: 'bg-purple-500', text: 'text-purple-400', textDark: 'text-purple-600', hoverText: 'text-purple-300', hoverTextDark: 'text-purple-500' },
    { bg: 'bg-blue-500/20', border: 'border-blue-500/50', badge: 'bg-blue-500', text: 'text-blue-400', textDark: 'text-blue-600', hoverText: 'text-blue-300', hoverTextDark: 'text-blue-500' },
    { bg: 'bg-pink-500/20', border: 'border-pink-500/50', badge: 'bg-pink-500', text: 'text-pink-400', textDark: 'text-pink-600', hoverText: 'text-pink-300', hoverTextDark: 'text-pink-500' },
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', badge: 'bg-cyan-500', text: 'text-cyan-400', textDark: 'text-cyan-600', hoverText: 'text-cyan-300', hoverTextDark: 'text-cyan-500' },
    { bg: 'bg-green-500/20', border: 'border-green-500/50', badge: 'bg-green-500', text: 'text-green-400', textDark: 'text-green-600', hoverText: 'text-green-300', hoverTextDark: 'text-green-500' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', badge: 'bg-amber-500', text: 'text-amber-400', textDark: 'text-amber-600', hoverText: 'text-amber-300', hoverTextDark: 'text-amber-500' },
  ];

  // Get superset group index for color assignment
  const getSupersetGroupIndex = (index: number) => {
    const exercise = selectedExercises[index];
    if (!exercise.isSupersetWith) return -1;

    // Find all unique superset groups
    const supersetGroups: string[][] = [];
    const processed = new Set<string>();

    selectedExercises.forEach((ex) => {
      if (ex.isSupersetWith && !processed.has(ex.exerciseId)) {
        const partner = selectedExercises.find(e => e.exerciseId === ex.isSupersetWith);
        if (partner) {
          const group = [ex.exerciseId, partner.exerciseId].sort();
          supersetGroups.push(group);
          processed.add(ex.exerciseId);
          processed.add(partner.exerciseId);
        }
      }
    });

    // Find which group this exercise belongs to
    const groupIndex = supersetGroups.findIndex(group =>
      group.includes(exercise.exerciseId)
    );

    return groupIndex;
  };

  const getSupersetColor = (index: number) => {
    const groupIndex = getSupersetGroupIndex(index);
    if (groupIndex === -1) return null;
    return supersetColors[groupIndex % supersetColors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Nueva Rutina</h1>
          <p className="text-slate-400 dark:text-slate-600">Crea una rutina personalizada para tu entrenamiento</p>
        </div>

        {/* Routine Name */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
            Nombre de la Rutina
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rutina de Pecho y Tríceps"
            className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Day Selection */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-3">
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
                    : 'bg-slate-700/50 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-300'
                }`}
              >
                {d.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Rest Day Toggle */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-lg font-medium text-white dark:text-slate-900">Día de Descanso</p>
              <p className="text-sm text-slate-400 dark:text-slate-600">Marcar este día como descanso programado</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRestDay(!isRestDay)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isRestDay ? 'bg-purple-500' : 'bg-slate-700 dark:bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isRestDay ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Selected Exercises - Only show if not rest day */}
        {!isRestDay && (
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white dark:text-slate-900">
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

          {supersetSelection !== null && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-sm text-blue-300 dark:text-blue-700">
                Modo biserie activado. Selecciona otro ejercicio para crear la biserie, o haz clic de nuevo para cancelar.
              </p>
            </div>
          )}

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 dark:text-slate-600 mb-4">No hay ejercicios agregados</p>
              <button
                onClick={() => setShowExercisePicker(true)}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                Agregar ejercicios
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedExercises.map((routineExercise, index) => {
                const exercise = exercisesDatabase.find(ex => ex.id === routineExercise.exerciseId);
                if (!exercise) return null;

                const inSuperset = isInSuperset(index);
                const partnerIndex = getSupersetPartnerIndex(index);
                const isSelected = supersetSelection === index;
                const supersetColor = getSupersetColor(index);

                return (
                  <div key={`${routineExercise.exerciseId}-${index}`}>
                    <div
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-lg p-4 flex items-center gap-3 cursor-move transition-all ${
                        draggedIndex === index ? 'opacity-50' : ''
                      } ${
                        isSelected ? 'bg-blue-500/30 border-2 border-blue-500' :
                        inSuperset && supersetColor ? `${supersetColor.bg} border-2 ${supersetColor.border}` :
                        'bg-slate-700/30 dark:bg-slate-200/50 hover:bg-slate-700/50 dark:hover:bg-slate-200'
                      }`}
                    >
                      <GripVertical className="w-5 h-5 text-slate-500 dark:text-slate-600" />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white dark:text-slate-900 font-medium">{exercise.name}</p>
                          {inSuperset && supersetColor && (
                            <span className={`text-xs ${supersetColor.badge} text-white px-2 py-0.5 rounded-full flex items-center gap-1`}>
                              <Link2 className="w-3 h-3" />
                              Biserie
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 dark:text-slate-600 text-sm">
                          {exercise.category} • {exercise.muscleGroup}
                        </p>

                        {/* Sets and Reps */}
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 dark:text-slate-600">Series:</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={routineExercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 bg-slate-600/50 dark:bg-white border border-slate-500 dark:border-slate-300 rounded text-white dark:text-slate-900 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 dark:text-slate-600">Reps:</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={routineExercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 bg-slate-600/50 dark:bg-white border border-slate-500 dark:border-slate-300 rounded text-white dark:text-slate-900 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {inSuperset && supersetColor ? (
                          <button
                            onClick={() => removeSuperset(index)}
                            className={`p-2 ${supersetColor.text} hover:${supersetColor.hoverText} dark:${supersetColor.textDark} dark:hover:${supersetColor.hoverTextDark}`}
                            title="Quitar biserie"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleSuperset(index)}
                            className={`p-2 transition-colors ${
                              isSelected
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-slate-400 hover:text-white dark:text-slate-600 dark:hover:text-slate-900'
                            }`}
                            title="Crear biserie"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === selectedExercises.length - 1}
                          className="p-1 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveExercise(index)}
                          className="p-2 text-red-400 hover:text-red-300 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/routines')}
            className="flex-1 bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Guardar Rutina
          </button>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 dark:bg-white border border-slate-700 dark:border-slate-300 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 dark:border-slate-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white dark:text-slate-900">Seleccionar Ejercicios</h2>
                <button
                  onClick={() => {
                    setShowExercisePicker(false);
                    setMultiSelectMode([]);
                  }}
                  className="p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ejercicios..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        : 'bg-slate-700/50 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-300'
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
                  const isAlreadyAdded = selectedExercises.find(ex => ex.exerciseId === exercise.id);

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => !isAlreadyAdded && handleToggleExercise(exercise.id)}
                      disabled={!!isAlreadyAdded}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        isAlreadyAdded
                          ? 'bg-slate-700/20 dark:bg-slate-200/50 border-slate-700/50 dark:border-slate-300 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-white dark:text-slate-900'
                          : 'bg-slate-700/30 dark:bg-slate-100 border-slate-700/50 dark:border-slate-300 hover:bg-slate-700/50 dark:hover:bg-slate-200 text-slate-200 dark:text-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium mb-1">{exercise.name}</p>
                          <p className="text-sm text-slate-400 dark:text-slate-600">
                            {exercise.category} • {exercise.muscleGroup}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{exercise.equipment}</p>
                        </div>
                        {isSelected && (
                          <div className="bg-emerald-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isAlreadyAdded && (
                          <div className="text-xs text-slate-500 dark:text-slate-600 bg-slate-700 dark:bg-slate-300 px-2 py-1 rounded">
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
            <div className="p-6 border-t border-slate-700 dark:border-slate-300">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 dark:text-slate-600 text-sm">
                  {multiSelectMode.length} ejercicio(s) seleccionado(s)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExercisePicker(false);
                      setMultiSelectMode([]);
                    }}
                    className="px-6 py-3 bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-medium rounded-lg transition-colors"
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
