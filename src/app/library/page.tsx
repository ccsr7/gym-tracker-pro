'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import ExerciseDetailModal from '@/components/ExerciseDetailModal';
import CustomExerciseModal from '@/components/CustomExerciseModal';
import { exercisesDatabase } from '@/data/exercises';
import { Exercise } from '@/types';
import { Heart, Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { getUserCustomExercises, deleteCustomExercise, deleteCustomExerciseImage } from '@/lib/supabase/services/custom-exercises';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

export default function LibraryPage() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [allExercises, setAllExercises] = useState<Exercise[]>(exercisesDatabase);
  const [exercises, setExercises] = useState<Exercise[]>(exercisesDatabase);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  const categories = ['Todos', 'Favoritos', 'Mis Ejercicios', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  // Load custom exercises from Supabase
  const loadCustomExercises = async () => {
    if (!user) {
      setCustomExercises([]);
      return;
    }

    setIsLoadingCustom(true);
    try {
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !supabaseUser) {
        console.error('[Library] Error getting user:', userError);
        setCustomExercises([]);
        return;
      }

      const customExs = await getUserCustomExercises(supabaseUser.id);
      setCustomExercises(customExs);

      // Combine with predefined exercises
      setAllExercises([...exercisesDatabase, ...customExs]);
    } catch (error) {
      console.error('[Library] Error loading custom exercises:', error);
      setCustomExercises([]);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');
    setFavorites(storedFavorites);

    // Load custom exercises
    loadCustomExercises();
  }, [pathname, user]); // Reload when navigating to library page or user changes

  useEffect(() => {
    filterExercises();
  }, [selectedCategory, searchQuery, favorites, allExercises]);

  const filterExercises = () => {
    let filtered = allExercises;

    if (selectedCategory === 'Favoritos') {
      filtered = filtered.filter(ex => favorites.includes(ex.id));
    } else if (selectedCategory === 'Mis Ejercicios') {
      filtered = customExercises;
    } else if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setExercises(filtered);
  };

  const toggleFavorite = (exerciseId: string) => {
    let newFavorites;
    if (favorites.includes(exerciseId)) {
      newFavorites = favorites.filter(id => id !== exerciseId);
    } else {
      newFavorites = [...favorites, exerciseId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('gym-tracker-favorites', JSON.stringify(newFavorites));
  };

  const getCategoryCount = (category: string) => {
    if (category === 'Todos') return allExercises.length;
    if (category === 'Favoritos') return favorites.length;
    if (category === 'Mis Ejercicios') return customExercises.length;
    return allExercises.filter(ex => ex.category === category).length;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
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

  const openExerciseDetail = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setIsModalOpen(true);
  };

  const closeExerciseDetail = () => {
    setIsModalOpen(false);
    setSelectedExerciseId(null);
    // Reload favorites to sync with modal changes
    const storedFavorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');
    setFavorites(storedFavorites);
  };

  const handleDeleteCustomExercise = async (exerciseId: string, imageUrl?: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio personalizado?')) {
      return;
    }

    try {
      // Delete image if exists
      if (imageUrl && imageUrl.includes('custom-exercises')) {
        await deleteCustomExerciseImage(imageUrl);
      }

      // Delete exercise
      const { success, error } = await deleteCustomExercise(exerciseId);

      if (!success) {
        alert(error || 'Error al eliminar el ejercicio');
        return;
      }

      // Reload custom exercises
      await loadCustomExercises();

      // If this exercise was selected, close the modal
      if (selectedExerciseId === exerciseId) {
        closeExerciseDetail();
      }
    } catch (error) {
      console.error('[Library] Error deleting custom exercise:', error);
      alert('Error al eliminar el ejercicio');
    }
  };

  const handleCustomExerciseSuccess = () => {
    // Reload custom exercises after creating a new one
    loadCustomExercises();
    setIsCustomModalOpen(false);
  };

  const isCustomExercise = (exerciseId: string) => {
    return exerciseId.startsWith('custom-');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Biblioteca</h1>
              <p className="text-slate-400 dark:text-slate-600">Explora todos los ejercicios disponibles</p>
            </div>
            {user && (
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Crear Ejercicio</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ejercicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 dark:bg-white border border-slate-700 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800/50 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
                  }`}
                >
                  {category}
                  <span className="text-xs opacity-75">{getCategoryCount(category)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Grid */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <StaggerItem key={exercise.id}>
                <div
                  onClick={() => openExerciseDetail(exercise.id)}
                  className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer"
                >
                  <div className="relative aspect-[3/4] bg-slate-700/50 dark:bg-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={exercise.image}
                      alt={exercise.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-emoji')) {
                          const emoji = document.createElement('span');
                          emoji.className = 'fallback-emoji text-6xl';
                          emoji.textContent = '🏋️';
                          parent.appendChild(emoji);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(exercise.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-slate-900/80 dark:bg-white/90 rounded-full hover:bg-slate-800 dark:hover:bg-white transition-colors border dark:border-slate-300"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(exercise.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      />
                    </button>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getCategoryColor(exercise.category)} text-white`}>
                        {exercise.category}
                      </span>
                      {isCustomExercise(exercise.id) && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500 text-white">
                          Custom
                        </span>
                      )}
                    </div>
                    {isCustomExercise(exercise.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomExercise(exercise.id, exercise.image);
                        }}
                        className="absolute bottom-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                        title="Eliminar ejercicio"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-white dark:text-slate-900 font-bold mb-1">{exercise.name}</h3>
                    <p className="text-slate-400 dark:text-slate-600 text-sm mb-2">{exercise.muscleGroup}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-600 bg-slate-700/50 dark:bg-slate-200 px-2 py-1 rounded">
                        {exercise.equipment}
                      </span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {exercises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 dark:text-slate-600 text-lg">No se encontraron ejercicios</p>
            </div>
          )}
        </div>
      </PageTransition>

      {/* Exercise Detail Modal */}
      {selectedExerciseId && (
        <ExerciseDetailModal
          exerciseId={selectedExerciseId}
          isOpen={isModalOpen}
          onClose={closeExerciseDetail}
        />
      )}

      {/* Custom Exercise Modal */}
      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSuccess={handleCustomExerciseSuccess}
      />
    </div>
  );
}
