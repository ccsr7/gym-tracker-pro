'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { Workout } from '@/types';
import { Trophy, Lock, Star, TrendingUp, Sparkles, Award } from 'lucide-react';
import { calculateAchievements, getAchievementStats, Achievement } from '@/lib/achievements';
import { storageService, STORAGE_KEYS } from '@/lib/storage-service';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const storedWorkouts = storageService.get<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    setWorkouts(storedWorkouts);

    const calculatedAchievements = calculateAchievements(storedWorkouts);
    setAchievements(calculatedAchievements);
  }, []);

  const stats = getAchievementStats(achievements);

  const categoryNames: Record<string, string> = {
    workouts: 'Entrenamientos',
    volume: 'Volumen',
    streak: 'Rachas',
    consistency: 'Consistencia',
    pr: 'Récords Personales'
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    if (selectedCategory && a.category !== selectedCategory) return false;
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

  // Calcular stats por categoría
  const categoryStats = Object.keys(categoryNames).map(cat => {
    const catAchievements = achievements.filter(a => a.category === cat);
    const unlocked = catAchievements.filter(a => a.unlocked).length;
    return {
      category: cat,
      total: catAchievements.length,
      unlocked,
      percentage: Math.round((unlocked / catAchievements.length) * 100)
    };
  });

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 dark:from-yellow-100 dark:to-amber-100 border-2 border-yellow-500/50 dark:border-yellow-300 rounded-xl p-6 mb-6 relative overflow-hidden"
          >
            {/* Sparkle effect for high completion */}
            {stats.percentage >= 75 && (
              <div className="absolute top-2 right-2">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <motion.h3
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-2xl font-bold text-white dark:text-amber-900"
                >
                  {stats.unlocked} / {stats.total}
                </motion.h3>
                <p className="text-yellow-200 dark:text-amber-700 text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Logros Desbloqueados
                </p>
              </div>
              <div className="text-right">
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="text-4xl font-bold text-yellow-500"
                >
                  {stats.percentage}%
                </motion.p>
                <p className="text-yellow-200 dark:text-amber-700 text-sm">Completado</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/50 dark:bg-amber-200 rounded-full h-4 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-4 rounded-full flex items-center justify-end pr-2 relative"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                {stats.percentage > 10 && (
                  <Star className="w-3 h-3 text-white relative z-10" />
                )}
              </motion.div>
            </div>

            {/* Milestone message */}
            {stats.percentage === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-4 text-center"
              >
                <p className="text-yellow-300 dark:text-amber-700 font-bold flex items-center justify-center gap-2">
                  <Award className="w-5 h-5" />
                  ¡Has desbloqueado todos los logros! 🎉
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <p className="text-sm text-slate-400 dark:text-slate-600 mb-3">Filtrar por categoría:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-yellow-500 text-white shadow-lg scale-105'
                    : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
                }`}
              >
                Todas
              </button>
              {categoryStats.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.category
                      ? 'bg-yellow-500 text-white shadow-lg scale-105'
                      : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
                  }`}
                >
                  {categoryNames[cat.category]} ({cat.unlocked}/{cat.total})
                </button>
              ))}
            </div>
          </motion.div>

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
                <AnimatePresence mode="popLayout">
                  {categoryAchievements.map((achievement, index) => {
                    const progress = workouts.length; // Simplificado para la demo, debería calcularse según categoría

                    return (
                      <motion.div
                        key={achievement.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05
                        }}
                        whileHover={achievement.unlocked ? { scale: 1.05, y: -5 } : {}}
                        className={`relative overflow-hidden rounded-xl border-2 p-5 transition-all cursor-pointer ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-slate-800/60 to-slate-800/40 dark:from-slate-50 dark:to-white border-yellow-500/50 dark:border-yellow-400 shadow-lg hover:shadow-yellow-500/20'
                            : 'bg-slate-800/40 dark:bg-slate-100 border-slate-700/50 dark:border-slate-300 opacity-60 hover:opacity-70'
                        }`}
                      >
                      {/* Locked Overlay */}
                      {!achievement.unlocked && (
                        <div className="absolute top-3 right-3">
                          <Lock className="w-5 h-5 text-slate-500 dark:text-slate-600" />
                        </div>
                      )}

                      {/* Shine effect for unlocked */}
                      {achievement.unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full animate-shine" />
                      )}

                      {/* Unlocked Badge */}
                      {achievement.unlocked && achievement.unlockedDate && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg"
                        >
                          <Trophy className="w-3 h-3" />
                          Desbloqueado
                        </motion.div>
                      )}

                      <div className="flex items-start gap-4 mb-3 relative z-10">
                        <motion.div
                          animate={achievement.unlocked ? {
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                          className={`text-5xl ${achievement.unlocked ? '' : 'grayscale'}`}
                        >
                          {achievement.icon}
                        </motion.div>
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-600 mb-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Progreso
                            </span>
                            <span className="font-mono">{Math.min(progress, achievement.requirement)} / {achievement.requirement}</span>
                          </div>
                          <div className="w-full bg-slate-700/50 dark:bg-slate-300 rounded-full h-2.5 relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((progress / achievement.requirement) * 100, 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2.5 rounded-full relative"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                          </div>
                        </motion.div>
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
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
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
