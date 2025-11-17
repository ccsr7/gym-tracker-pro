'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { exercisesDatabase } from '@/data/exercises';
import { Exercise } from '@/types';
import { Heart, Search } from 'lucide-react';

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>(exercisesDatabase);
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories = ['Todos', 'Favoritos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('gym-tracker-favorites') || '[]');
    setFavorites(storedFavorites);
  }, []);

  useEffect(() => {
    filterExercises();
  }, [selectedCategory, searchQuery, favorites]);

  const filterExercises = () => {
    let filtered = exercisesDatabase;

    if (selectedCategory === 'Favoritos') {
      filtered = filtered.filter(ex => favorites.includes(ex.id));
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
    if (category === 'Todos') return exercisesDatabase.length;
    if (category === 'Favoritos') return favorites.length;
    return exercisesDatabase.filter(ex => ex.category === category).length;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Biblioteca</h1>
            <p className="text-slate-400 dark:text-slate-600">Explora todos los ejercicios disponibles</p>
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
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <StaggerItem key={exercise.id}>
                <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all">
                  <div className="relative aspect-video bg-slate-700/50 dark:bg-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={exercise.image}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
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
                      onClick={() => toggleFavorite(exercise.id)}
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
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getCategoryColor(exercise.category)} text-white`}>
                        {exercise.category}
                      </span>
                    </div>
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
    </div>
  );
}
