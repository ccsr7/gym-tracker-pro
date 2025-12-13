'use client';

import { Exercise } from '@/types';
import { X, Target, Dumbbell, TrendingUp, Heart, Plus, Info } from 'lucide-react';
import { getExerciseById } from '@/data/exercises';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ExerciseDetailModalProps {
  exerciseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExerciseDetailModal({ exerciseId, isOpen, onClose }: ExerciseDetailModalProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      const ex = getExerciseById(exerciseId);
      setExercise(ex || null);

      // Check if exercise is in favorites
      const favorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');
      setIsFavorite(favorites.includes(exerciseId));
    }
  }, [exerciseId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');

    if (isFavorite) {
      // Remove from favorites
      const updated = favorites.filter((id: string) => id !== exerciseId);
      localStorage.setItem('gym-tracker-favorites', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      // Add to favorites
      favorites.push(exerciseId);
      localStorage.setItem('gym-tracker-favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  if (!isOpen || !exercise) return null;

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Pecho': 'bg-orange-500',
      'Espalda': 'bg-blue-500',
      'Piernas': 'bg-purple-500',
      'Hombros': 'bg-yellow-500',
      'Brazos': 'bg-pink-500',
      'Core': 'bg-green-500',
      'Cardio': 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-slate-500';
    const colors: Record<string, string> = {
      'Principiante': 'bg-green-500',
      'Intermedio': 'bg-yellow-500',
      'Avanzado': 'bg-red-500',
    };
    return colors[difficulty] || 'bg-slate-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`${getCategoryColor(exercise.category)} text-white text-xs font-bold px-2 py-1 rounded`}>
                  {exercise.category}
                </span>
                {exercise.difficulty && (
                  <span className={`${getDifficultyColor(exercise.difficulty)} text-white text-xs font-bold px-2 py-1 rounded`}>
                    {exercise.difficulty}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{exercise.name}</h2>
              <p className="text-slate-400 text-sm">{exercise.muscleGroup}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Exercise Image */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800">
            <Image
              src={exercise.image}
              alt={exercise.name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show fallback emoji
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">🏋️</div>';
                }
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">Músculo Principal</span>
              </div>
              <p className="text-sm font-medium text-white">{exercise.muscleGroup}</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Equipamiento</span>
              </div>
              <p className="text-sm font-medium text-white">{exercise.equipment}</p>
            </div>
          </div>

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Cómo Hacerlo
              </h3>
              <ol className="space-y-2">
                {exercise.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-slate-300 text-sm flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Form Tips */}
          {exercise.formTips && exercise.formTips.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Tips de Forma
              </h3>
              <ul className="space-y-2">
                {exercise.formTips.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-yellow-400 flex-shrink-0">•</span>
                    <span className="text-slate-300 text-sm flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Muscles Worked */}
          {(exercise.primaryMuscles || exercise.secondaryMuscles) && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Músculos Trabajados</h3>
              <div className="space-y-3">
                {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Principales</p>
                    <div className="flex flex-wrap gap-2">
                      {exercise.primaryMuscles.map((muscle, index) => (
                        <span
                          key={index}
                          className="bg-purple-500/20 text-purple-300 text-xs font-medium px-3 py-1 rounded-full border border-purple-500/30"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Secundarios</p>
                    <div className="flex flex-wrap gap-2">
                      {exercise.secondaryMuscles.map((muscle, index) => (
                        <span
                          key={index}
                          className="bg-slate-700/50 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-600"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variations */}
          {exercise.variations && exercise.variations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Variaciones</h3>
              <div className="grid grid-cols-1 gap-2">
                {exercise.variations.map((variationId, index) => {
                  const variation = getExerciseById(variationId);
                  if (!variation) return null;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        // Switch to variation
                        setExercise(variation);
                        const favorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');
                        setIsFavorite(favorites.includes(variationId));
                      }}
                      className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{variation.name}</p>
                        <p className="text-xs text-slate-400">{variation.equipment}</p>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-6">
          <div className="flex gap-3">
            <button
              onClick={toggleFavorite}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isFavorite
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Heart className={`w-4 h-4 inline mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
