'use client';

import { useState, useEffect } from 'react';
import { X, Search, Link2 } from 'lucide-react';
import { Exercise } from '@/types';
import { getSimilarExercises, getExerciseLastWorkoutData } from '@/lib/exercise-utils';
import { getExerciseById } from '@/data/exercises';
import Image from 'next/image';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
  isSupersetExercise?: boolean;
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  currentExerciseId,
  onSelectExercise,
  isSupersetExercise = false
}: ExercisePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  const currentExercise = getExerciseById(currentExerciseId);

  useEffect(() => {
    if (!isOpen || !currentExercise) {
      setFilteredExercises([]);
      setSearchQuery('');
      return;
    }

    // Obtener ejercicios similares (misma categoría)
    const similarExercises = getSimilarExercises(currentExerciseId, true);

    // Aplicar filtro de búsqueda si existe
    if (searchQuery) {
      const filtered = similarExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(similarExercises);
    }
  }, [isOpen, currentExerciseId, searchQuery, currentExercise]);

  if (!isOpen || !currentExercise) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 dark:bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-700 dark:border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 dark:border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-2xl font-bold text-white dark:text-slate-900">
                Reemplazar {currentExercise.name}
              </h3>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
                Ejercicios de {currentExercise.category}
                {isSupersetExercise && (
                  <span className="ml-2 inline-flex items-center gap-1 text-purple-400 dark:text-purple-600">
                    <Link2 className="w-3 h-3" />
                    Parte de biserie
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o grupo muscular..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 dark:text-slate-600">
                {searchQuery
                  ? 'No se encontraron ejercicios con ese nombre'
                  : 'No hay ejercicios alternativos disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => {
                const lastWorkoutData = getExerciseLastWorkoutData(exercise.id);

                return (
                  <button
                    key={exercise.id}
                    onClick={() => onSelectExercise(exercise.id)}
                    className="bg-slate-700/30 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg p-4 hover:bg-slate-700/50 dark:hover:bg-slate-200 transition-all text-left group"
                  >
                    {/* Exercise Image */}
                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-slate-600/50 dark:bg-slate-200">
                      <Image
                        src={exercise.image}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Exercise Info */}
                    <h4 className="text-white dark:text-slate-900 font-bold text-lg mb-1 group-hover:text-blue-400 dark:group-hover:text-blue-600 transition-colors">
                      {exercise.name}
                    </h4>

                    <div className="space-y-1 mb-3">
                      <p className="text-slate-400 dark:text-slate-600 text-sm">
                        {exercise.muscleGroup}
                      </p>
                      <p className="text-slate-500 dark:text-slate-500 text-xs">
                        {exercise.equipment}
                      </p>
                    </div>

                    {/* Last Workout Badge */}
                    {lastWorkoutData && (
                      <div className="bg-emerald-500/20 dark:bg-emerald-100 border border-emerald-500/50 dark:border-emerald-300 rounded-lg px-3 py-2">
                        <p className="text-xs text-emerald-300 dark:text-emerald-700 font-medium">
                          Última vez: {lastWorkoutData.weight}kg × {lastWorkoutData.reps} reps
                        </p>
                      </div>
                    )}

                    {!lastWorkoutData && (
                      <div className="bg-blue-500/20 dark:bg-blue-100 border border-blue-500/50 dark:border-blue-300 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-300 dark:text-blue-700 font-medium">
                          Ejercicio nuevo
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
