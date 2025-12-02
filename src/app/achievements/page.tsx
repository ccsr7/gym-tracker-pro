'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { Workout } from '@/types';
import { Trophy, Lock, Star, TrendingUp } from 'lucide-react';
import { calculateAchievements, getAchievementStats, Achievement } from '@/lib/achievements';

export default function AchievementsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    setWorkouts(storedWorkouts);

    const calculatedAchievements = calculateAchievements(storedWorkouts);
    setAchievements(calculatedAchievements);
  }, []);

  const stats = getAchievementStats(achievements);

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  // Agrupar por categoría
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryNames: Record<string, string> = {
    workouts: 'Entrenamientos',
    volume: 'Volumen',
    streak: 'Rachas',
    consistency: 'Consistencia',
    pr: 'Récords Personales'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white dark:text-slate-900">Logros</h1>
            </div>
            <p className="text-slate-400 dark:text-slate-600">Desbloquea logros mientras progresas</p>
          </div>

          {/* Stats Overview */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 dark:from-yellow-100 dark:to-amber-100 border-2 border-yellow-500/50 dark:border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white dark:text-amber-900">
                  {stats.unlocked} / {stats.total}
                </h3>
                <p className="text-yellow-200 dark:text-amber-700 text-sm">Logros Desbloqueados</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-yellow-500">{stats.percentage}%</p>
                <p className="text-yellow-200 dark:text-amber-700 text-sm">Completado</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/50 dark:bg-amber-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${stats.percentage}%` }}
              >
                {stats.percentage > 10 && (
                  <Star className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { label: 'Todos', value: 'all' as const },
              { label: `Desbloqueados (${stats.unlocked})`, value: 'unlocked' as const },
              { label: `Bloqueados (${stats.locked})`, value: 'locked' as const }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === filterOption.value
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {/* Achievements by Category */}
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-bold text-white dark:text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                {categoryNames[category]}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => {
                  const progress = workouts.length; // Simplificado para la demo, debería calcularse según categoría

                  return (
                    <div
                      key={achievement.id}
                      className={`relative overflow-hidden rounded-xl border-2 p-5 transition-all ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-slate-800/60 to-slate-800/40 dark:from-slate-50 dark:to-white border-yellow-500/50 dark:border-yellow-400 shadow-lg'
                          : 'bg-slate-800/40 dark:bg-slate-100 border-slate-700/50 dark:border-slate-300 opacity-60'
                      }`}
                    >
                      {/* Locked Overlay */}
                      {!achievement.unlocked && (
                        <div className="absolute top-3 right-3">
                          <Lock className="w-5 h-5 text-slate-500 dark:text-slate-600" />
                        </div>
                      )}

                      {/* Unlocked Badge */}
                      {achievement.unlocked && achievement.unlockedDate && (
                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                          ✓ Desbloqueado
                        </div>
                      )}

                      <div className="flex items-start gap-4 mb-3">
                        <div className={`text-5xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-1 ${
                            achievement.unlocked
                              ? achievement.color + ' dark:text-slate-900'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-sm ${
                            achievement.unlocked
                              ? 'text-slate-300 dark:text-slate-700'
                              : 'text-slate-500 dark:text-slate-600'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      {/* Progress for locked achievements */}
                      {!achievement.unlocked && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-600 mb-1">
                            <span>Progreso</span>
                            <span>{Math.min(progress, achievement.requirement)} / {achievement.requirement}</span>
                          </div>
                          <div className="w-full bg-slate-700/50 dark:bg-slate-300 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((progress / achievement.requirement) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Unlock date */}
                      {achievement.unlocked && achievement.unlockedDate && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50 dark:border-slate-300">
                          <p className="text-xs text-slate-400 dark:text-slate-600">
                            Desbloqueado el {new Date(achievement.unlockedDate).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 dark:text-slate-600 text-lg mb-2">
                {filter === 'unlocked' ? 'Aún no has desbloqueado ningún logro' : 'No hay logros bloqueados'}
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                {filter === 'unlocked' ? '¡Sigue entrenando para desbloquear logros!' : '¡Has desbloqueado todos los logros!'}
              </p>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
